import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Shared.css';
import './Login.css';
import './ForgotPassword.css';

import logo from './assets/juancast_logo.webp';
import heroIcon from './assets/juancast_icon.webp';

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetComplete, setIsResetComplete] = useState(false);

  const submitRequest = async (event) => {
    event.preventDefault();
    setMessage('');
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch('https://juancast.onrender.com/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not request a password reset.');
      setMessage(result.message);
    } catch (error) {
      setErrorMessage(error.message || 'Could not connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitReset = async (event) => {
    event.preventDefault();
    setMessage('');
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('https://juancast.onrender.com/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not reset the password.');
      setMessage(result.message);
      setIsResetComplete(true);
    } catch (error) {
      setErrorMessage(error.message || 'Could not connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img src={heroIcon} alt="JuanCast" className="hero-icon" />
      </div>
      <div className="login-right">
        <div className="login-content password-reset-content">
          <img src={logo} alt="JuanCast Logo" className="logo" />
          <h1 className="login-title">{token ? 'Choose a New Password' : 'Forgot Password?'}</h1>
          {token ? (
            isResetComplete ? (
              <div className="password-reset-result">
                <p className="password-reset-message" role="status">{message}</p>
                <Link to="/login" className="password-reset-submit">Back to Login</Link>
              </div>
            ) : (
              <form className="login-form password-reset-form" onSubmit={submitReset}>
                <p className="password-reset-description">Choose a new password with at least 8 characters.</p>
                <input
                  type="password"
                  className="login-input"
                  placeholder="New password"
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  required
                />
                <input
                  type="password"
                  className="login-input"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  required
                />
                {errorMessage && <p className="password-reset-error" role="alert">{errorMessage}</p>}
                <button type="submit" className="login-button password-reset-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'UPDATING...' : 'UPDATE PASSWORD'}
                </button>
              </form>
            )
          ) : (
            <form className="login-form password-reset-form" onSubmit={submitRequest}>
              <p className="password-reset-description">Enter your account email to receive a password reset link.</p>
              <input
                type="email"
                className="login-input"
                placeholder="Email address"
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
              />
              {message && <p className="password-reset-message" role="status">{message}</p>}
              {errorMessage && <p className="password-reset-error" role="alert">{errorMessage}</p>}
              <button type="submit" className="login-button password-reset-submit" disabled={isSubmitting}>
                {isSubmitting ? 'SENDING...' : 'SEND RESET LINK'}
              </button>
            </form>
          )}
          {!isResetComplete && <p className="password-reset-back"><Link to="/login">Back to Login</Link></p>}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
