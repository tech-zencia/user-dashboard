import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';
import TextLogo from '../common/TextLogo';
import { storeUserData } from '../../userService';

const PurposeSelection = () => {
  const navigate = useNavigate();
  const [selectedPurpose, setSelectedPurpose] = useState('');
  const [loading, setLoading] = useState(false);

  // Work types with icons
  const workTypes = [
    { id: 'consultant', label: 'Consultant', icon: '💼' },
    { id: 'creator', label: 'Creator', icon: '🎨' },
    { id: 'customer-service', label: 'Customer service', icon: '👩‍💼' },
    { id: 'data', label: 'Data', icon: '📊' },
    { id: 'design', label: 'Design', icon: '🎨' },
    { id: 'engineering', label: 'Engineering', icon: '🔧' },
    { id: 'finance', label: 'Finance', icon: '💰' },
    { id: 'hr', label: 'HR', icon: '👥' },
    { id: 'leadership', label: 'Leadership', icon: '👑' },
    { id: 'legal', label: 'Legal', icon: '⚖️' },
    { id: 'marketing', label: 'Marketing', icon: '📢' },
    { id: 'operations', label: 'Operations', icon: '🔄' },
    { id: 'product', label: 'Product', icon: '📱' },
    { id: 'recruiting', label: 'Recruiting', icon: '👥' },
    { id: 'sales', label: 'Sales', icon: '💰' },
    { id: 'other', label: 'Other', icon: '🌟' },
  ];

  const handlePurposeSelect = (purpose) => {
    setSelectedPurpose(purpose);
  };

  const isFormValid = () => {
    return selectedPurpose !== '';
  };

  const handleContinue = async () => {
    if (!isFormValid()) return;
    
    setLoading(true);
    
    try {
      // Get current user
      const userJson = localStorage.getItem('user');
      if (!userJson) {
        navigate('/login');
        return;
      }
      
      const user = JSON.parse(userJson);
      
      // Save the selected purpose locally
      localStorage.setItem('userPurpose', selectedPurpose);
      
      // Store in server for persistence
      await storeUserData({
        email: user.email,
        userPurpose: selectedPurpose
      });
      
      // Navigate to company info page or dashboard
      navigate('/onboarding/company');
    } catch (error) {
      console.error("Error saving purpose data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/role');
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-content purpose-content">
        <div className="logo-container">
          <TextLogo color="#6366f1" />
        </div>
        
        <h1 className="onboarding-title">What kind of work do you do?</h1>
        
        <div className="work-type-grid">
          {workTypes.map((type) => (
            <button 
              key={type.id}
              className={`work-type-item ${selectedPurpose === type.id ? 'selected' : ''}`}
              onClick={() => handlePurposeSelect(type.id)}
            >
              <span className="work-type-icon">{type.icon}</span>
              <span className="work-type-label">{type.label}</span>
            </button>
          ))}
        </div>
        
        <div className="onboarding-navigation">
          <button 
            className="back-button-circle"
            onClick={handleBack}
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          
          <button 
            className={`continue-button ${!isFormValid() || loading ? 'disabled' : ''}`}
            onClick={handleContinue}
            disabled={!isFormValid() || loading}
          >
            {loading ? 'Saving...' : 'Continue'}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurposeSelection;