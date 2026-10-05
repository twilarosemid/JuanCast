import React from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Settings.css'; // Verify this path points to your css folder

const Settings = () => {
  const navigate = useNavigate();

  const menuItems = [
    { label: 'About Us', icon: <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" /> },
    
    // --- ADDED: path: '/settings/terms' ---
    { label: 'Terms & Conditions', path: '/settings/terms', icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-2 16H8v-2h4v2zm4-4H8v-2h8v2zm0-4H8v-2h8v2z" /> },
    
    { label: 'Privacy Policy', icon: <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm3 11c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" /> },
// Update the Share Juancast line to include the path:
    { label: 'Share Juancast', path: '/settings/share', icon: <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" /> },
    { label: 'FAQs', path: '/settings/faq', icon: <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />},
    { label: 'Report an Issue', path: '/settings/report', icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />},
]
  const handleNavigation = (item) => {
    if (item.path) {
      navigate(item.path);
    } else {
      console.log(`Open modal/page for: ${item.label}`);
    }
  };

  return (
    <div className="settings-page-wrapper">
      <div className="settings-container">
        
        <div className="section-header" style={{ marginBottom: '20px' }}>
          <h2>Settings</h2>
        </div>

        <div className="settings-card">
          <div className="settings-menu-list">
            {menuItems.map((item, index) => (
              <div key={index} className="settings-menu-item" onClick={() => handleNavigation(item)}>
                <div className="settings-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                    {item.icon}
                  </svg>
                </div>
                <span className="settings-menu-label">{item.label}</span>
                <span className="settings-menu-chevron">›</span>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-action-buttons">
          <button className="settings-btn btn-forgot" onClick={() => navigate('/forgot-password')}>Forgot Password</button>
          <button className="settings-btn btn-deactivate">Deactivate Account</button>
        </div>

      </div>
    </div>
  );
};

export default Settings;