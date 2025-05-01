import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import your existing components
import CampusNavigatorLanding from './landingpage';
import Campus from './campus';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Route for the landing page */}
        <Route path="/" element={<CampusNavigatorLanding />} />
        
        {/* Route for the campus navigator */}
        <Route path="/campus" element={<Campus />} />
        
        {/* Redirect any other routes to the landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;