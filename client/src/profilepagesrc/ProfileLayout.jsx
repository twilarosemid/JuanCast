import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Layout from '../components/Layout';
import './css/ProfileLayout.css';

const ProfileLayout = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('juancast_user');
    if (storedUser) {
      setLoggedInUser(JSON.parse(storedUser));
    }
  }, []);

  const userAvatar = loggedInUser?.avatar || "";

  return (
    <Layout 
      showWelcome={false} 
      showActions={true} 
      loggedInUser={loggedInUser}
      avatar={userAvatar}
    >
      <div className="profile-content-container">
        <Outlet />
      </div>
    </Layout>
  );
};

export default ProfileLayout;