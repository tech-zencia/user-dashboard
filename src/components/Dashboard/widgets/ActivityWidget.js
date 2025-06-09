import React from 'react';
import '../Dashboard.css';

const ActivityWidget = ({ role, activities, onNavigate }) => {
  // Function to format date/time
  const formatTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInHours = Math.floor((now - activityTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
  };
  
  // Function to get icon based on activity type
  const getActivityIcon = (type) => {
    switch(type) {
      case 'license':
        return { class: 'license-icon', backgroundColor: 'rgba(233, 74, 140, 0.1)' };
      case 'ticket':
        return { class: 'tickets-icon', backgroundColor: 'rgba(138, 77, 219, 0.1)' };
      case 'store':
        return { class: 'store-icon', backgroundColor: 'rgba(76, 175, 80, 0.1)' };
      default:
        return { class: 'dashboard-icon', backgroundColor: 'rgba(33, 150, 243, 0.1)' };
    }
  };
  
  // Function to handle navigation when clicking on an activity
  const handleActivityClick = (activity) => {
    switch(activity.type) {
      case 'license':
        onNavigate('/license-manager');
        break;
      case 'ticket':
        onNavigate('/tickets');
        break;
      case 'store':
        onNavigate('/store');
        break;
      default:
        // Default to dashboard
        break;
    }
  };

  return (
    <div className="widget">
      <div className="widget-header">
        <h3 className="widget-title">Recent Activity</h3>
        <div className="widget-actions">
          <button className="action-link">View All</button>
        </div>
      </div>
      
      <div className="activity-list">
        {activities.length > 0 ? (
          activities.map(activity => (
            <div 
              key={activity.id} 
              className="activity-item"
              onClick={() => handleActivityClick(activity)}
              style={{ cursor: 'pointer' }}
            >
              <div 
                className="activity-icon" 
                style={{ backgroundImage: 'none', backgroundColor: getActivityIcon(activity.type).backgroundColor }}
              >
                <i className={getActivityIcon(activity.type).class} style={{ width: '24px', height: '24px', backgroundSize: 'contain' }}></i>
              </div>
              <div className="activity-content">
                <div className="activity-title">{activity.title}</div>
                <div className="activity-description">{activity.description}</div>
                <div className="activity-time">{formatTime(activity.timestamp)}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-activity" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
            No recent activity to display
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityWidget;