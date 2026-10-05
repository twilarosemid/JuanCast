import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './Shared.css';
import './SignUp.css';

import logo from './assets/juancast_logo.webp';
import heroIcon from './assets/juancast_icon.webp'; 

const countryCodes = [
  { name: 'Philippines', code: '+63', flag: '🇵🇭', placeholder: '9XXXXXXXXX' },
  { name: 'United States', code: '+1', flag: '🇺🇸', placeholder: '2XXXXXXXXX' },
  // ... (keep the rest of your country codes array here exactly as it was)
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignUpStep3 = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  // UPDATED: Retrieve ALL the data passed from Step 2
  const { fullName, username, birthdate, gender, password } = location.state || {};

  const [email, setEmail] = useState('');
  const [showEmail, setShowEmail] = useState(true);
  const [phone, setPhone] = useState('');
  const [selectedCountryIndex, setSelectedCountryIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  const activeCountry = countryCodes[selectedCountryIndex];

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (val.length > 0 && !emailRegex.test(val)) setErrorMessage('Please enter a valid email address.');
    else if (phone.length > 0 && phone.length < 7) setErrorMessage('Phone number is too short.');
    else setErrorMessage('');
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 15);
    setPhone(val);
    if (val.length > 0 && val.length < 7) setErrorMessage('Phone number is too short.');
    else if (email.length > 0 && !emailRegex.test(email)) setErrorMessage('Please enter a valid email address.');
    else setErrorMessage('');
  };

  const handleGetCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Send data to your Node.js backend
      const response = await fetch('http://[https://juancast.onrender.com](https://juancast.onrender.com)/api/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone: activeCountry.code + phone, password })
      });

      const data = await response.json();

      if (response.ok) {
        // UPDATED: Pass the Step 1 data AND the email forward to Step 4
        navigate('/signup-step-4', { 
          state: { fullName, username, birthdate, gender, email } 
        }); 
      } else {
        setErrorMessage(data.message || 'Failed to send verification code.');
      }
    } catch (error) {
      setErrorMessage('Server error. Please ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = emailRegex.test(email);
  const isFormValid = isValidEmail && phone.length >= 7 && !isLoading; 

  return (
    <div className="login-container">
      <div className="login-left">
        <img src={heroIcon} alt="JuanCast Hero" className="hero-icon" />
      </div>
      
      <div className="login-right">
        <div className="login-content">
          <img src={logo} alt="JuanCast Logo" className="logo" /> 
          <h1 className="login-title">Account Creation</h1>
          
          <div className="step-indicator">
            <div className="step-circle step-inactive">1</div>
            <div className="step-line"></div>
            <div className="step-circle step-inactive">2</div>
            <div className="step-line"></div>
            <div className="step-circle step-active">3</div>
            <div className="step-line"></div>
            <div className="step-circle step-inactive">4</div>
          </div>
          
          <form className="login-form" onSubmit={handleGetCode}>
            <div className="input-group password-group">
              <input type={showEmail ? "email" : "password"} placeholder="Email" className="login-input" value={email} onChange={handleEmailChange} required />
              <button type="button" className="password-toggle" onClick={() => setShowEmail(!showEmail)} tabIndex="-1">
                {showEmail ? <FiEye /> : <FiEyeOff />}
              </button>
            </div>

            <div className="phone-row">
              <select className="login-input country-select select-input" value={selectedCountryIndex} onChange={(e) => setSelectedCountryIndex(e.target.value)}>
                {countryCodes.map((country, index) => (
                  <option key={index} value={index}>{country.flag} {country.code}</option>
                ))}
              </select>
              <input type="tel" placeholder={activeCountry.placeholder} className="login-input phone-input" value={phone} onChange={handlePhoneChange} required />
            </div>

            <div className="error-container">
              {errorMessage && <p className="error-message">{errorMessage}</p>}
            </div>

            <button type="submit" className="login-button" disabled={!isFormValid}>
              {isLoading ? 'SENDING...' : 'GET CODE'}
            </button>
          </form>

          <span className="version" style={{marginTop: '30px'}}>v1.0.62</span>
        </div>
      </div>
    </div>
  );
};

export default SignUpStep3;