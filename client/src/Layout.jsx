import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import logo from './assets/juancast_logo.webp';

const Layout = () => {
  const navigate = useNavigate();
  
  const storedUser = localStorage.getItem('juancast_user');
  const loggedInUser = storedUser ? JSON.parse(storedUser) : null;
  const userAvatar = loggedInUser?.avatar || "";

  return (
    <div className="app-layout-wrapper">
      <nav className="landing-nav-blue">
        <div className="nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="JuanCast Logo" className="nav-logo-img" />
        </div>
        <div className="nav-actions">
          <span className="nav-bell">🔔</span>
          
          {loggedInUser ? (
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <div className="nav-profile-icon" style={{
                width: '35px', height: '35px', borderRadius: '50%', 
                backgroundColor: '#e0e0e0', border: '2px solid white', cursor: 'pointer',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
              </div>
            </Link>
          ) : (
            <Link to="/login">
              <button className="nav-login-btn">Login</button>
            </Link>
          )}
        </div>
      </nav>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;