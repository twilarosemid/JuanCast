import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import the Pages
import LandingPage from './LandingPage'; 
import ProfilePage from './ProfilePage'; 
import EditProfile from './EditProfile'; // <-- NEW: Imported Edit Profile

import Login from './Login';
import SignUp from './SignUp';
import SignUpStep2 from './SignUpStep2';
import SignUpStep3 from './SignUpStep3';
import SignUpStep4 from './SignUpStep4';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page opens first on npm run dev */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signup-step-2" element={<SignUpStep2 />} />
        <Route path="/signup-step-3" element={<SignUpStep3 />} />
        <Route path="/signup-step-4" element={<SignUpStep4 />} /> 
        
        {/* Profile Routes */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/edit-profile" element={<EditProfile />} /> {/* <-- NEW: Route added */}
      </Routes>
    </Router>
  );
}

export default App;