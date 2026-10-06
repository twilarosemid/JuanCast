import React, { useState, useEffect } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom'; 
import './Shared.css';
import './Login.css';

import logo from './assets/juancast_logo.webp';
import heroIcon from './assets/juancast_icon.webp'; 

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  
  // State for form inputs and errors
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const savedLogin = localStorage.getItem('juancast_remembered_user');
    if (!savedLogin) return;

    try {
      const parsedLogin = JSON.parse(savedLogin);
      if (parsedLogin?.email) {
        setEmail(parsedLogin.email);
        setPassword(parsedLogin.password || '');
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Failed to load remembered login:', error);
      localStorage.removeItem('juancast_remembered_user');
    }
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle form submission to the database
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Clear old errors

    try {
      const response = await fetch('[https://juancast.onrender.com](https://juancast.onrender.com)/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Save the logged-in user to localStorage so other pages know who is active
        const isAdmin = Boolean(data.user?.isAdmin || data.user?.role === 'admin');
        const currentUser = {
          ...data.user,
          isAdmin,
          role: data.user?.role || (isAdmin ? 'admin' : 'user')
        };

        localStorage.setItem('juancast_user', JSON.stringify(currentUser));
        if (rememberMe) {
          localStorage.setItem('juancast_remembered_user', JSON.stringify({ email, password }));
        } else {
          localStorage.removeItem('juancast_remembered_user');
        }
        window.dispatchEvent(new Event('juancast-user-updated'));

        // Redirect admin users to dashboard, regular users to landing page with Daily Modal trigger
        if (currentUser.isAdmin) {
          navigate('/admin');
        } else {
          navigate('/', { state: { showDailyModal: true } });
        }
        
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
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember">Remember Me</label>
            </div>

            {/* Error Message Display */}
            <div style={{ minHeight: '24px', marginBottom: '10px', textAlign: 'center' }}>
              {errorMessage && <p style={{ color: 'red', margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{errorMessage}</p>}
            </div>

            <button type="submit" className="login-button">LOGIN</button>
          </form>

          <Link to="/forgot-password" className="forgot-password">forgot password?</Link>

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