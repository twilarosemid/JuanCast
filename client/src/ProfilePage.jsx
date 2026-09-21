import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

// Reuse your logo if you have it, or use a text placeholder
import logo from './assets/juancast_logo.webp'; 

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Fetch the latest user data from MongoDB on load
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('juancast_user'));
        const userEmail = storedUser?.email;

        // If the user is logged in, fetch their live data from the backend
        if (userEmail) {
          const response = await fetch(`http://localhost:5000/api/users/me?email=${userEmail}`);
          
          if (response.ok) {
            const dbUser = await response.json();
            setUser(dbUser); // Updates the UI with fresh database info
            
            // Sync local storage so the session stays up to date
            const syncedUser = { ...storedUser, ...dbUser };
            localStorage.setItem('juancast_user', JSON.stringify(syncedUser));
          } else {
            console.error("Failed to load profile data from server");
          }
        } else {
          // If no email is found, they aren't logged in properly
          navigate('/login');
        }
      } catch (error) {
        console.error("Network error fetching profile:", error);
      }
    };

    fetchProfileData();
  }, [navigate]);

  // Fallbacks map to your reference design if data is missing or loading
  const fullName = user?.fullName || 'Jack Roberto';
  const username = user?.username ? `@${user.username}` : '@jck.rbrt';

  const handleLogout = () => {
    // Clear the session and send them back to login
    localStorage.removeItem('juancast_user');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Daily', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> },
    { name: 'Juantask', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg> },
    { name: 'Codes', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect><circle cx="12" cy="12" r="3"></circle><line x1="3" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="21" y2="12"></line></svg> },
    { name: 'Badges', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg> },
    { name: 'Transaction', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect><circle cx="12" cy="12" r="4"></circle><polyline points="12 10 12 12 14 14"></polyline></svg> },
    { name: 'Settings', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> },
    { name: 'FAQs', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> },
    { name: 'Report', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> },
    { name: 'Logout', action: handleLogout, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> }
  ];

  return (
    <div className="profile-page-wrapper">
      {/* HEADER SECTION */}
      <div className="profile-header">
        <div className="profile-logo-bar">
          <img src={logo} alt="JuanCast" className="profile-nav-logo" />
        </div>
      </div>

      {/* MAIN OVERLAPPING PROFILE CARD */}
      <div className="profile-main-card">
        <div className="profile-avatar-container">
          
          <div className="profile-avatar-circle">
            {/* If the user has an avatar saved, show it. Otherwise, show the default SVG */}
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            )}
          </div>
          
          <div className="profile-qr-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect></svg>
          </div>
        </div>

        <h1 className="profile-fullname">{fullName}</h1>
        <p className="profile-username">{username}</p>
        <p className="profile-joined">Joined Sept 8, 2026</p>

        <div className="profile-tokens">
          <span>🌟 10</span>
          <span className="token-divider">/</span>
          <span>⭐ 10</span>
        </div>

        <button className="profile-edit-btn" onClick={() => navigate('/edit-profile')}>
          Edit Profile
        </button>
      </div>

      {/* 3x3 MENU GRID */}
      <div className="profile-menu-grid">
        {menuItems.map((item, index) => (
          <div 
            key={index} 
            className="profile-menu-item" 
            onClick={item.action ? item.action : undefined}
          >
            <div className="profile-menu-icon">
              {item.icon}
            </div>
            <span className="profile-menu-text">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;