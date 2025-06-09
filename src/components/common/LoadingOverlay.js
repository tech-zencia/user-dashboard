// File: src/components/common/LoadingOverlay.js
import React from 'react';
import './LoadingOverlay.css';

const LoadingOverlay = ({ 
  isVisible = true, 
  message = "Loading...", 
  variant = "morphing-dots" 
}) => {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="morphing-dots">
          <div></div>
          <div></div>
          <div></div>
        </div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingOverlay;