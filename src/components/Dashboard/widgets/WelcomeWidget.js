import React from 'react';

const WelcomeWidget = ({ userName, companyName, purpose }) => {
  return (
    <div className="welcome-widget">
      <div className="welcome-content" style={{ 
        width: '100%', 
        maxWidth: '800px', 
        margin: '0 auto',
        textAlign: 'center',
        padding: '40px 20px'
      }}>
        <h1 className="welcome-title" style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#333',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Good Afternoon, {userName || 'User'}!
        </h1>
        
       
        
        <p className="welcome-message" style={{
          color: '#6b7280',
          marginBottom: '10px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto 10px'
        }}>
          Welcome to your Zencia.AI dashboard.
        </p>
        
        <p className="personalized-message" style={{
          color: '#6b7280',
          marginBottom: '20px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Let's make your companion application even better with these recommendations:
        </p>
      </div>
    </div>
  );
};

export default WelcomeWidget;