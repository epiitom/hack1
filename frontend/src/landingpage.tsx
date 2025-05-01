import { useState } from 'react';
import { Search, Map, Star, Users, MapPin, Menu, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CampusNavigatorLanding() {
  // Move the useNavigate hook inside the component function
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const handleNavigation = () => {
    // Navigate to the /campus route
    navigate('/campus');
  };  
  
  return (
    <div className="bg-black text-gray-200 min-h-screen">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-800 px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <MapPin className="text-purple-500" size={24} />
          <span className="font-bold text-xl">Campus Navigator</span>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
          <a href="#map" className="hover:text-purple-400 transition-colors">Map</a>
          <a href="#contribute" className="hover:text-purple-400 transition-colors">Contribute</a>
          <button 
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            onClick={handleNavigation}
          >
            Get Started
          </button>
        </div>
        
        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900 py-4 px-6 absolute w-full z-10">
          <div className="flex flex-col space-y-4">
            <a href="#features" className="hover:text-purple-400 transition-colors py-2">Features</a>
            <a href="#map" className="hover:text-purple-400 transition-colors py-2">Map</a>
            <a href="#contribute" className="hover:text-purple-400 transition-colors py-2">Contribute</a>
            <button 
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
              onClick={handleNavigation}
            >
              Get Started
            </button>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <section className="px-4 py-20 md:py-32 flex flex-col items-center text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Navigate Your Campus with Ease
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl">
          Never get lost again. Find any building, classroom, or facility with personalized, witty directions and interactive maps.
        </p>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <button 
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            onClick={handleNavigation}
          >
            <Search size={18} className="mr-2" />
            Start Exploring
          </button>
          <button 
            className="border border-gray-700 hover:border-purple-500 px-6 py-3 rounded-lg font-medium transition-colors" 
            onClick={handleNavigation}
          >
            Learn More
          </button>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="px-4 py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Smart Campus Navigation</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-black bg-opacity-50 p-6 rounded-xl border border-gray-800">
              <div className="bg-purple-900 bg-opacity-30 p-3 rounded-lg inline-block mb-4">
                <Search size={24} className="text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Search</h3>
              <p className="text-gray-400">
                Find any location by name, building code, or function. Our intelligent search understands what you're looking for.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-black bg-opacity-50 p-6 rounded-xl border border-gray-800">
              <div className="bg-purple-900 bg-opacity-30 p-3 rounded-lg inline-block mb-4">
                <Map size={24} className="text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Interactive Map</h3>
              <p className="text-gray-400">
                View an interactive map with all campus locations clearly marked and color-coded by type.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-black bg-opacity-50 p-6 rounded-xl border border-gray-800">
              <div className="bg-purple-900 bg-opacity-30 p-3 rounded-lg inline-block mb-4">
                <Star size={24} className="text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Favorite Places</h3>
              <p className="text-gray-400">
                Save your most visited locations for quick access and personalized navigation.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Map Demo Section */}
      <section id="map" className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
              <h2 className="text-3xl font-bold mb-4">Explore Your Campus</h2>
              <p className="text-gray-400 mb-6">
                Our interactive map shows you exactly where everything is. Get witty, personalized directions that make sense.
              </p>
              <ul className="space-y-3">
                {['Lecture Halls', 'Libraries', 'Cafeterias', 'Study Spaces', 'Athletic Facilities'].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <ChevronRight size={16} className="text-purple-500 mr-2" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/2">
              <div className="bg-gray-800 rounded-xl p-2 border border-gray-700 shadow-xl">
                <div className="bg-gray-900 rounded-lg aspect-video relative overflow-hidden">
                  {/* This would be where your actual map goes */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Map size={48} className="text-purple-500 mx-auto mb-2 opacity-50" />
                      <p className="text-gray-500">Interactive Campus Map</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Contribute Section */}
      <section id="contribute" className="px-4 py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Help Improve Campus Navigator</h2>
          <p className="text-gray-400 mb-8">
            Know a shortcut? Found a new study spot? Help your fellow students by contributing to our location database.
          </p>
          <div className="bg-black bg-opacity-40 p-8 rounded-xl border border-gray-800">
            <div className="flex items-center justify-center mb-6">
              <Users size={32} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Join Our Community</h3>
            <p className="text-gray-400 mb-6">
              Add new locations, suggest corrections, and share insider tips to make campus navigation better for everyone.
            </p>
            <button className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors">
              Start Contributing
            </button>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Navigate Like a Pro?</h2>
          <p className="text-gray-300 mb-8">
            Join thousands of students who find their way around campus with ease.
          </p>
          <button 
            className="bg-white text-purple-900 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors"
            onClick={handleNavigation}
          >
            Get Started Now
          </button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="px-4 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <MapPin className="text-purple-500" size={20} />
              <span className="font-bold">Campus Navigator</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">About</a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Campus Navigator. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}