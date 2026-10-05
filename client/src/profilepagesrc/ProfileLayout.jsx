import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Layout from '../components/Layout';
import './css/ProfileLayout.css';

const ProfileLayout = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [dailyOpenRequest, setDailyOpenRequest] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem('juancast_user');
    if (storedUser) {
      setLoggedInUser(JSON.parse(storedUser));
    }
  }, []);

  const userAvatar = loggedInUser?.avatar || "";
  const requestDailyOpen = () => setDailyOpenRequest(Date.now());
  const consumeDailyOpenRequest = () => setDailyOpenRequest(0);

  return (
    <Layout 
      showWelcome={true}
      welcomeText={`Welcome, ${loggedInUser?.username || 'Guest'}!`}
      tokens={loggedInUser?.suns ?? 0}
      stars={loggedInUser?.stars ?? 0}
      showActions={true} 
      loggedInUser={loggedInUser}
      avatar={userAvatar}
      onCalendarClick={requestDailyOpen}
    >
      <div className="profile-content-container">
        <Outlet context={{ dailyOpenRequest, consumeDailyOpenRequest }} />
      </div>
    </Layout>
  );
};

export default ProfileLayout;