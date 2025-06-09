import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Sidebar = ({ userRole, onShowSetupGuide, onNavigate, currentView }) => {
  const navigate = useNavigate();

  const handleNavigation = (path, item) => {
    // Notify parent component about navigation if the callback exists
    if (onNavigate) {
      onNavigate(item);
    }
    
    // For dashboard and get-started, use the callback for content switching
    // but also ensure navigation happens if they're on a different page
    if (path === '/dashboard' && window.location.pathname !== '/dashboard') {
      navigate(path);
    } else if (item !== 'dashboard' && item !== 'get-started') {
      navigate(path);
    }
  };

  const handleLogout = () => {
    // Clear user data and authentication state
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Navigate to login
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img src="/logo.png" alt="Zencia Logo" className="sidebar-logo" />
      </div>

      <div className="sidebar-menu">
        <div
          className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavigation('/dashboard', 'dashboard')}
        >
          <i className="sidebar-icon dashboard-icon"></i>
          <span className="sidebar-label">Dashboard</span>
        </div>

        {/* Get Started menu item */}
        <div
          className={`sidebar-item ${currentView === 'get-started' ? 'active' : ''}`}
          onClick={() => handleNavigation('/dashboard', 'get-started')}
        >
          <i className="sidebar-icon get-started-icon"></i>
          <span className="sidebar-label">Get Started</span>
        </div>

        {/* Plans menu item */}
        <div
          className={`sidebar-item ${currentView === 'plans' ? 'active' : ''}`}
          onClick={() => handleNavigation('/plans', 'plans')}
        >
          <i className="sidebar-icon plans-icon"></i>
          <span className="sidebar-label">Plans</span>
        </div>

        {/* License Manager menu item */}
        <div
          className={`sidebar-item ${currentView === 'license-manager' ? 'active' : ''}`}
          onClick={() => handleNavigation('/license-manager', 'license-manager')}
        >
          <i className="sidebar-icon license-icon"></i>
          <span className="sidebar-label">License Manager</span>
        </div>

        {/* Support Tickets menu item */}
        <div
          className={`sidebar-item ${currentView === 'tickets' ? 'active' : ''}`}
          onClick={() => handleNavigation('/tickets', 'tickets')}
        >
          <i className="sidebar-icon tickets-icon"></i>
          <span className="sidebar-label">Support Tickets</span>
        </div>

        {/* Store menu item */}
        <div
          className={`sidebar-item ${currentView === 'store' ? 'active' : ''}`}
          onClick={() => handleNavigation('/store', 'store')}
        >
          <i className="sidebar-icon store-icon"></i>
          <span className="sidebar-label">Tools Store</span>
        </div>

        {/* Settings menu item */}
        <div
          className={`sidebar-item ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => handleNavigation('/settings', 'settings')}
        >
          <i className="sidebar-icon settings-icon"></i>
          <span className="sidebar-label">Settings</span>
        </div>
      </div>

      <div className="sidebar-footer">
        <div
          className="sidebar-item logout"
          onClick={handleLogout}
        >
          <i className="sidebar-icon logout-icon"></i>
          <span className="sidebar-label">Logout</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;