import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; 
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './Shared.css';
import './SignUp.css';

import logo from './assets/juancast_logo.webp';
import heroIcon from './assets/juancast_icon.webp'; 

const countryCodes = [
  { name: 'Philippines', code: '+63', flag: '🇵🇭', placeholder: '09XX XXX XXXX', format: '#### ### ####', minLength: 10, maxLength: 11, validStarts: ['09', '9'] },
  { name: 'United States', code: '+1', flag: '🇺🇸', placeholder: 'XXX XXX XXXX', format: '### ### ####', minLength: 10, maxLength: 10, validStarts: [] },
  { name: 'Canada', code: '+1', flag: '🇨🇦', placeholder: 'XXX XXX XXXX', format: '### ### ####', minLength: 10, maxLength: 10, validStarts: [] },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧', placeholder: '07XX XXXXXXX', format: '#### #######', minLength: 10, maxLength: 11, validStarts: ['07', '7'] },
  { name: 'Australia', code: '+61', flag: '🇦🇺', placeholder: '04XX XXX XXX', format: '#### ### ###', minLength: 9, maxLength: 10, validStarts: ['04', '4'] },
  { name: 'India', code: '+91', flag: '🇮🇳', placeholder: 'XXXXX XXXXX', format: '##### #####', minLength: 10, maxLength: 10, validStarts: ['6', '7', '8', '9'] },
  { name: 'China', code: '+86', flag: '🇨🇳', placeholder: '1XX XXXX XXXX', format: '### #### ####', minLength: 11, maxLength: 11, validStarts: ['1'] },
  { name: 'Japan', code: '+81', flag: '🇯🇵', placeholder: '0X0 XXXX XXXX', format: '### #### ####', minLength: 10, maxLength: 11, validStarts: ['0', '9', '8', '7'] },
  { name: 'South Korea', code: '+82', flag: '🇰🇷', placeholder: '010 XXXX XXXX', format: '### #### ####', minLength: 10, maxLength: 11, validStarts: ['010', '10'] },
  { name: 'Singapore', code: '+65', flag: '🇸🇬', placeholder: 'XXXX XXXX', format: '#### ####', minLength: 8, maxLength: 8, validStarts: ['8', '9'] },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾', placeholder: '01X XXX XXXX', format: '### #### ####', minLength: 9, maxLength: 11, validStarts: ['01', '1'] },
  { name: 'Indonesia', code: '+62', flag: '🇮🇩', placeholder: '08XX XXXX XXXXX', format: '#### #### #####', minLength: 10, maxLength: 13, validStarts: ['08', '8'] },
  { name: 'Thailand', code: '+66', flag: '🇹🇭', placeholder: '0X XXX XXXX', format: '## ### ####', minLength: 9, maxLength: 10, validStarts: ['06', '08', '09', '6', '8', '9'] },
  { name: 'Vietnam', code: '+84', flag: '🇻🇳', placeholder: '09X XXX XXXX', format: '### ### ####', minLength: 9, maxLength: 10, validStarts: ['0', '3', '5', '7', '8', '9'] },
  { name: 'Taiwan', code: '+886', flag: '🇹🇼', placeholder: '09XX XXX XXX', format: '#### ### ###', minLength: 9, maxLength: 10, validStarts: ['09', '9'] },
  { name: 'Hong Kong', code: '+852', flag: '🇭🇰', placeholder: 'XXXX XXXX', format: '#### ####', minLength: 8, maxLength: 8, validStarts: ['4', '5', '6', '7', '8', '9'] },
  { name: 'New Zealand', code: '+64', flag: '🇳🇿', placeholder: '02X XXX XXXX', format: '### ### ####', minLength: 8, maxLength: 11, validStarts: ['02', '2'] },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪', placeholder: '05X XXX XXXX', format: '### ### ####', minLength: 9, maxLength: 10, validStarts: ['05', '5'] },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦', placeholder: '05X XXX XXXX', format: '### ### ####', minLength: 9, maxLength: 10, validStarts: ['05', '5'] },
  { name: 'Qatar', code: '+974', flag: '🇶🇦', placeholder: 'XXXX XXXX', format: '#### ####', minLength: 8, maxLength: 8, validStarts: ['3', '5', '6', '7'] },
  { name: 'South Africa', code: '+27', flag: '🇿🇦', placeholder: '06X XXX XXXX', format: '### ### ####', minLength: 9, maxLength: 10, validStarts: ['06', '07', '08', '6', '7', '8'] },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬', placeholder: '0X0 XXX XXXX', format: '#### ### ####', minLength: 10, maxLength: 11, validStarts: ['07', '08', '09', '7', '8', '9'] },
  { name: 'Egypt', code: '+20', flag: '🇪🇬', placeholder: '01X XXX XXXX', format: '#### ### ####', minLength: 10, maxLength: 11, validStarts: ['01', '1'] },
  { name: 'Brazil', code: '+55', flag: '🇧🇷', placeholder: 'XX 9XXXX XXXX', format: '## ##### ####', minLength: 10, maxLength: 11, validStarts: [] },
  { name: 'Mexico', code: '+52', flag: '🇲🇽', placeholder: 'XX XXXX XXXX', format: '## #### ####', minLength: 10, maxLength: 10, validStarts: [] },
  { name: 'Germany', code: '+49', flag: '🇩🇪', placeholder: '015X XXXXXXX', format: '#### #######', minLength: 10, maxLength: 12, validStarts: ['01', '1'] },
  { name: 'France', code: '+33', flag: '🇫🇷', placeholder: '06 XX XX XX XX', format: '## ## ## ## ##', minLength: 9, maxLength: 10, validStarts: ['06', '07', '6', '7'] },
  { name: 'Italy', code: '+39', flag: '🇮🇹', placeholder: '3XX XXXXXXX', format: '### #######', minLength: 9, maxLength: 10, validStarts: ['3'] },
  { name: 'Spain', code: '+34', flag: '🇪🇸', placeholder: '6XX XXX XXX', format: '### ### ###', minLength: 9, maxLength: 9, validStarts: ['6', '7'] }
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignUpStep3 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null); // Reference for clicking outside
  
  const storedSignup = sessionStorage.getItem('juancast_signup_state');
  const savedState = storedSignup ? JSON.parse(storedSignup) : null;
  const { fullName, username, birthdate, gender, password } = location.state || savedState || {};

  const [email, setEmail] = useState('');
  const [showEmail, setShowEmail] = useState(true);
  const [phone, setPhone] = useState('');
  const [selectedCountryIndex, setSelectedCountryIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Controls the custom dropdown
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const activeCountry = countryCodes[selectedCountryIndex];

  // Close the dropdown if the user clicks anywhere outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!fullName || !username || !birthdate || !gender || !password) {
    return (
      <div className="login-container">
        <div className="login-left">
          <img src={heroIcon} alt="JuanCast Hero" className="hero-icon" />
        </div>
        <div className="login-right">
          <div className="login-content">
            <h1 className="login-title">Account Creation</h1>
            <p className="error-message">Your signup session expired. Please start again.</p>
            <button type="button" className="login-button" onClick={() => navigate('/signup')}>START AGAIN</button>
          </div>
        </div>
      </div>
    );
  }

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (val.length > 0 && !emailRegex.test(val)) setErrorMessage('Please enter a valid email address.');
    else if (phone.length > 0 && phone.replace(/\D/g, '').length < activeCountry.minLength) setErrorMessage('Phone number is too short.');
    else setErrorMessage('');
  };

  const handlePhoneChange = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    let currentFormat = activeCountry.format;
    let currentMaxLength = activeCountry.maxLength;

    if (activeCountry.placeholder.startsWith('0') && rawDigits.length > 0 && !rawDigits.startsWith('0')) {
      currentFormat = currentFormat.replace('#', '').trim();
    }

    const truncatedDigits = rawDigits.slice(0, currentMaxLength);

    let formattedPhone = '';
    let digitIndex = 0;
    for (let i = 0; i < currentFormat.length; i++) {
      if (digitIndex >= truncatedDigits.length) break;
      if (currentFormat[i] === '#') {
        formattedPhone += truncatedDigits[digitIndex];
        digitIndex++;
      } else {
        formattedPhone += currentFormat[i];
      }
    }

    setPhone(formattedPhone);

    let startError = '';
    if (truncatedDigits.length > 0 && activeCountry.validStarts && activeCountry.validStarts.length > 0) {
      const isValidStart = activeCountry.validStarts.some(prefix => 
        prefix.startsWith(truncatedDigits) || truncatedDigits.startsWith(prefix)
      );
      if (!isValidStart) {
        startError = activeCountry.validStarts.length <= 2 
          ? `Number must start with ${activeCountry.validStarts.join(' or ')}.`
          : `Invalid starting number for ${activeCountry.name}.`;
      }
    }

    if (startError) {
      setErrorMessage(startError);
    } else if (truncatedDigits.length > 0 && truncatedDigits.length < activeCountry.minLength) {
      setErrorMessage('Phone number is too short.');
    } else if (email.length > 0 && !emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
    } else {
      setErrorMessage('');
    }
  };

  const handleCountrySelect = (index) => {
    setSelectedCountryIndex(index);
    setPhone('');
    setErrorMessage('');
    setIsDropdownOpen(false); // Close the menu when they pick a country
  };

  const handleGetCode = async (e) => {
    e.preventDefault();
    if (!fullName || !username || !birthdate || !gender || !password) return navigate('/signup');

    setIsLoading(true);
    setErrorMessage('');

    try {
      const cleanPhoneForAPI = phone.replace(/\D/g, '');
      const response = await fetch('https://juancast.onrender.com/api/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone: activeCountry.code + cleanPhoneForAPI, password })
      });

      const data = await response.json();
      if (response.ok) {
        const payload = { fullName, username, birthdate, gender, email };
        sessionStorage.setItem('juancast_signup_state', JSON.stringify({ ...savedState, ...payload }));
        navigate('/signup-step-4', { state: payload });
      } else {
        setErrorMessage(data.message || 'Failed to send verification code.');
      }
    } catch (error) {
      setErrorMessage('Server error. Please ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const rawPhoneDigits = phone.replace(/\D/g, '');
  const isValidEmail = emailRegex.test(email);
  const isFormValid = isValidEmail && rawPhoneDigits.length >= activeCountry.minLength && !errorMessage.includes('start with') && !errorMessage.includes('Invalid') && !isLoading;

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
              
              {/* --- CUSTOM DROPDOWN --- */}
              <div className="custom-dropdown-container" ref={dropdownRef}>
                <div 
                  className="login-input select-input country-select-display" 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {activeCountry.flag} {activeCountry.code}
                </div>

                {isDropdownOpen && (
                  <div className="custom-dropdown-menu">
                    {countryCodes.map((country, index) => (
                      <div 
                        key={index} 
                        className={`custom-dropdown-item ${index === selectedCountryIndex ? 'selected' : ''}`}
                        onClick={() => handleCountrySelect(index)}
                      >
                        <span className="dropdown-flag">{country.flag}</span>
                        <span className="dropdown-code">{country.code}</span>
                        <span className="dropdown-name">{country.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* --- END CUSTOM DROPDOWN --- */}

              <input type="tel" placeholder={activeCountry.placeholder} className="login-input phone-input" value={phone} onChange={handlePhoneChange} required />
            </div>

            <div className="error-container">
              {errorMessage && <p className="error-message">{errorMessage}</p>}
            </div>

            <button type="submit" className="login-button" disabled={!isFormValid}>
              {isLoading ? 'SENDING...' : 'GET CODE'}
            </button>
          </form>

          <p className="back-to-login-text">
            Already have an account? <Link to="/login" className="back-link">Log In!</Link>
          </p>

          <span className="version">v1.0.62</span>
        </div>
      </div>
    </div>
  );
};

export default SignUpStep3;