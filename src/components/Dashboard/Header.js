import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

// In Header.js
const Header = ({ user, companyName }) => {
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
  
  const toggleProfile = () => {
    setShowProfile(!showProfile);
  };
  
  const getInitials = (name) => {
    if (!name) return 'U';
    
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const handleProfileNavigation = (path) => {
    // Close the dropdown after navigation
    setShowProfile(false);
    // Navigate to the selected page
    console.log("Navigating to:", path);
    navigate(path);
  };
  
  // Get the display name from user object
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  
  return (
    <div className="dashboard-header">
      <div className="header-title">
        {/* Display just the username instead of company name */}
        <h1>Welcome {displayName} !</h1>
      </div>
      
      <div className="header-actions">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search..."
          />
          <i className="search-icon"></i>
        </div>
        
        <div className="notification-icon">
          <i className="notification-bell"></i>
          <span className="notification-badge">3</span>
        </div>
        
        <div className="profile-container">
          <div className="profile-avatar" onClick={toggleProfile}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="avatar-image" />
            ) : (
              <div className="avatar-initials">
                {getInitials(displayName)}
              </div>
            )}
          </div>
          
          {showProfile && (
            <div className="profile-dropdown">
              <div className="profile-header">
                <div className="profile-name">{displayName}</div>
                <div className="profile-email">{user?.email}</div>
              </div>
              
              <div className="profile-menu">
                <div 
                  className="profile-menu-item"
                  onClick={() => handleProfileNavigation('/profile')}
                >
                  <i className="profile-icon"></i>
                  <span>My Profile</span>
                </div>
                
                <div 
                  className="profile-menu-item"
                  onClick={() => handleProfileNavigation('/settings')}
                >
                  <i className="settings-icon"></i>
                  <span>Account Settings</span>
                </div>
                
                <div 
                  className="profile-menu-item"
                  onClick={() => handleProfileNavigation('/tickets')}
                >
                  <i className="help-icon"></i>
                  <span>Help & Support</span>
                </div>
                
                <div className="profile-menu-divider"></div>
                
                <div 
                  className="profile-menu-item logout"
                  onClick={() => {
                    // Clear user data and authentication state
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    // Navigate to login
                    navigate('/login');
                  }}
                >
                  <i className="logout-icon"></i>
                  <span>Logout</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;