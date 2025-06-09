import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../firebase';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const verifyUserEmail = async () => {
      const oobCode = searchParams.get('oobCode');
      
      if (!oobCode) {
        setError('Invalid verification link. Please request a new verification email.');
        setVerifying(false);
        return;
      }
      
      try {
        const result = await verifyEmail(oobCode);
        if (result.success) {
          setSuccess(true);
        } else {
          setError(result.error || 'Failed to verify email. The link may have expired.');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again later.');
        console.error('Email verification error:', err);
      } finally {
        setVerifying(false);
      }
    };
    
    verifyUserEmail();
  }, [searchParams]);
  
  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>Email Verification</h2>
        
        {verifying && (
          <div className="verifying-message">
            <p>Verifying your email address...</p>
            <div className="spinner"></div>
          </div>
        )}
        
        {!verifying && success && (
          <div className="success-message">
            <p>Your email has been successfully verified!</p>
            <p>You can now log in to your account.</p>
            <div className="auth-links">
              <Link to="/login" className="btn-submit">Go to Login</Link>
            </div>
          </div>
        )}
        
        {!verifying && error && (
          <div className="error-message">
            <p>{error}</p>
            <div className="auth-links">
              <Link to="/login">Go to Login</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;