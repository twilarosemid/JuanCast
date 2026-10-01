import React from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Settings.css'; 

const ShareJuancast = () => {
  const navigate = useNavigate();

  const socialLinks = [
    { 
      name: 'Facebook', 
      url: 'https://www.facebook.com/JuanCastPH/', 
      color: '#1877F2',
      icon: <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6c.86 0 1.8.15 2.5.25V9h-1.75c-1.36 0-1.75.68-1.75 1.5V12h3.5l-.5 3h-3v6.8C18.56 20.87 22 16.84 22 12z"/> 
    },
    { 
      name: 'X (Twitter)', 
      url: 'https://x.com/NotJuanCastPH', 
      color: '#0f1419',
      icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/> 
    },
    { 
      name: 'YouTube', 
      url: 'https://www.youtube.com/@JuanCastPHOfficial', 
      color: '#FF0000',
      icon: <path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"/> 
    },
    { 
      name: 'TikTok', 
      url: 'https://www.tiktok.com/@juancastph', 
      color: '#000000',
      icon: <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.64-5.46-.22-2.58.94-5.2 3.07-6.52 1.95-1.23 4.41-1.43 6.55-.65V10.2c-1.34-.36-2.76-.32-4.06.13-1.33.47-2.43 1.49-3.03 2.75-.58 1.25-.66 2.71-.24 4.02.43 1.3 1.34 2.41 2.54 3.03 1.31.68 2.89.78 4.28.32 1.55-.49 2.79-1.72 3.29-3.26.27-.85.34-1.75.34-2.65V.02h.02z"/> 
    }
  ];

  return (
    <div className="settings-page-wrapper" style={{ 
      height: 'calc(100vh - 100px)', 
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      boxSizing: 'border-box'
    }}>
      <div className="settings-container" style={{ 
        maxWidth: '800px', 
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: '20px'
      }}>
        
        <div className="section-header" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#1e88e5' }}
          >
            ←
          </button>
          <h2 style={{ margin: 0 }}>Share JuanCast</h2>
        </div>

        <div style={{ position: 'relative', width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          <div className="settings-card" style={{ flexGrow: 1 }}>
            
            <div style={{ padding: '30px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '18px' }}>Follow Us</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Stay updated with JuanCast across all our official platforms.</p>
            </div>

            <div className="settings-menu-list">
              {socialLinks.map((social, index) => (
                <a 
                  key={index} 
                  href={social.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="settings-menu-item"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="settings-icon" style={{ color: social.color }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
                      {social.icon}
                    </svg>
                  </div>
                  <span className="settings-menu-label">{social.name}</span>
                  <span className="settings-menu-chevron">›</span>
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ShareJuancast;