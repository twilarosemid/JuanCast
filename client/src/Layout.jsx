import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import logo from './assets/juancast_logo.webp';

const Layout = () => {
  const navigate = useNavigate();
  
  // --- STATE FOR DROPDOWN ---
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const storedUser = localStorage.getItem('juancast_user');
  const loggedInUser = storedUser ? JSON.parse(storedUser) : null;
  const userAvatar = loggedInUser?.avatar || "";

  // --- CLOSE DROPDOWN WHEN CLICKING OUTSIDE ---
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
    <div className="app-layout-wrapper">
      <nav className="landing-nav-blue">
        <div className="nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="JuanCast Logo" className="nav-logo-img" />
        </div>
        <div className="nav-actions">
          <span className="nav-bell">🔔</span>
          
          {loggedInUser ? (
            // --- DROPDOWN CONTAINER ---
            <div className="nav-profile-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
              
              <div 
                className="nav-profile-icon" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  width: '35px', height: '35px', borderRadius: '50%', 
                  backgroundColor: '#e0e0e0', border: '2px solid white', cursor: 'pointer',
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
              </div>

              {/* --- DROPDOWN MENU UI --- */}
              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: '50px', right: '0', backgroundColor: '#ffffff',
                  borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  overflow: 'hidden', width: '180px', zIndex: 999, display: 'flex', flexDirection: 'column'
                }}>
                  <Link 
                    to="/profile" 
                    onClick={() => setDropdownOpen(false)} 
                    style={{ padding: '14px 18px', textDecoration: 'none', color: '#1a2a40', borderBottom: '1px solid #f1f5f9', fontSize: '14px', fontWeight: '700' }}
                  >
                    My Profile
                  </Link>
                  <Link 
                    to="/settings" 
                    onClick={() => setDropdownOpen(false)} 
                    style={{ padding: '14px 18px', textDecoration: 'none', color: '#1a2a40', borderBottom: '1px solid #f1f5f9', fontSize: '14px', fontWeight: '700' }}
                  >
                    Settings
                  </Link>
                  <div 
                    onClick={handleLogout} 
                    style={{ padding: '14px 18px', color: '#ff4055', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}
                  >
                    Logout
                  </div>
                </div>
              )}
            </div>
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