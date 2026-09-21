import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import './Shared.css';
import './SignUp.css';

import logo from './assets/juancast_logo.webp';
import heroIcon from './assets/juancast_icon.webp'; 

const SignUp = () => {
  const navigate = useNavigate(); 
  
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('');
  
  const [birthdate, setBirthdate] = useState('');
  const [isTermsChecked, setIsTermsChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleDateChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    let mm = val.substring(0, 2);
    let dd = val.substring(2, 4);
    let yyyy = val.substring(4, 8);

    if (mm.length === 1 && mm[0] > '1') mm = '0' + mm[0]; 
    else if (mm.length === 2) {
      if (parseInt(mm, 10) > 12) mm = '12';
      if (mm === '00') mm = '01';
    }

    if (dd.length === 1 && dd[0] > '3') dd = '0' + dd[0]; 
    else if (dd.length === 2) {
      if (parseInt(dd, 10) > 31) dd = '31';
      if (dd === '00') dd = '01'; 
    }

    if (yyyy.length === 4) {
      if (parseInt(yyyy, 10) > 2026) yyyy = '2026';
    }

    let formattedDate = mm;
    if (val.length >= 3) formattedDate += '/' + dd;
    if (val.length >= 5) formattedDate += '/' + yyyy;

    setBirthdate(formattedDate);
  };

  // UPDATED: Async function to check the database before navigating
  const handleNext = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Clear previous errors

    try {
      // Ask the backend if the username is taken
      const response = await fetch('http://localhost:5000/api/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      if (response.ok) {
        // If 200 OK (available), proceed to Step 2
        navigate('/signup-step-2', { 
          state: { fullName, username, birthdate, gender } 
        });
      } else {
        // If 400 (taken), show the error message and stop
        const data = await response.json();
        setErrorMessage(data.message);
      }
    } catch (error) {
      setErrorMessage("Could not connect to the server.");
    }
  };

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
            <div className="step-circle step-active">1</div>
            <div className="step-line"></div>
            <div className="step-circle step-inactive">2</div>
            <div className="step-line"></div>
            <div className="step-circle step-inactive">3</div>
            <div className="step-line"></div>
            <div className="step-circle step-inactive">4</div>
          </div>
          
          <form className="login-form" onSubmit={handleNext}>
            <input 
              type="text" 
              placeholder="Full Name" 
              className="login-input" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required 
            />
            
            <input 
              type="text" 
              placeholder="Username" 
              className="login-input" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
            
            <input 
              type="text" 
              placeholder="Birthdate (MM/DD/YYYY)" 
              className="login-input"
              value={birthdate}
              onChange={handleDateChange}
              maxLength="10" 
              required 
            />
            
            <select 
              className="login-input select-input" 
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="" disabled hidden>Select Gender (v)</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <div className="terms-checkbox">
              <input 
                type="checkbox" 
                id="terms" 
                checked={isTermsChecked} 
                onChange={(e) => setIsTermsChecked(e.target.checked)} 
              />
              <label htmlFor="terms">
                I certify that I have read and accept the <br/>
                <a href="#">Terms of Use</a> and <a href="#">Privacy Statement</a>.
              </label>
            </div>

            {/* NEW: Display the error message if the username is taken */}
            <div className="error-container" style={{ minHeight: '24px', marginBottom: '10px' }}>
              {errorMessage && <p className="error-message">{errorMessage}</p>}
            </div>

            <button 
              type="submit" 
              className="login-button" 
              disabled={!isTermsChecked}
            >
              NEXT
            </button>
          </form>

          <p className="back-to-login-text">
            Already have an account? <Link to="/" className="back-link">Log In!</Link>
          </p>

          <span className="version" style={{marginTop: '30px'}}>v1.0.62</span>
        </div>
      </div>
    </div>
  );
};

export default SignUp;