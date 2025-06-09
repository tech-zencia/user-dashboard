import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import './css/forget_password.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email has been sent. Please check your inbox.');
      
      // Clear form
      setEmail('');
      
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (error) {
      let errorMessage = 'Failed to send password reset email.';
      
      // Provide more specific error messages based on Firebase error codes
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account exists with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }
      
      setError(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-forgot-container">
      {/* Left Panel */}
      <div className="welcome-panel">
        <div className="welcome-content">
          <div className="logo">
            <img src="\logo.png" alt="Logo" />
          </div>
          
          <div className="welcome-text">
            <h1>Forgot Password?</h1>
            <p>Don't worry, we'll help you reset your password in a few simple steps</p>
          </div>
        </div>
      </div>
      
      {/* Right Panel */}
      <div className="forgot-panel">
        <div className="forgot-form-wrapper">
          <h2>Reset Your Password</h2>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="recovery-instructions">
            <p>Enter your email address and we'll send you a link to reset your password.</p>
          </div>
          
          <form onSubmit={handleResetPassword} className="forgot-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <button type="submit" disabled={loading} className="reset-btn">
              {loading ? 'SENDING...' : 'SEND RESET LINK'}
            </button>
          </form>
          
          <div className="action-links">
            <Link to="/login" className="back-to-login">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;