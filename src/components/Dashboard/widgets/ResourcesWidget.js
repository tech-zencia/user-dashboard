import React from 'react';
import '../Dashboard.css';

const ResourcesWidget = ({ role, purpose, industry, onNavigate }) => {
  // Resources based on user preferences
  const resources = [
    {
      id: 'setup-guide',
      title: 'Complete Setup',
      description: 'Finish setting up Zencia Edge on your system',
      icon: 'get-started-icon',
      buttonText: 'Continue Setup',
      path: '/dashboard?showSetup=true'
    },
    {
      id: 'license-manager',
      title: 'License Management',
      description: 'Generate and manage license keys for your clients',
      icon: 'license-icon',
      buttonText: 'Manage Licenses',
      path: '/license-manager'
    },
    {
      id: 'tools',
      title: 'Offline Tools',
      description: 'Explore our suite of privacy-focused offline tools',
      icon: 'store-icon',
      buttonText: 'View Tools',
      path: '/store'
    },
    {
      id: 'support',
      title: 'Support Center',
      description: 'Get help with any issues or questions',
      icon: 'tickets-icon',
      buttonText: 'Open Ticket',
      path: '/tickets'
    }
  ];

  return (
    <div className="widget">
      <div className="widget-header">
        <h3 className="widget-title">Quick Actions</h3>
      </div>
      
      <div className="resources-list">
        {resources.map(resource => (
          <div key={resource.id} className="resource-item">
            <div 
              className="resource-icon" 
              style={{ backgroundImage: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              <i className={resource.icon} style={{ width: '24px', height: '24px', backgroundSize: 'contain' }}></i>
            </div>
            <div className="resource-content">
              <div className="resource-title">{resource.title}</div>
              <div className="resource-description">{resource.description}</div>
            </div>
            <button 
              className="resource-button"
              onClick={() => onNavigate(resource.path)}
            >
              {resource.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourcesWidget;