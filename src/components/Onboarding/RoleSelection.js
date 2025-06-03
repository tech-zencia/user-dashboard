import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';
import TextLogo from '../common/TextLogo';
import { storeUserData } from '../../userService';

const RoleSelection = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleNext = async () => {
    // Only navigate if a role is selected
    if (selectedRole) {
      setLoading(true);
      
      try {
        // Store role in localStorage for immediate use
        localStorage.setItem('userRole', selectedRole);
        
        // Get current user
        const userJson = localStorage.getItem('user');
        if (!userJson) {
          navigate('/login');
          return;
        }
        
        const user = JSON.parse(userJson);
        
        // Store in server for persistence
        await storeUserData({
          email: user.email,
          userRole: selectedRole
        });
        
        // Navigate to next step
        navigate('/onboarding/purpose');
      } catch (error) {
        console.error("Error saving role:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        <div className="logo-container">
          <TextLogo color="#6366f1" />
        </div>
        
        <h1 className="onboarding-title">Welcome to Zencia</h1>
        <p className="onboarding-subtitle">
          Help us personalize your experience. You can change this later.
        </p>
        
        {/* Updated role selection to match the design in the provided image */}
        <div className="purpose-options-vertical">
          <button 
            className={`purpose-option-card ${selectedRole === 'work' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('work')}
          >
            <div className="purpose-icon-container">
              <span className="purpose-icon">💼</span>
            </div>
            <div className="purpose-option-content">
              <div className="purpose-option-title">For work</div>
            </div>
          </button>
          
          <button 
            className={`purpose-option-card ${selectedRole === 'personal' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('personal')}
          >
            <div className="purpose-icon-container">
              <span className="purpose-icon">💻</span>
            </div>
            <div className="purpose-option-content">
              <div className="purpose-option-title">For personal use</div>
            </div>
          </button>
          
          <button 
            className={`purpose-option-card ${selectedRole === 'education' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('education')}
          >
            <div className="purpose-icon-container">
              <span className="purpose-icon">📚</span>
            </div>
            <div className="purpose-option-content">
              <div className="purpose-option-title">For education</div>
              <div className="purpose-option-subtitle">As a student or educator</div>
            </div>
          </button>
        </div>
        
        <button 
          className={`onboarding-button ${!selectedRole || loading ? 'disabled' : ''}`}
          onClick={handleNext}
          disabled={!selectedRole || loading}
        >
          {loading ? 'Saving...' : 'Next →'}
        </button>
      </div>
    </div>
  );
};

export default RoleSelection;