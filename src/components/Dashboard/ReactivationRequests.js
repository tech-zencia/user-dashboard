import React, { useState, useEffect } from 'react';
import { getReactivationRequests, processReactivationRequest } from '../../firebaseDatabase';
import './LicenseManager.css';

const ReactivationRequests = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState({
    pending: [],
    approved: [],
    rejected: []
  });
  const [activeTab, setActiveTab] = useState('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadReactivationRequests();
  }, []);

  const loadReactivationRequests = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      const result = await getReactivationRequests();
      
      if (result.success) {
        // Format data for UI
        setRequests({
          pending: formatRequests(result.pending || []),
          approved: formatRequests(result.approved || []),
          rejected: formatRequests(result.rejected || [])
        });
      } else {
        setErrorMessage('Failed to load reactivation requests. Please try again.');
      }
    } catch (error) {
      console.error('Error loading reactivation requests:', error);
      setErrorMessage('Failed to load reactivation requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format the request data for the UI
  const formatRequests = (requests) => {
    return requests.map(request => ({
      id: request.id,
      email: request.email,
      timestamp: formatDate(request.createdAt),
      old_hwid: request.oldHardwareId,
      new_hwid: request.newHardwareId,
      reason: request.reason,
      status: request.status,
      new_license_id: request.newLicenseId || null
    }));
  };

  const handleApprove = async (requestId) => {
    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      // Get the request data to create a new license
      const requestData = requests.pending.find(req => req.id === requestId);
      if (!requestData) {
        setErrorMessage('Request not found.');
        setLoading(false);
        return;
      }
      
      // Create new license data based on the old one
      // In a real app, you'd also need to fetch the old license details to copy settings
      const newLicenseData = {
        hwid: requestData.new_hwid,
        email: requestData.email,
        // You would add more fields based on the old license
      };
      
      const result = await processReactivationRequest(requestId, 'approve', newLicenseData);
      
      if (result.success) {
        setSuccessMessage('Reactivation request approved successfully.');
        // Reload the list
        await loadReactivationRequests();
      } else {
        setErrorMessage('Failed to approve reactivation request. Please try again.');
      }
    } catch (error) {
      console.error('Error approving reactivation request:', error);
      setErrorMessage('Failed to approve reactivation request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      const result = await processReactivationRequest(requestId, 'reject');
      
      if (result.success) {
        setSuccessMessage('Reactivation request rejected.');
        // Reload the list
        await loadReactivationRequests();
      } else {
        setErrorMessage('Failed to reject reactivation request. Please try again.');
      }
    } catch (error) {
      console.error('Error rejecting reactivation request:', error);
      setErrorMessage('Failed to reject reactivation request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      // Handle Firestore timestamp type
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const renderRequestsTable = (requestsList) => {
    if (requestsList.length === 0) {
      return <div className="no-results">No reactivation requests found</div>;
    }

    return (
      <div className="licenses-table-container">
        <table className="licenses-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Email</th>
              <th>Date</th>
              <th>Old Hardware ID</th>
              <th>New Hardware ID</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requestsList.map(request => (
              <tr key={request.id}>
                <td className="license-id">{request.id}</td>
                <td>{request.email}</td>
                <td>{request.timestamp}</td>
                <td title={request.old_hwid}>
                  {request.old_hwid ? request.old_hwid.substring(0, 8) + '...' : 'N/A'}
                </td>
                <td title={request.new_hwid}>
                  {request.new_hwid ? request.new_hwid.substring(0, 8) + '...' : 'N/A'}
                </td>
                <td>{request.reason}</td>
                <td>
                  {activeTab === 'pending' && (
                    <div className="license-actions">
                      <button 
                        className="primary-button" 
                        onClick={() => handleApprove(request.id)}
                        style={{ backgroundColor: 'var(--success-color)', margin: '0 5px' }}
                      >
                        Approve
                      </button>
                      <button 
                        className="primary-button" 
                        onClick={() => handleReject(request.id)}
                        style={{ backgroundColor: 'var(--error-color)', margin: '0 5px' }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {activeTab === 'approved' && request.new_license_id && (
                    <span className="status-badge active">
                      New License: {request.new_license_id.substring(0, 8)}...
                    </span>
                  )}
                  {activeTab === 'rejected' && (
                    <span className="status-badge revoked">Rejected</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="licenses-list-section reactivation-section">
      <h2 className="section-title">License Reactivation Requests</h2>
      
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({requests.pending.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved ({requests.approved.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected ({requests.rejected.length})
        </button>
      </div>
      
      {loading ? (
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div className="tab-content">
          {activeTab === 'pending' && renderRequestsTable(requests.pending)}
          {activeTab === 'approved' && renderRequestsTable(requests.approved)}
          {activeTab === 'rejected' && renderRequestsTable(requests.rejected)}
        </div>
      )}
    </div>
  );
};

export default ReactivationRequests;