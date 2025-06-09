import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';
import TextLogo from '../common/TextLogo';
import { storeUserData } from '../../userService';

const UserInfo = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [referralSource, setReferralSource] = useState(localStorage.getItem('referralSource') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Referral sources
  const referralOptions = [
    { id: 'friend', label: 'From a friend or colleague', icon: '👥' },
    { id: 'internet', label: 'Internet (newsletter, blog, podcast, etc.)', icon: '🌐' },
    { id: 'search', label: 'Search (Google, Bing, etc.)', icon: '🔍' },
    { id: 'tiktok', label: 'TikTok', icon: '📱' },
    { id: 'instagram', label: 'Instagram', icon: '📷' },
    { id: 'facebook', label: 'Facebook', icon: '📘' },
    { id: 'youtube', label: 'YouTube', icon: '📺' },
    { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { id: 'other', label: 'Other', icon: '📝' },
  ];

  const isFormValid = () => {
    return userName.trim() !== '';
  };

  const handleContinue = async () => {
    if (!isFormValid()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Save the user information to localStorage immediately
      localStorage.setItem('userName', userName);
      if (referralSource) {
        localStorage.setItem('referralSource', referralSource);
      }
      
      // Set the completion flag - this is critical for preventing onboarding loops
      localStorage.setItem('hasCompletedOnboarding', 'true');
      
      // Get current user
      const userJson = localStorage.getItem('user');
      if (!userJson) {
        navigate('/login');
        return;
      }
      
      const user = JSON.parse(userJson);
      
      // Try to store in server for persistence, but don't block on API errors
      try {
        const result = await storeUserData({
          email: user.email,
          userName: userName,
          referralSource: referralSource,
          hasCompletedOnboarding: true // Important to include this flag
        });
        
        if (!result.success) {
          console.warn("Warning: API error when saving user data:", result.error);
          // Continue anyway since we've saved to localStorage
        }
      } catch (apiError) {
        console.warn("Warning: Error saving user data to server, but continuing with local storage:", apiError);
        // Continue anyway since we've saved to localStorage
      }
      
      // Navigate to the dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error("Error in handleContinue:", error);
      setError("An error occurred while saving your information. Please try again.");
      
      // Even if there's an error, we've already saved to localStorage
      // So let's try to navigate to dashboard anyway after a delay
      setTimeout(() => {
        try {
          navigate('/dashboard');
        } catch (navError) {
          console.error("Error navigating to dashboard:", navError);
        }
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/purpose');
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        <div className="logo-container">
          <TextLogo color="#6366f1" />
        </div>
        
        <h1 className="onboarding-title">Almost there!</h1>
        <p className="onboarding-subtitle">
          Just a couple more things to set up your account
        </p>
        
        <div className="form-container">
          <div className="form-group">
            <label htmlFor="user-name">Your Name</label>
            <input
              id="user-name"
              type="text"
              className="form-input"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </div>
        </div>
        
        <h2 className="referral-title">How did you hear about us?</h2>
        <p className="referral-subtitle">Optional (but appreciated)</p>
        
        <div className="referral-options-container">
          {referralOptions.map((option) => (
            <button 
              key={option.id}
              className={`referral-option ${referralSource === option.id ? 'selected' : ''}`}
              onClick={() => setReferralSource(option.id)}
              type="button"
            >
              <span className="referral-icon">{option.icon}</span>
              <span className="referral-label">{option.label}</span>
            </button>
          ))}
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="onboarding-navigation">
          <button 
            className="back-button-circle"
            onClick={handleBack}
            disabled={loading}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          
          <button 
            className="continue-button done-button"
            onClick={handleContinue}
            disabled={!isFormValid() || loading}
            type="button"
          >
            {loading ? 'Saving...' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;