import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LandingLayout from './landingpagesrc/LandingLayout';
import HomeCenterView from './landingpagesrc/centerViews/HomeCenterView';
import ProfileLayout from './profilepagesrc/ProfileLayout';
import Profile from './profilepagesrc/Profile'; 
import EditProfile from './profilepagesrc/EditProfile';
import ReportIssue from './components/settings/ReportIssue';

// Make sure your import path matches where you put the file!
import Settings from './components/settings/Settings'; 
import TermsAndConditions from './components/settings/TermsAndConditions';
import PrivacyPolicy from './components/settings/PrivacyPolicy';
import ShareJuancast from './components/settings/ShareJuancast';
import FAQ from './components/settings/FAQ';

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
        {/* --- LANDING SECTION (Navbar & Welcome Banner live here) --- */}
        <Route path="/" element={<LandingLayout />}>
          <Route index element={<HomeCenterView />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/terms" element={<TermsAndConditions />} />
          <Route path="settings/privacy" element={<PrivacyPolicy />} />
          <Route path="settings/share" element={<ShareJuancast />} />
          <Route path="settings/faq" element={<FAQ />} />
          <Route path="settings/report" element={<ReportIssue />} />
        </Route>

        {/* PROFILE SECTION */}
        <Route path="/profile" element={<ProfileLayout />}>
          <Route index element={<Profile />} />
          <Route path="edit" element={<EditProfile />} />
        </Route>
        <Route path="/profile/:username" element={<ProfileLayout />}>
          <Route index element={<Profile />} />
        </Route>

        {/* STANDALONE ROUTES (Check carefully to make sure /settings is NOT down here) */}
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