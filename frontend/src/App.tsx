import { useState, useRef, useEffect } from 'react';
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Button } from "@/components/ui/button";
import './App.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// College coordinates
const COLLEGE_COORDINATES = {
  lat: 21.0047,
  lng: 79.0476
};

// Campus locations
const CAMPUS_LOCATIONS = [
  { id: "canteen", name: "Canteen", coordinates: [21.0052, 79.0480] },
  { id: "library", name: "Library", coordinates: [21.0045, 79.0482] },
  { id: "auditorium", name: "Auditorium", coordinates: [21.0040, 79.0478] },
  { id: "sports-complex", name: "Sports Complex", coordinates: [21.0055, 79.0470] },
  { id: "admin-block", name: "Admin Block", coordinates: [21.0048, 79.0473] }
];

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  location?: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", text: "Welcome to St. Vincent Pallotti College of Engineering and Technology Campus Guide! How can I help you today?", isUser: false }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Use college entrance as default location if user location is not available
          setUserLocation([21.0060, 79.0490]);
        }
      );
    }
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize or update map when showing
  useEffect(() => {
    if (showMap && mapContainerRef.current && selectedLocation) {
      // If map doesn't exist, create it
      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current).setView([COLLEGE_COORDINATES.lat, COLLEGE_COORDINATES.lng], 17);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(mapRef.current);
      }

      // Clear existing markers and paths
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          mapRef.current?.removeLayer(layer);
        }
      });

      // Add college marker
      L.marker([COLLEGE_COORDINATES.lat, COLLEGE_COORDINATES.lng])
        .addTo(mapRef.current)
        .bindPopup("St. Vincent Pallotti College")
        .openPopup();

      // Add user location if available
      if (userLocation) {
        L.marker(userLocation as [number, number])
          .addTo(mapRef.current)
          .bindPopup("You are here");
      }

      // Add selected location marker
      const locationInfo = CAMPUS_LOCATIONS.find(loc => loc.id === selectedLocation);
      if (locationInfo) {
        const locationCoords = locationInfo.coordinates as [number, number];
        
        L.marker(locationCoords)
          .addTo(mapRef.current)
          .bindPopup(`${locationInfo.name}`)
          .openPopup();
        
        // Draw path from user location to selected location
        if (userLocation) {
          L.polyline([userLocation, locationCoords], {color: 'blue', weight: 3}).addTo(mapRef.current);
          
          // Fit bounds to show both user and destination
          mapRef.current.fitBounds([userLocation, locationCoords]);
        } else {
          mapRef.current.setView(locationCoords, 17);
        }
      }
      
      // Handle map resize after a short delay to ensure it renders correctly
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }

    // Cleanup function
    return () => {
      if (mapRef.current && !showMap) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [showMap, selectedLocation, userLocation]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    
    // Process the message and generate a response
    processUserMessage(inputValue);
  };

  const processUserMessage = (message: string) => {
    const lowerMsg = message.toLowerCase();
    
    // Check if message is asking about a location
    const locationKeywords = ["where", "find", "located", "location", "direction", "how to get", "where is"];
    const isAskingLocation = locationKeywords.some(keyword => lowerMsg.includes(keyword));
    
    // Identify which location they're asking about
    let matchedLocation = null;
    for (const location of CAMPUS_LOCATIONS) {
      if (lowerMsg.includes(location.id) || lowerMsg.includes(location.name.toLowerCase())) {
        matchedLocation = location;
        break;
      }
    }
    
    // Generate response based on the message content
    setTimeout(() => {
      if (isAskingLocation && matchedLocation) {
        setSelectedLocation(matchedLocation.id);
        setShowMap(true);
        
        const responseMsg: Message = {
          id: Date.now().toString(),
          text: `${matchedLocation.name} is located in the ${getDirectionDescription(matchedLocation.id)} part of the campus. I've opened a map with directions from your current location.`,
          isUser: false,
          location: matchedLocation.id
        };
        
        setMessages(prev => [...prev, responseMsg]);
      } 
      else if (isAskingLocation) {
        // They're asking about a location but we don't know which one
        const responseMsg: Message = {
          id: Date.now().toString(),
          text: "I can help you find locations on campus. Which place are you looking for? You can try asking about the canteen, library, auditorium, sports complex, or admin block.",
          isUser: false
        };
        
        setMessages(prev => [...prev, responseMsg]);
      }
      else if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
        const responseMsg: Message = {
          id: Date.now().toString(),
          text: "Hello! I'm your campus guide for St. Vincent Pallotti College. How can I help you today?",
          isUser: false
        };
        
        setMessages(prev => [...prev, responseMsg]);
      }
      else {
        const responseMsg: Message = {
          id: Date.now().toString(),
          text: "I'm here to help you navigate around the campus. You can ask me things like 'Where is the library?' or 'How do I get to the canteen?'",
          isUser: false
        };
        
        setMessages(prev => [...prev, responseMsg]);
      }
    }, 500);
  };

  const getDirectionDescription = (locationId: string): string => {
    switch(locationId) {
      case "canteen": return "northern";
      case "library": return "eastern";
      case "auditorium": return "southern";
      case "sports-complex": return "northwestern";
      case "admin-block": return "central";
      default: return "central";
    }
  };

  const handleLocationButtonClick = (locationId: string) => {
    const location = CAMPUS_LOCATIONS.find(loc => loc.id === locationId);
    if (location) {
      setInputValue(`Where is the ${location.name.toLowerCase()}?`);
      // Auto-submit after a short delay
      setTimeout(() => {
        const event = new Event('submit') as unknown as React.FormEvent;
        handleSendMessage(event);
      }, 100);
    }
  };

  const closeMap = () => {
    setShowMap(false);
    setSelectedLocation(null);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background Beams Layer */}
      <BackgroundBeams className="absolute inset-0 z-0" />
      
      {/* Main Content - Side by Side Layout */}
      <div className="relative z-10 w-full h-full flex flex-col md:flex-row">
        {/* Left Side: Chat Panel */}
        <div className={`${showMap ? 'md:w-1/2' : 'w-full'} h-full flex flex-col transition-all duration-300 ease-in-out`}>
          {/* Header */}
          <header className="py-4 text-center">
            <h1 className="text-3xl font-bold text-white tracking-wider">Campus Guide</h1>
            <p className="text-gray-300 mt-1">St. Vincent Pallotti College of Engineering</p>
          </header>

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
            <div className="w-full max-w-2xl bg-black/30 backdrop-blur-sm rounded-lg border border-white/20 flex flex-col h-full">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.isUser 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-gray-700 text-white rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Quick Access Buttons */}
              <div className="p-2 border-t border-white/20">
                <div className="flex flex-wrap gap-2 justify-center mb-2">
                  {CAMPUS_LOCATIONS.map((location) => (
                    <Button
                      key={location.id}
                      variant="outline"
                      size="sm"
                      className="bg-black/40 text-white border-white/30 hover:bg-white/10"
                      onClick={() => handleLocationButtonClick(location.id)}
                    >
                      {location.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-2 border-t border-white/20 flex">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about campus locations..."
                  className="flex-1 bg-black/40 text-white rounded-l-md p-2 outline-none border border-white/30 focus:border-blue-500"
                />
                <Button 
                  type="submit" 
                  className="rounded-l-none"
                  disabled={!inputValue.trim()}
                >
                  Send
                </Button>
              </form>
            </div>
          </div>
        </div>
        
        {/* Right Side: Map Panel (conditionally rendered) */}
        {showMap && (
          <div className="md:w-1/2 h-full p-4 flex flex-col">
            <div className="relative flex-1 bg-black/30 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
              {/* Map Container */}
              <div ref={mapContainerRef} className="h-full w-full"></div>
              
              {/* Map Controls */}
              <div className="absolute top-4 right-4 z-20">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-black/60 text-white border-white/30 hover:bg-white/10"
                  onClick={closeMap}
                >
                  Close Map
                </Button>
              </div>
              
              {/* Location Info */}
              {selectedLocation && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 text-white p-3 rounded-lg z-20">
                  <h3 className="font-bold">
                    {CAMPUS_LOCATIONS.find(loc => loc.id === selectedLocation)?.name}
                  </h3>
                  <p className="text-sm">
                    Located in the {getDirectionDescription(selectedLocation)} part of campus.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;