import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom'; 
import './Shared.css';
import './Login.css';

import logo from './assets/juancast_logo.webp';
import heroIcon from './assets/juancast_icon.webp'; 

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  
  // NEW: State for form inputs and errors
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // NEW: Handle form submission to the database
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Clear old errors

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Save the logged-in user to localStorage so other pages know who is active
        localStorage.setItem('juancast_user', JSON.stringify(data.user));
        
        // Redirect to the Landing Page
        navigate('/');
      } else {
        // Show the error message from the backend (e.g., "Invalid email or password")
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
          <h1 className="login-title">Account Login</h1>
          
          {/* UPDATED: Attach the handleLogin function to the form */}
          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <input 
                type="email" 
                placeholder="jack.roberto@gmail.com" 
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group password-group">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="password-toggle" 
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember Me</label>
            </div>

            {/* NEW: Error Message Display */}
            <div style={{ minHeight: '24px', marginBottom: '10px', textAlign: 'center' }}>
              {errorMessage && <p style={{ color: 'red', margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{errorMessage}</p>}
            </div>

            <button type="submit" className="login-button">LOGIN</button>
          </form>

          <a href="#" className="forgot-password">forgot password?</a>

          <p className="signup-text">
            Don't have an account? <Link to="/signup" className="signup-link">Sign Up!</Link>
          </p>

          <div className="footer-links">
            <a href="#">Learn More</a>
            <span className="divider">|</span>
            <a href="#">Data Policy</a>
          </div>

          <span className="version">v1.0.62</span>
        </div>
      </div>
    </div>
  );
};

export default Login;