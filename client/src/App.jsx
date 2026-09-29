import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LandingLayout from './landingpagesrc/LandingLayout';
import HomeCenterView from './landingpagesrc/centerViews/HomeCenterView';

import ProfileLayout from './profilepagesrc/ProfileLayout';
import Profile from './profilepagesrc/Profile'; 
import EditProfile from './profilepagesrc/EditProfile'; 

import Login from './Login';
import SignUp from './SignUp';
import SignUpStep2 from './SignUpStep2';
import SignUpStep3 from './SignUpStep3';
import SignUpStep4 from './SignUpStep4';
import AdminDashboard from './AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* LANDING SECTION */}
        <Route path="/" element={<LandingLayout />}>
          <Route index element={<HomeCenterView />} />
        </Route>

        {/* PROFILE SECTION (Using modular layout, profile view, and nested edit view) */}
        <Route path="/profile" element={<ProfileLayout />}>
          <Route index element={<Profile />} />
          <Route path="edit" element={<EditProfile />} />
        </Route>

        <Route path="/profile/:username" element={<ProfileLayout />}>
          <Route index element={<Profile />} />
        </Route>

        {/* STANDALONE AUTH ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signup-step-2" element={<SignUpStep2 />} />
        <Route path="/signup-step-3" element={<SignUpStep3 />} />
        <Route path="/signup-step-4" element={<SignUpStep4 />} /> 
      </Routes>
    </Router>
  );
}

export default App;