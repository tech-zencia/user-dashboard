import React, { useState } from 'react';

const StatsWidget = ({ role, purpose, licenseStats, ticketStats, onNavigate }) => {
  const [timeRange, setTimeRange] = useState('monthly');

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  return (
    <div className="widget">
      <div className="widget-header">
        <h3 className="widget-title">Statistics</h3>
        <div className="widget-actions">
          <select 
            className="time-range-select" 
            value={timeRange} 
            onChange={handleTimeRangeChange}
          >
            <option value="weekly">Last Week</option>
            <option value="monthly">Last Month</option>
            <option value="quarterly">Last Quarter</option>
            <option value="yearly">Last Year</option>
          </select>
        </div>
      </div>
      
      {/* License Stats Section */}
      <div>
        <h4 style={{ fontSize: '1rem', marginBottom: '10px' }}>License Management</h4>
        <div className="stats-container">
          <div className="stat-card" onClick={() => onNavigate('/license-manager')}>
            <div className="stat-label">Total Licenses</div>
            <div className="stat-value">{licenseStats.total}</div>
          </div>
          <div className="stat-card" onClick={() => onNavigate('/license-manager?status=active')}>
            <div className="stat-label">Active</div>
            <div className="stat-value">{licenseStats.active}</div>
            <div className="stat-trend up">
              <span className="trend-icon up"></span>
              3%
            </div>
          </div>
          <div className="stat-card" onClick={() => onNavigate('/license-manager?status=expired')}>
            <div className="stat-label">Expired</div>
            <div className="stat-value">{licenseStats.expired}</div>
          </div>
          <div className="stat-card" onClick={() => onNavigate('/license-manager?status=revoked')}>
            <div className="stat-label">Revoked</div>
            <div className="stat-value">{licenseStats.revoked}</div>
          </div>
        </div>
      </div>
      
      {/* Ticket Stats Section */}
      <div style={{ marginTop: '20px' }}>
        <h4 style={{ fontSize: '1rem', marginBottom: '10px' }}>Support Tickets</h4>
        <div className="stats-container">
          <div className="stat-card" onClick={() => onNavigate('/tickets')}>
            <div className="stat-label">Total Tickets</div>
            <div className="stat-value">{ticketStats.total}</div>
          </div>
          <div className="stat-card" onClick={() => onNavigate('/tickets?status=open')}>
            <div className="stat-label">Open</div>
            <div className="stat-value">{ticketStats.open}</div>
          </div>
          <div className="stat-card" onClick={() => onNavigate('/tickets?status=in-progress')}>
            <div className="stat-label">In Progress</div>
            <div className="stat-value">{ticketStats.inProgress}</div>
            <div className="stat-trend up">
              <span className="trend-icon up"></span>
              2%
            </div>
          </div>
          <div className="stat-card" onClick={() => onNavigate('/tickets?status=closed')}>
            <div className="stat-label">Closed</div>
            <div className="stat-value">{ticketStats.closed}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsWidget;