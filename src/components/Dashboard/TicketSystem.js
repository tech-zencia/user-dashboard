import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './TicketSystem.css';
import Sidebar from './Sidebar';
import Header from './Header';
import LoadingOverlay from '../common/LoadingOverlay';
import TicketApiService from '../../services/ticketApiService';

const TicketSystem = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [view, setView] = useState(ticketId ? 'detail' : 'list');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    search: ''
  });
  const [formData, setFormData] = useState({
    subject: '',
    category: 'technical',
    priority: 'medium',
    description: '',
    licenseId: '',
    attachments: []
  });
  const [replyData, setReplyData] = useState({
    content: '',
    attachments: []
  });

  // Network status listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load user info from localStorage
  useEffect(() => {
    const currentUser = localStorage.getItem('user');

    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(currentUser);

      if (!userData || !userData.email) {
        console.error("User data is missing required fields");
        navigate('/login');
        return;
      }

      setUser(userData);

      if (ticketId) {
        loadTicketDetails(ticketId);
      } else {
        loadTicketsList();
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate('/login');
    }
  }, [navigate, ticketId]);

  // Load tickets when filters change
  useEffect(() => {
    if (user && user.email && view === 'list') {
      const debounceTimer = setTimeout(() => {
        loadTicketsList();
      }, 500);

      return () => {
        clearTimeout(debounceTimer);
      };
    }
  }, [filters, user, view]);

  // Function to load tickets list
  const loadTicketsList = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      if (!user || !user.email) {
        setErrorMessage('User information not available. Please log in again.');
        setLoading(false);
        return;
      }

      const filterParams = {
        status: filters.status !== 'all' ? filters.status : null,
        category: filters.category !== 'all' ? filters.category : null,
        search: filters.search || null
      };

      const result = await TicketApiService.getTickets(
        user.email,
        filterParams
      );

      if (result.success) {
        setTickets(result.tickets);
      } else {
        setErrorMessage(result.error || 'Failed to load tickets. Please try again.');
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
      setErrorMessage('Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to load ticket details
  const loadTicketDetails = async (id) => {
    try {
      setLoading(true);
      setErrorMessage('');

      if (!user || !user.email) {
        setErrorMessage('User information not available. Please log in again.');
        setLoading(false);
        return;
      }

      const result = await TicketApiService.getTicketDetails(id, user.email);

      if (result.success) {
        setSelectedTicket(result.ticket);
        setView('detail');
      } else {
        setErrorMessage(result.error || 'Failed to load ticket details. Please try again.');
      }
    } catch (error) {
      console.error("Error loading ticket details:", error);
      setErrorMessage('Failed to load ticket details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle reply input changes
  const handleReplyChange = (e) => {
    const { name, value } = e.target;
    setReplyData(prev => ({
      ...prev,
      [name === 'message' ? 'content' : name]: value
    }));
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value
    }));
  };

  // File upload handler
  const handleFileUpload = async (e) => {
    if (!isOnline) {
      alert("File uploads are not available in offline mode.");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum file size is 5MB.");
      return;
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please upload a PDF, image, or document file.");
      return;
    }

    try {
      const mockAttachment = {
        filename: file.name,
        url: '#',
        size: file.size,
        mime_type: file.type,
        uploadStatus: 'complete'
      };

      if (view === 'new') {
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, mockAttachment]
        }));
      } else if (view === 'detail') {
        setReplyData(prev => ({
          ...prev,
          attachments: [...prev.attachments, mockAttachment]
        }));
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    }
  };

  // Remove attachment
  const removeAttachment = (index, isReply = false) => {
    if (isReply) {
      setReplyData(prev => ({
        ...prev,
        attachments: prev.attachments.filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        attachments: prev.attachments.filter((_, i) => i !== index)
      }));
    }
  };

  // Submit new ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    try {
      setLoading(true);

      const ticketData = {
        email: user?.email,
        customerName: user?.displayName || 'User',
        subject: formData.subject,
        message: formData.description,
        category: formData.category,
        priority: formData.priority,
        licenseId: formData.licenseId || '',
        attachments: formData.attachments
      };

      if (!isOnline) {
        // Store in local storage for later sync
        const pendingTickets = JSON.parse(localStorage.getItem('pendingTickets') || '[]');
        pendingTickets.push({
          ...ticketData,
          createdAt: new Date().toISOString(),
          pendingSync: true,
          id: `pending-${Date.now()}`
        });
        localStorage.setItem('pendingTickets', JSON.stringify(pendingTickets));

        setSuccessMessage('Ticket saved offline. It will be submitted when you reconnect.');
        setPendingSync(true);

        // Reset form
        setFormData({
          subject: '',
          description: '',
          category: 'technical',
          priority: 'medium',
          licenseId: '',
          attachments: []
        });

        // Navigate back to list
        setTimeout(() => {
          setView('list');
        }, 1500);
      } else {
        // Online submission
        const result = await TicketApiService.createTicket(ticketData);

        if (result.success) {
          setSuccessMessage(result.message || 'Ticket created successfully!');
          // Reset form
          setFormData({
            subject: '',
            description: '',
            category: 'technical',
            priority: 'medium',
            licenseId: '',
            attachments: []
          });

          // Navigate to ticket detail
          setTimeout(() => {
            navigate(`/tickets/${result.id}`);
          }, 1500);
        } else {
          setErrorMessage(result.error || 'Failed to create ticket');
        }
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      setErrorMessage('An error occurred while creating the ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit reply to ticket
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!replyData.content.trim()) {
      setErrorMessage('Please enter a message');
      return;
    }

    try {
      setLoading(true);

      if (!isOnline) {
        // Store reply in local storage for later sync
        const pendingReplies = JSON.parse(localStorage.getItem('pendingReplies') || '[]');
        pendingReplies.push({
          ticketId: selectedTicket.id,
          content: replyData.content,
          email: user?.email,
          customerName: user?.displayName || 'User',
          createdAt: new Date().toISOString(),
          pendingSync: true,
          attachments: replyData.attachments
        });
        localStorage.setItem('pendingReplies', JSON.stringify(pendingReplies));

        // Update UI to reflect the pending reply
        const updatedTicket = { ...selectedTicket };
        updatedTicket.messages = [
          ...updatedTicket.messages,
          {
            content: replyData.content,
            sender: user?.displayName || 'User',
            isStaff: false,
            timestamp: new Date().toISOString(),
            attachments: replyData.attachments,
            pendingSync: true
          }
        ];
        setSelectedTicket(updatedTicket);

        setSuccessMessage('Reply saved offline. It will be submitted when you reconnect.');
        setPendingSync(true);

        // Reset reply form
        setReplyData({
          content: '',
          attachments: []
        });
      } else {
        // Online submission
        const result = await TicketApiService.addReply(
          selectedTicket.id,
          replyData.content,
          user?.email,
          user?.displayName || 'User'
        );

        if (result.success) {
          // Reload the ticket to see the new message
          await loadTicketDetails(selectedTicket.id);

          // Reset reply form
          setReplyData({
            content: '',
            attachments: []
          });

          setSuccessMessage(result.message || 'Reply sent successfully!');
        } else {
          setErrorMessage(result.error || 'Failed to send reply');
        }
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      setErrorMessage('An error occurred while sending your reply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle closing ticket
  const handleCloseTicket = async () => {
    try {
      setLoading(true);

      if (!isOnline) {
        // Store in local storage for later sync
        const pendingActions = JSON.parse(localStorage.getItem('pendingActions') || '[]');
        pendingActions.push({
          type: 'closeTicket',
          ticketId: selectedTicket.id,
          email: user?.email,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('pendingActions', JSON.stringify(pendingActions));

        // Update UI to reflect the pending status change
        const updatedTicket = { ...selectedTicket, status: 'closed', pendingSync: true };
        setSelectedTicket(updatedTicket);

        setSuccessMessage('Ticket marked as closed offline. Status will update when you reconnect.');
        setPendingSync(true);
      } else {
        // Online submission
        const result = await TicketApiService.updateTicketStatus(
          selectedTicket.id,
          'closed',
          user?.email
        );

        if (result.success) {
          // Reload the ticket to see the status change
          await loadTicketDetails(selectedTicket.id);
          setSuccessMessage(result.message || 'Ticket closed successfully');
        } else {
          setErrorMessage(result.error || 'Failed to close ticket');
        }
      }
    } catch (error) {
      console.error("Error closing ticket:", error);
      setErrorMessage('An error occurred while closing the ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Change view to create new ticket
  const handleNewTicket = () => {
    setView('new');
    setSelectedTicket(null);
    setSuccessMessage('');
    setErrorMessage('');
  };

  // Go back to ticket list
  const handleBackToList = () => {
    setView('list');
    setSelectedTicket(null);
    navigate('/tickets');
  };

  // View a specific ticket
  const handleViewTicket = (ticketId) => {
    navigate(`/tickets/${ticketId}`);
  };

  // Get the proper status badge class
  const getStatusBadgeClass = (status) => {
    switch (String(status).toLowerCase()) {
      case 'open':
        return 'status-badge open';
      case 'in-progress':
        return 'status-badge in-progress';
      case 'waiting':
        return 'status-badge waiting';
      case 'closed':
        return 'status-badge closed';
      case 'pending':
        return 'status-badge pending';
      default:
        return 'status-badge';
    }
  };

  // Get the proper priority badge class
  const getPriorityBadgeClass = (priority) => {
    switch (String(priority).toLowerCase()) {
      case 'low':
        return 'priority-badge low';
      case 'medium':
        return 'priority-badge medium';
      case 'high':
        return 'priority-badge high';
      case 'critical':
        return 'priority-badge critical';
      default:
        return 'priority-badge';
    }
  };

  // Get the proper category badge class
  const getCategoryBadgeClass = (category) => {
    switch (String(category).toLowerCase()) {
      case 'technical':
        return 'category-badge technical';
      case 'billing':
        return 'category-badge billing';
      case 'feature-request':
        return 'category-badge feature-request';
      case 'general':
        return 'category-badge general';
      default:
        return 'category-badge';
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return 'Invalid Date';
    }
  };

  // Format date with time for display
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return 'Invalid Date';
    }
  };

  // Render ticket list
  const renderTicketList = () => {
    return (
      <div className="tickets-list-section">
        <div className="section-header">
          <h2 className="section-title">Your Support Tickets</h2>
          <div className="license-filters">
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search tickets..."
                value={filters.search}
                onChange={handleSearchChange}
              />
              <i className="search-icon"></i>
            </div>

            <div className="filter-container">
              <select
                className="filter-select"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="waiting">Waiting</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="filter-container">
              <select
                className="filter-select"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="all">All Categories</option>
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
                <option value="feature-request">Feature Request</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        <div className="form-actions" style={{ marginBottom: '20px' }}>
          <button className="primary-button" onClick={handleNewTicket}>
            <i className="create-ticket-icon"></i>
            Create New Ticket
          </button>
        </div>

        <div className="tickets-table-container">
          <table className="tickets-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length > 0 ? (
                tickets.map(ticket => (
                  <tr key={ticket.id || ticket.ticketId} className={ticket.pendingSync ? 'pending-sync-row' : ''}>
                    <td>{ticket.ticketId || ticket.id.substring(0, 8)}</td>
                    <td className="ticket-subject-cell">
                      {ticket.subject}
                      {ticket.pendingSync && <span className="pending-sync-indicator" title="Pending sync">⟳</span>}
                    </td>
                    <td>
                      <span className={getCategoryBadgeClass(ticket.category)}>
                        {ticket.category}
                      </span>
                    </td>
                    <td>
                      <span className={getPriorityBadgeClass(ticket.priority)}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(ticket.status)}>
                        {ticket.status}
                      </span>
                    </td>
                    <td>{formatDate(ticket.updatedAt || ticket.createdAt)}</td>
                    <td>
                      <div className="license-actions">
                        <button
                          className="action-button view-button"
                          title="View Details"
                          onClick={() => handleViewTicket(ticket.id)}
                        >
                          <i className="view-icon"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <div className="no-tickets">
                      <div className="no-tickets-icon"></div>
                      <h3>No tickets found</h3>
                      <p>Create a new support ticket to get help with any issues or questions.</p>
                      <button className="primary-button" onClick={handleNewTicket}>
                        <i className="create-ticket-icon"></i>
                        Create New Ticket
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render new ticket form
  const renderNewTicketForm = () => {
    return (
      <div className="new-ticket-form-container">
        <div className="section-header">
          <h2 className="section-title">Create New Support Ticket</h2>
          <button className="back-button" onClick={handleBackToList}>
            <i className="back-icon"></i>
            Back to Tickets
          </button>
        </div>

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        <form className="ticket-form" onSubmit={handleSubmitTicket}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="subject">
                Subject <span className="required">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="licenseId">License ID (Optional)</label>
              <input
                type="text"
                id="licenseId"
                name="licenseId"
                value={formData.licenseId}
                onChange={handleInputChange}
                placeholder="Enter your license ID if applicable"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">
                Category <span className="required">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="technical">Technical Issue</option>
                <option value="billing">Billing Question</option>
                <option value="feature-request">Feature Request</option>
                <option value="general">General Question</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="priority">
                Priority <span className="required">*</span>
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows="6"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="Please provide details about your issue or question"
            ></textarea>
          </div>

          <div className="form-group">
            <label>Attachments</label>
            <div className="attachment-input-container">
              <input
                type="file"
                className="attachment-input"
                id="attachment"
                onChange={handleFileUpload}
                disabled={!isOnline}
              />
              <label
                htmlFor="attachment"
                className={`attachment-button ${!isOnline ? 'disabled' : ''}`}
              >
                <i className="attachment-icon"></i>
                Add Attachment
              </label>
              <span className="attachment-info">
                Max size: 5MB. Allowed types: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, CSV, TXT
                {!isOnline && <span className="attachments-offline-note"> (Unavailable offline)</span>}
              </span>
            </div>

            {formData.attachments.length > 0 && (
              <div className="attachments-list">
                {formData.attachments.map((file, index) => (
                  <div className="attachment-item" key={`attachment-${index}`}>
                    <span className="attachment-name">{file.filename}</span>
                    <button
                      type="button"
                      className="remove-attachment-button"
                      onClick={() => removeAttachment(index)}
                    >
                      <i className="remove-icon"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={handleBackToList}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Render ticket detail
  const renderTicketDetail = () => {
    if (!selectedTicket) {
      return null; // Let the main loading overlay handle this
    }

    return (
      <div className="ticket-detail-container">
        <div className="section-header">
          <h2 className="section-title">Ticket Details</h2>
          <button className="back-button" onClick={handleBackToList}>
            <i className="back-icon"></i>
            Back to Tickets
          </button>
        </div>

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        <div className="ticket-info">
          <div className="ticket-subject">
            <h3>
              {selectedTicket.subject}
              {selectedTicket.pendingSync && <span className="pending-sync-tag">⟳ Pending sync</span>}
            </h3>
            <div className="ticket-badges">
              <span className={getCategoryBadgeClass(selectedTicket.category)}>
                {selectedTicket.category}
              </span>
              <span className={getPriorityBadgeClass(selectedTicket.priority)}>
                {selectedTicket.priority}
              </span>
              <span className={getStatusBadgeClass(selectedTicket.status)}>
                {selectedTicket.status}
              </span>
            </div>
          </div>
          <div className="ticket-meta">
            <div className="meta-item">
              <span className="meta-label">Ticket ID:</span>
              <span className="meta-value">{selectedTicket.ticketId || selectedTicket.id}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Created:</span>
              <span className="meta-value">
                {formatDateTime(selectedTicket.createdAt)}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Updated:</span>
              <span className="meta-value">
                {formatDateTime(selectedTicket.updatedAt || selectedTicket.createdAt)}
              </span>
            </div>
            {selectedTicket.licenseId && (
              <div className="meta-item">
                <span className="meta-label">License:</span>
                <span className="meta-value">{selectedTicket.licenseId}</span>
              </div>
            )}
          </div>
        </div>

        <div className="ticket-messages">
          {selectedTicket.messages?.map((message, index) => (
            <div
              key={message.id || `message-${index}`}
              className={`message ${message.isStaff ? 'staff-message' : 'user-message'} ${message.pendingSync ? 'pending-sync' : ''}`}
            >
              <div className="message-header">
                <div className="message-sender">
                  <div className={`sender-avatar ${message.isStaff ? 'staff' : 'user'}`}>
                    {message.isStaff ? (
                      <i className="staff-icon"></i>
                    ) : (
                      message.sender?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="sender-info">
                    <span className="sender-name">
                      {message.sender}
                      {message.pendingSync && (
                        <span className="pending-sync-tag" title="Pending sync"> (Waiting to sync)</span>
                      )}
                    </span>
                    <span className="sender-time">
                      {formatDateTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="message-content">
                {message.content ? (
                  message.content.split('\n').map((line, i) => (
                    <p key={`${message.id || index}-line-${i}`}>{line}</p>
                  ))
                ) : message.message ? (
                  message.message.split('\n').map((line, i) => (
                    <p key={`${message.id || index}-line-${i}`}>{line}</p>
                  ))
                ) : (
                  <p>No message content</p>
                )}
              </div>
              {message.attachments && message.attachments.length > 0 && (
                <div className="message-attachments">
                  <h4>Attachments:</h4>
                  <ul className="attachments-list">
                    {message.attachments.map((file, fileIndex) => (
                      <li key={`attachment-${index}-${fileIndex}`} className="attachment-item">
                        <span className="attachment-name">
                          {file.filename}
                          {file.pendingUpload && (
                            <span className="attachment-status"> (Uploading...)</span>
                          )}
                        </span>
                        {file.url && (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="primary-button"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          >
                            Download
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedTicket.status !== 'closed' && (
          <div className="ticket-reply-container">
            <h3>Add Reply</h3>
            <form className="reply-form" onSubmit={handleSubmitReply}>
              <div className="form-group">
                <textarea
                  id="replyMessage"
                  name="message"
                  rows="4"
                  value={replyData.content}
                  onChange={handleReplyChange}
                  placeholder="Type your reply here..."
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <div className="attachment-input-container">
                  <input
                    type="file"
                    className="attachment-input"
                    id="replyAttachment"
                    onChange={handleFileUpload}
                    disabled={!isOnline}
                  />
                  <label
                    htmlFor="replyAttachment"
                    className={`attachment-button ${!isOnline ? 'disabled' : ''}`}
                  >
                    <i className="attachment-icon"></i>
                    Add Attachment
                  </label>
                  <span className="attachment-info">
                    Max size: 5MB
                    {!isOnline && <span className="attachments-offline-note"> (Unavailable offline)</span>}
                  </span>
                </div>

                {replyData.attachments.length > 0 && (
                  <div className="attachments-list">
                    {replyData.attachments.map((file, index) => (
                      <div className="attachment-item" key={`reply-attachment-${index}`}>
                        <span className="attachment-name">{file.filename}</span>
                        <button
                          type="button"
                          className="remove-attachment-button"
                          onClick={() => removeAttachment(index, true)}
                        >
                          <i className="remove-icon"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading || !replyData.content.trim()}
                >
                  {loading ? 'Sending...' : 'Send Reply'}
                </button>

                {selectedTicket.status !== 'closed' && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleCloseTicket}
                    disabled={loading}
                  >
                    Close Ticket
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    );
  };

  // Offline notification banner
  const renderOfflineBanner = () => {
    if (!isOnline) {
      return (
        <div className="offline-banner">
          <i className="offline-icon"></i>
          <span>You are currently offline. Limited functionality is available, and changes will sync when you reconnect.</span>
        </div>
      );
    }
    if (isOnline && pendingSync) {
      return (
        <div className="pending-sync-banner">
          <i className="sync-icon"></i>
          <span>Syncing pending changes...</span>
        </div>
      );
    }
    return null;
  };

  // Show loading overlay for initial load or when loading ticket details
  if (loading && (tickets.length === 0 && view === 'list') || (view === 'detail' && !selectedTicket)) {
    return (
      <LoadingOverlay 
        isVisible={true} 
        message={view === 'detail' ? "Loading ticket details..." : "Loading tickets..."} 
      />
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        userRole={user?.role || 'user'}
        currentView="tickets"
      />

      <div className="dashboard-main">
        <Header user={user} companyName="Zencia" />

        {renderOfflineBanner()}

        <div className="dashboard-content">
          {/* Loading overlay for operations (not initial load) */}
          <LoadingOverlay 
            isVisible={loading && !((tickets.length === 0 && view === 'list') || (view === 'detail' && !selectedTicket))} 
            message="Processing ticket..." 
          />

          <div className="ticket-system-container">
            <div className="ticket-system-header">
              <h1>Support Tickets</h1>
            </div>

            {view === 'list' && renderTicketList()}
            {view === 'new' && renderNewTicketForm()}
            {view === 'detail' && renderTicketDetail()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketSystem;