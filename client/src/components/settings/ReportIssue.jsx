import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import './css/Settings.css'; 

const ReportIssue = () => {
  const navigate = useNavigate();
  const { loggedInUser } = useOutletContext();
  
  const [formData, setFormData] = useState({
    subject: '',
    issue: '',
    file: null
  });
  
  // 1. Add a state to control the popup visibility
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitData = new FormData();
    submitData.append('subject', formData.subject);
    submitData.append('issue', formData.issue);
    if (loggedInUser?.email) submitData.append('email', loggedInUser.email);
    
    if (formData.file) {
      submitData.append('file', formData.file);
    }

    try {
      const response = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        body: submitData, 
      });

      if (response.ok) {
        // 2. Instead of an alert and immediate navigation, show the popup
        setShowSuccessPopup(true);
      } else {
        alert('Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Cannot connect to the server. Please check your connection.');
    }
  };

  return (
    <div className="settings-page-wrapper" style={{ 
      height: 'calc(100vh - 100px)', 
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      boxSizing: 'border-box'
    }}>
      
      {/* 3. The Custom Success Pop-Up Modal */}
      {showSuccessPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff', padding: '30px', borderRadius: '16px',
            width: '90%', maxWidth: '350px', textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ color: '#10b981', marginBottom: '15px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="56" height="56" style={{ margin: '0 auto' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '20px' }}>Report Submitted</h3>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
              Thank you for letting us know. We will look into this issue shortly. You will receive a notification in Mail if your report is resolved.
            </p>
            <button 
              onClick={() => navigate(-1)}
              style={{
                backgroundColor: '#1e88e5', color: '#ffffff', padding: '12px 24px', 
                border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px',
                cursor: 'pointer', width: '100%', transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e88e5'}
            >
              Done
            </button>
          </div>
        </div>
      )}

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
          <h2 style={{ margin: 0 }}>Report an Issue</h2>
        </div>

        <div style={{ position: 'relative', width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          <div 
            className="settings-card hide-scrollbar" 
            style={{ 
              flexGrow: 1,
              padding: '30px', 
              overflowY: 'auto', 
              overscrollBehavior: 'contain',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <form onSubmit={handleSubmit} className="report-form">
              
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input 
                  type="text" 
                  id="subject" 
                  name="subject" 
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="issue">Tell us about your issue</label>
                <textarea 
                  id="issue" 
                  name="issue" 
                  rows="6"
                  value={formData.issue}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="file">Optional</label>
                <input 
                  type="file" 
                  id="file" 
                  name="file" 
                  onChange={handleChange}
                  className="file-input"
                />
              </div>

              <button type="submit" className="settings-btn btn-submit-report">
                SUBMIT
              </button>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReportIssue;