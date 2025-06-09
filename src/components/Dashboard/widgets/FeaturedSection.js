import React from 'react';
import './FeaturedSection.css';

const FeaturedSection = ({ onGetStarted }) => {
  return (
    <div className="featured-section">
      <div className="featured-content">
        <div className="featured-text">
          <h2 className="featured-title">Protect Your Data with Zencia Edge</h2>
          <p className="featured-description">
            Zencia Edge provides offline-first tools that ensure your sensitive data never leaves your device.
            Our suite of productivity tools works completely offline, giving you peace of mind while maintaining
            high productivity.
          </p>
          
          <div className="featured-highlights">
            <div className="highlight-item">
              <div className="highlight-icon privacy-icon"></div>
              <div className="highlight-text">
                <h3>Privacy First</h3>
                <p>Your data stays on your device, with no cloud uploads</p>
              </div>
            </div>
            
            <div className="highlight-item">
              <div className="highlight-icon tools-icon"></div>
              <div className="highlight-text">
                <h3>Essential Tools</h3>
                <p>PDF editors, file converters, encryption tools and more</p>
              </div>
            </div>
            
            <div className="highlight-item">
              <div className="highlight-icon license-icon"></div>
              <div className="highlight-text">
                <h3>Simple Licensing</h3>
                <p>Easy-to-manage licenses for your entire team or organization</p>
              </div>
            </div>
          </div>
          
          <div className="featured-buttons">
            <button className="primary-button get-started-button" onClick={onGetStarted}>
              Get Started
            </button>
            <button className="secondary-button learn-more-button">
              Learn More
            </button>
          </div>
        </div>
        
        <div className="featured-illustration">
          <div className="illustration-container">
            <div className="device-mockup">
              <div className="device-screen">
                <div className="screen-content">
                  <div className="app-interface">
                    <div className="app-header"></div>
                    <div className="app-sidebar"></div>
                    <div className="app-workspace">
                      <div className="workspace-item"></div>
                      <div className="workspace-item"></div>
                      <div className="workspace-item"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="device-base"></div>
            </div>
            <div className="floating-element privacy-shield"></div>
            <div className="floating-element document-icon"></div>
            <div className="floating-element lock-icon"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedSection;