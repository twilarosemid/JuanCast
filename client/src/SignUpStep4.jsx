import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; 
import './Shared.css';
import './SignUp.css';

import logo from './assets/juancast_logo.webp';
import heroIcon from './assets/juancast_icon.webp'; 

const SignUpStep4 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // FIXED: Retrieve ALL data passed from Step 3, not just the email
  const { email, fullName, username, birthdate, gender } = location.state || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, ''); 
    if (!val) return; 
    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1); 
    setOtp(newOtp);
    if (index < 5) inputRefs.current[index + 1].focus();
    setErrorMessage('');
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault(); 
      const newOtp = [...otp];
      if (otp[index]) {
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      }
      setErrorMessage('');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    // Combine the 6 array items into one string (e.g., "123456")
    const enteredOtp = otp.join('');

    try {
      const response = await fetch('[https://juancast.onrender.com](https://juancast.onrender.com)/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // FIXED: Send all the profile data to the Node.js backend
        body: JSON.stringify({ 
          email, 
          otp: enteredOtp,
          fullName,
          username,
          birthdate,
          gender
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Account Created Successfully!");
        navigate('/login');
      } else {
        setErrorMessage(data.message || 'Invalid verification code.');
      }
    } catch (error) {
      setErrorMessage('Server error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = otp.every((digit) => digit !== '') && !isLoading;

  return (
    <div className="login-container">
      <div className="login-left">
        <img src={heroIcon} alt="JuanCast Hero" className="hero-icon" />
      </div>
      
      <div className="login-right">
        <div className="login-content">
          <img src={logo} alt="JuanCast Logo" className="logo" /> 
          
          <div className="step-indicator">
            <div className="step-circle step-inactive">1</div>
            <div className="step-line"></div>
            <div className="step-circle step-inactive">2</div>
            <div className="step-line"></div>
            <div className="step-circle step-inactive">3</div>
            <div className="step-line"></div>
            <div className="step-circle step-active">4</div>
          </div>
          
          <form className="login-form" onSubmit={handleVerify}>
            <h2 className="otp-title">Enter Verification Code</h2>
            <p className="otp-subtitle">Please enter the 6-digit code sent to your email</p>
            
            <div className="otp-container">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  className="otp-input"
                  value={data}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  ref={(el) => (inputRefs.current[index] = el)}
                  required
                />
              ))}
            </div>

            <div className="error-container" style={{ marginBottom: '10px', height: '30px' }}>
              {errorMessage && <p className="error-message">{errorMessage}</p>}
            </div>

            <p className="resend-text" style={{ marginBottom: '20px' }}>
              Didn't receive code? <span className="resend-link" onClick={() => alert("Code Resent!")}>Resend</span>
            </p>

            <button type="submit" className="login-button" disabled={!isFormValid}>
              {isLoading ? 'VERIFYING...' : 'VERIFY'}
            </button>
          </form>

          <p className="back-to-login-text">
            Already have an account? <Link to="/login" className="back-link">Log In!</Link>
          </p>

          <span className="version" style={{marginTop: '30px'}}>v1.0.62</span>
        </div>
      </div>
    </div>
  );
};

export default SignUpStep4;