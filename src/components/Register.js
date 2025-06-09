import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, signInWithGoogle } from '../firebase';
import { sendOTPToEmail, verifyOTP } from '../emailOtpService';
import './css/register.css';

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState(1); // 1: Enter details, 2: Verify OTP
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleRegisterStart = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);

    try {
      // Send OTP to email
      const otpSent = sendOTPToEmail(email);
      
      if (otpSent) {
        setOtpSent(true);
        setSuccess('OTP has been sent to your email. Please verify to complete registration.');
        setStep(2);
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      setError('Failed to initiate registration. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      // Verify the OTP
      const verification = verifyOTP(email, otpCode);
      
      if (verification.success) {
        // OTP is verified, now register the user in Firebase
        const result = await register(email, password);
        
        if (!result.success) {
          setError(result.error);
          setStep(1); // Go back to first step if Firebase registration fails
        } else {
          // Registration successful
          setSuccess('Your account has been created successfully! You will be redirected to login.');
          
          // Clear form
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setOtpCode('');
          
          // Redirect to login after a delay
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } else {
        setError(verification.message);
      }
    } catch (error) {
      setError('Failed to verify OTP. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    setError('');
    setSuccess('');
    sendOTPToEmail(email);
    setSuccess('OTP has been resent to your email.');
  };
  
  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    
    try {
      const result = await signInWithGoogle();
      
      if (result.success) {
        console.log("Google sign-up successful, user:", result.user);
        
        // Explicitly store user in localStorage
        localStorage.setItem('user', JSON.stringify({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        }));
        
        navigate('/dashboard');
      } else {
        console.error("Google sign-up failed:", result.error);
        setError(result.error);
      }
    } catch (error) {
      console.error("Google sign-up exception:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-register-container">
      {/* Left Panel */}
      <div className="welcome-panel">
        <div className="welcome-content">
          <div className="logo">
            <img src="\logo.png" alt="Logo" />
          </div>
          
          <div className="welcome-text">
            <h1>Create Account</h1>
            <p>Join our community and start your journey with us</p>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Registration Form */}
      <div className="register-panel">
        <div className="register-form-wrapper">
          <h2>
            {step === 1 ? 'Create Your Account' : 'Verify Your Email'}
          </h2>
          
          {step === 1 && (
            <div className="google-signup">
              <button className="google-btn" onClick={handleGoogleSignUp} disabled={loading}>
                <svg className="google-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>Sign up with Google</span>
              </button>
            </div>
          )}
          
          {step === 1 && (
            <div className="divider">
              <span>or register with email</span>
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          {step === 1 ? (
            // Step 1: Enter email and password
            <form onSubmit={handleRegisterStart} className="register-form">
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
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>
              
              <button type="submit" disabled={loading} className="register-btn">
                {loading ? 'PROCESSING...' : 'CONTINUE'}
              </button>
            </form>
          ) : (
            // Step 2: OTP Verification
            <form onSubmit={handleVerifyOTP} className="register-form">
              <div className="otp-message">
                <p>We've sent a verification code to <strong>{email}</strong>.</p>
                <p>Please check your inbox and enter the code below.</p>
              </div>
              
              <div className="form-group">
                <label htmlFor="otpCode">Verification Code</label>
                <input
                  type="text"
                  id="otpCode"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                />
              </div>
              
              <button type="submit" disabled={loading} className="register-btn">
                {loading ? 'VERIFYING...' : 'VERIFY & REGISTER'}
              </button>
              
              <div className="otp-actions">
                <button 
                  type="button" 
                  onClick={handleResendOTP} 
                  className="action-link"
                >
                  Resend Code
                </button>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="action-link"
                >
                  Change Email
                </button>
              </div>
            </form>
          )}
          
          <div className="login-link">
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;