import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/juancast_logo.webp';
// IMPORT YOUR NEW CURRENCY ICONS HERE
import StarCurr from '../assets/StarCurr.png';
import SunCurr from '../assets/SunCurr.png';
import './css/Navbar.css';

const Layout = ({ 
  children,
  showWelcome = false, 
  welcomeText = '', 
  tokens = null, 
  stars = null, 
  showActions = true,
  loggedInUser = null,
  avatar = '',
  onCalendarClick 
}) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem('juancast_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const dropdownRef = useRef(null);

  useEffect(() => {
    const syncLoggedInUser = () => {
      const storedUser = localStorage.getItem('juancast_user');
      setCurrentUser(storedUser ? JSON.parse(storedUser) : null);
    };

    syncLoggedInUser();
    window.addEventListener('juancast-user-updated', syncLoggedInUser);
    window.addEventListener('storage', syncLoggedInUser);

    return () => {
      window.removeEventListener('juancast-user-updated', syncLoggedInUser);
      window.removeEventListener('storage', syncLoggedInUser);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('juancast_user');
    setDropdownOpen(false);
    navigate('/login');
  };

  return (
    <div className="landing-wrapper">
      <div className="sticky-header-container">
        <header className="landing-nav-blue">
          <div className="nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img src={logo} alt="JuanCast Logo" className="nav-logo-img" />
          </div>

          {showActions && (
            <div className="nav-actions">
              <span className="nav-bell" style={{ cursor: 'pointer' }}>🔔</span>
              
              {(loggedInUser || currentUser) ? (
                <div className="nav-profile-dropdown-wrapper" ref={dropdownRef}>
                  <div 
                    className="nav-profile-icon" 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{
                      width: '35px', height: '35px', borderRadius: '50%', 
                      backgroundColor: '#e0e0e0', border: '2px solid white', cursor: 'pointer',
                      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {(avatar || currentUser?.avatar) ? (
                      <img src={avatar || currentUser?.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    )}
                  </div>

                  {dropdownOpen && (
                    <div className="navbar-dropdown-menu">
                      <div className="dropdown-user-header">
                        <span className="dropdown-username">@{(loggedInUser || currentUser)?.username}</span>
                      </div>
                      <div className="dropdown-divider"></div>
                      <button onClick={() => { setDropdownOpen(false); navigate('/profile'); }}>Profile</button>
                      <button onClick={() => { setDropdownOpen(false); navigate('/transactions'); }}>Transactions</button>
                      <button onClick={() => { setDropdownOpen(false); navigate('/settings'); }}>Settings</button>
                      <button onClick={() => { setDropdownOpen(false); navigate('/faqs'); }}>FAQs</button>
                      <button onClick={() => { setDropdownOpen(false); navigate('/report'); }}>Report a problem</button>
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-logout-btn" onClick={handleLogout}>Logout</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login">
                  <button className="nav-login-btn">Login</button>
                </Link>
              )}
            </div>
          )}
        </header>

        {showWelcome && (
          <div className="welcome-bar">
            <div className="welcome-text">{welcomeText}</div>
            
            {/* UPDATED: Currency Display with Images */}
            <div className="welcome-stats" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {tokens !== null && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <img src={SunCurr} alt="Suns" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> 
                  {tokens}
                </span>
              )}
              {stars !== null && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <img src={StarCurr} alt="Stars" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> 
                  {stars}
                </span>
              )}
              <span 
                className="calendar-icon" 
                onClick={onCalendarClick} 
                style={{ cursor: 'pointer', marginLeft: '5px' }}
              >
                📅
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="main-content-area">
        {children}
      </div>
    </div>
  );
};

export default Layout;