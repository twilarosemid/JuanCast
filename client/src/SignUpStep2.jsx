    import React, { useState } from 'react';
    import { Link, useNavigate, useLocation } from 'react-router-dom';

    import { FiEye, FiEyeOff } from 'react-icons/fi';
    import './Shared.css';
    import './SignUp.css';

    import logo from './assets/juancast_logo.webp';
    import heroIcon from './assets/juancast_icon.webp'; 

    const SignUpStep2 = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Extracting data passed from Step 1
    const { fullName, username, birthdate, gender } = location.state || {};
    
    const [showPassword1, setShowPassword1] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handlePasswordChange = (e) => {
        const val = e.target.value;
        setPassword(val);

        if (val.length > 0 && val.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        } else if (confirmPassword.length > 0 && val !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        } else {
        setErrorMessage(''); 
        }
    };

    const handleConfirmChange = (e) => {
        const val = e.target.value;
        setConfirmPassword(val);

        if (password.length > 0 && password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        } else if (val.length > 0 && password !== val) {
        setErrorMessage('Passwords do not match.');
        } else {
        setErrorMessage(''); 
        }
    };

    const handleNext = (e) => {
        e.preventDefault();
        // Pass everything forward to Step 3
        navigate('/signup-step-3', { 
        state: { fullName, username, birthdate, gender, password } 
        });
    }; // <-- FIXED: Added the missing closing bracket here

    const isFormValid = password.length >= 6 && password === confirmPassword;

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
                <div className="step-circle step-active">2</div>
                <div className="step-line"></div>
                <div className="step-circle step-inactive">3</div>
                <div className="step-line"></div>
                <div className="step-circle step-inactive">4</div>
            </div>
            
            <form className="login-form" onSubmit={handleNext}>
                <div className="input-group password-group">
                <input 
                    type={showPassword1 ? "text" : "password"} 
                    placeholder="Enter your password..." 
                    className="login-input"
                    value={password}
                    onChange={handlePasswordChange}
                    required 
                />
                <button 
                    type="button" 
                    className="password-toggle" 
                    onClick={() => setShowPassword1(!showPassword1)}
                    tabIndex="-1" 
                >
                    {showPassword1 ? <FiEyeOff /> : <FiEye />}
                </button>
                </div>

                <div className="input-group password-group">
                <input 
                    type={showPassword2 ? "text" : "password"} 
                    placeholder="Confirm your password..." 
                    className="login-input"
                    value={confirmPassword}
                    onChange={handleConfirmChange}
                    required 
                />
                <button 
                    type="button" 
                    className="password-toggle" 
                    onClick={() => setShowPassword2(!showPassword2)}
                    tabIndex="-1" 
                >
                    {showPassword2 ? <FiEyeOff /> : <FiEye />}
                </button>
                </div>

                <div className="error-container">
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                </div>

                <button 
                type="submit" 
                className="login-button"
                disabled={!isFormValid}
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

    export default SignUpStep2;