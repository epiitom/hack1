import { useState, useRef, useEffect } from 'react';
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/login-form";
import './App.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { API_BASE_URL } from './config/api';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  location?: string;
}

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  direction: string;
}

interface College {
  id: number;
  name: string;
  lat: number;
  lng: number;  
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", text: "Welcome to St. Vincent Pallotti College of Engineering and Technology Campus Guide! How can I help you today?", isUser: false }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [campusLocations, setCampusLocations] = useState<Location[]>([]);
  const [collegeInfo, setCollegeInfo] = useState<College | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch campus locations and college info on component mount
  useEffect(() => {
    fetchLocations();
    fetchCollegeInfo();
  }, []);

  // Fetch locations from backend
  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setCampusLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  // Fetch college info from backend
  const fetchCollegeInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/college`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setCollegeInfo(data);
    } catch (error) {
      console.error('Error fetching college info:', error);
    }
  };

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
    if (showMap && mapContainerRef.current) {
      // If map doesn't exist, create it
      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current).setView([21.0047, 79.0476], 17);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapRef.current);
      }

      // Clear existing markers and paths
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          mapRef.current?.removeLayer(layer);
        }
      });

      // Add markers and paths if location is selected
      if (selectedLocation && campusLocations.length > 0) {
        const locationInfo = campusLocations.find(loc => loc.id === selectedLocation);
        if (locationInfo) {
          const locationCoords: [number, number] = [locationInfo.lat, locationInfo.lng];
          
          // Add destination marker with custom icon
          const destinationIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });

          L.marker(locationCoords, { icon: destinationIcon })
            .addTo(mapRef.current)
            .bindPopup(`<b>${locationInfo.name}</b><br>Click for directions`)
            .openPopup();
          
          // Add user location if available
          if (userLocation) {
            const userIcon = L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            });

            L.marker(userLocation, { icon: userIcon })
              .addTo(mapRef.current)
              .bindPopup('You are here');

            // Draw path from user to destination
            L.polyline([userLocation, locationCoords], {
              color: '#4F46E5',
              weight: 4,
              opacity: 0.8,
              dashArray: '10, 10'
            }).addTo(mapRef.current);

            // Fit bounds to show both markers
            mapRef.current.fitBounds([userLocation, locationCoords], {
              padding: [50, 50]
            });
          } else {
            mapRef.current.setView(locationCoords, 18);
          }
        }
      }

      // Handle map resize
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }

    return () => {
      if (mapRef.current && !showMap) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [showMap, selectedLocation, userLocation, campusLocations]);

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
    setIsLoading(true);
    
    // Increment question count
    setQuestionCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 3 && !isLoggedIn) {
        setShowLoginForm(true);
      }
      return newCount;
    });
    
    // Process the message and generate a response
    processUserMessage(inputValue);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setShowLoginForm(false);
  };

  const processUserMessage = async (message: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/campus-guide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ query: message }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      
      const responseMsg: Message = {
        id: Date.now().toString(),
        text: data.message,
        isUser: false,
        location: data.location?.id,
      };
      
      setMessages(prev => [...prev, responseMsg]);
      
      if (data.showMap && data.location) {
        setSelectedLocation(data.location.id);
        setShowMap(true);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Fallback response
      const fallbackMsg: Message = {
        id: Date.now().toString(),
        text: "Sorry, I'm having trouble connecting to the server. Please try again later.",
        isUser: false,
      };
      
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationButtonClick = (locationId: string) => {
    const location = campusLocations.find(loc => loc.id === locationId);
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
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-black to-gray-900">
      <BackgroundBeams className="absolute inset-0 z-0 opacity-50" />
      
      {/* Login Form Modal */}
      {showLoginForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-full max-w-md mx-4">
            <LoginForm className="bg-white" onSubmit={handleLogin} />
          </div>
        </div>
      )}
      
      <div className="relative z-10 w-full h-full flex flex-col md:flex-row">
        {/* Left Side: Chat Panel */}
        <div className={`${showMap ? 'md:w-1/2' : 'w-full'} h-full flex flex-col transition-all duration-300 ease-in-out`}>
          {/* Header */}
          <header className="py-4 text-center bg-black/40 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
            <h1 className="text-3xl font-bold text-white tracking-wider">Campus Guide</h1>
            <p className="text-gray-300 mt-1">St. Vincent Pallotti College of Engineering</p>
            {!isLoggedIn && (
              <p className="text-sm text-gray-400 mt-2">
                Questions remaining: {3 - questionCount}
              </p>
            )}
          </header>

          {/* Chat Interface */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="w-full h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/20 flex flex-col shadow-2xl">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} items-end space-x-2`}
                  >
                    {!msg.isUser && (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm flex-shrink-0">
                        AI
                      </div>
                    )}
                    <div 
                      className={`max-w-[80%] p-4 rounded-2xl ${
                        msg.isUser 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-gray-800 text-white rounded-bl-none'
                      } shadow-lg`}
                    >
                      <p className="text-base leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start items-end space-x-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm flex-shrink-0">
                      AI
                    </div>
                    <div className="max-w-[80%] p-4 rounded-2xl bg-gray-800 text-white rounded-bl-none">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Quick Access Buttons */}
              <div className="p-3 border-t border-white/10 bg-black/20 sticky bottom-0">
                <div className="flex flex-wrap gap-2 justify-center">
                  {campusLocations.map((location) => (
                    <Button
                      key={location.id}
                      variant="outline"
                      size="sm"
                      className="bg-black/40 text-white border-white/20 hover:bg-white/10 hover:border-white/40 transition-all duration-200"
                      onClick={() => handleLocationButtonClick(location.id)}
                    >
                      {location.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-black/20 sticky bottom-0">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about campus locations..."
                    className="flex-1 bg-black/40 text-white rounded-lg px-4 py-2 outline-none border border-white/20 focus:border-indigo-500 transition-all duration-200"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6"
                    disabled={!inputValue.trim() || isLoading}
                  >
                    Send
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* Right Side: Map Panel */}
        {showMap && (
          <div className="md:w-1/2 h-full md:h-screen md:sticky md:top-0">
            <div className="relative h-full bg-black/40 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden shadow-2xl">
              <div ref={mapContainerRef} className="absolute inset-0"></div>
              
              <div className="absolute top-4 right-4 z-20">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-black/60 text-white border-white/20 hover:bg-white/10"
                  onClick={closeMap}
                >
                  Close Map
                </Button>
              </div>
              
              {selectedLocation && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md text-white p-4 rounded-lg z-20 border border-white/20">
                  <h3 className="text-lg font-bold mb-1">
                    {campusLocations.find(loc => loc.id === selectedLocation)?.name}
                  </h3>
                  <p className="text-gray-300">
                    Located in the {campusLocations.find(loc => loc.id === selectedLocation)?.direction} part of campus
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