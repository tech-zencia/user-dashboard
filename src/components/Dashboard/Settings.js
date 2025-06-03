import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';
import Sidebar from './Sidebar';
import Header from './Header';
import LoadingOverlay from '../common/LoadingOverlay';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    photoURL: null,
    phoneNumber: '',
    jobTitle: '',
    company: '',
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
  });

  const [userPreferences, setUserPreferences] = useState({
    role: '',
    purpose: '',
    companyName: '',
    teamSize: '',
    industry: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: ''
  });

  useEffect(() => {
    const currentUser = localStorage.getItem('user');
    
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const userRole = localStorage.getItem('userRole');
    const userPurpose = localStorage.getItem('userPurpose');
    const companyName = localStorage.getItem('companyName');
    
    if (!userRole || !userPurpose || !companyName) {
      navigate('/onboarding/role');
      return;
    }
    
    const parsedUser = JSON.parse(currentUser);
    setUser(parsedUser);
    
    setUserPreferences({
      role: localStorage.getItem('userRole') || '',
      purpose: localStorage.getItem('userPurpose') || '',
      companyName: localStorage.getItem('companyName') || '',
      teamSize: localStorage.getItem('teamSize') || '',
      industry: localStorage.getItem('industry') || ''
    });
    
    setProfileData({
      displayName: parsedUser.displayName || '',
      email: parsedUser.email || '',
      photoURL: null,
      phoneNumber: localStorage.getItem('userPhone') || '',
      jobTitle: localStorage.getItem('userJobTitle') || '',
      company: localStorage.getItem('companyName') || '',
    });
    
    setLoading(false);
  }, [navigate]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecurityData({
      ...securityData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    let label = '';
    
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    switch(score) {
      case 0:
      case 1:
        label = 'Weak';
        break;
      case 2:
      case 3:
        label = 'Medium';
        break;
      case 4:
        label = 'Good';
        break;
      case 5:
        label = 'Strong';
        break;
      default:
        label = '';
    }
    
    setPasswordStrength({ score, label });
  };

  const handleSaveProfile = () => {
    setLoading(true);
    
    setTimeout(() => {
      try {
        localStorage.setItem('userPhone', profileData.phoneNumber);
        localStorage.setItem('userJobTitle', profileData.jobTitle);
        localStorage.setItem('companyName', profileData.company);
        
        const currentUser = JSON.parse(localStorage.getItem('user'));
        currentUser.displayName = profileData.displayName;
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        setUser(currentUser);
        setSuccessMessage('Profile information updated successfully.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        setErrorMessage('An error occurred while saving your profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  const handleSaveSecurity = () => {
    if (securityData.newPassword) {
      if (securityData.newPassword !== securityData.confirmPassword) {
        setErrorMessage('New password and confirm password do not match.');
        return;
      }
      
      if (passwordStrength.score < 3) {
        setErrorMessage('Please use a stronger password.');
        return;
      }
      
      if (!securityData.currentPassword) {
        setErrorMessage('Current password is required to set a new password.');
        return;
      }
    }
    
    setLoading(true);
    
    setTimeout(() => {
      try {
        setSuccessMessage('Security settings updated successfully.');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        setSecurityData({
          ...securityData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordStrength({ score: 0, label: '' });
      } catch (error) {
        setErrorMessage('An error occurred while updating security settings. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  if (loading) {
    return <LoadingOverlay message="Loading settings..." />;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar 
        userRole={userPreferences.role}
        currentView="settings"
      />
      
      <div className="dashboard-main">
        <Header user={user} companyName={userPreferences.companyName} />
        
        <div className="dashboard-content">
          <LoadingOverlay 
            isVisible={loading} 
            message="Updating settings..." 
          />
          
          <div className="settings-container">
            <div className="settings-header">
              <h1>Settings</h1>
            </div>
            
            <p className="settings-description">
              Manage your account settings, profile information, and preferences.
            </p>
            
            {successMessage && (
              <div className="success-message">
                {successMessage}
              </div>
            )}
            
            {errorMessage && (
              <div className="error-message">
                {errorMessage}
              </div>
            )}
            
            <div className="settings-tabs">
              <button 
                className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleTabChange('profile')}
              >
                Profile
              </button>
              <button 
                className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => handleTabChange('security')}
              >
                Security
              </button>
            </div>
            
            {/* Profile Panel */}
            <div className={`settings-panel ${activeTab === 'profile' ? 'active' : ''}`}>
              <div className="settings-section">
                <h2 className="section-title">Profile Information</h2>
                <p className="section-description">
                  Update your personal information and how others see you on the platform.
                </p>
                
                <div>
                  <div className="avatar-upload">
                    <div className="current-avatar">
                      {profileData.photoURL ? (
                        <img src={profileData.photoURL} alt="Profile" className="avatar-image" />
                      ) : (
                        <span>{getUserInitials(profileData.displayName)}</span>
                      )}
                    </div>
                    
                    <div className="avatar-upload-actions">
                      <label className="upload-button">
                        <input type="file" accept="image/*" style={{ display: 'none' }} />
                        Upload New Image
                      </label>
                      <button type="button" className="remove-avatar-button">
                        Remove Image
                      </button>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="displayName">Full Name</label>
                      <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        value={profileData.displayName}
                        onChange={handleProfileChange}
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="email">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        placeholder="your.email@example.com"
                        disabled
                      />
                      <span className="hint-text">Email cannot be changed directly. Contact support for assistance.</span>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phoneNumber">Phone Number</label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={profileData.phoneNumber}
                        onChange={handleProfileChange}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="jobTitle">Job Title</label>
                      <input
                        type="text"
                        id="jobTitle"
                        name="jobTitle"
                        value={profileData.jobTitle}
                        onChange={handleProfileChange}
                        placeholder="Your position"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="company">Company Name</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={profileData.company}
                      onChange={handleProfileChange}
                      placeholder="Your company name"
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button type="button" className="primary-button" onClick={handleSaveProfile} disabled={loading}>
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Security Panel */}
            <div className={`settings-panel ${activeTab === 'security' ? 'active' : ''}`}>
              <div className="settings-section">
                <h2 className="section-title">Password</h2>
                <p className="section-description">
                  Update your password regularly to keep your account secure.
                </p>
                
                <div>
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={securityData.currentPassword}
                      onChange={handleSecurityChange}
                      placeholder="Enter your current password"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={securityData.newPassword}
                        onChange={handleSecurityChange}
                        placeholder="Enter a new password"
                      />
                      
                      {securityData.newPassword && (
                        <div className="password-strength">
                          <div className="strength-meter">
                            <div className={`strength-meter-bar ${
                              passwordStrength.score <= 1 ? 'weak' : 
                              passwordStrength.score <= 3 ? 'medium' : 
                              passwordStrength.score <= 4 ? 'good' : 'strong'
                            }`}></div>
                          </div>
                          <div className="strength-text">
                            <span>Password Strength: {passwordStrength.label}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={securityData.confirmPassword}
                        onChange={handleSecurityChange}
                        placeholder="Confirm your new password"
                      />
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="button" className="primary-button" onClick={handleSaveSecurity} disabled={loading}>
                      Update Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;