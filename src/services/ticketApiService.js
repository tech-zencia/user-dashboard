// ticketApiService.js - API service for ticket-related operations (Online only)

// Use the full backend URL
const API_BASE_URL = 'http://user-dashboard-env-1.eba-jcgmztt6.eu-north-1.elasticbeanstalk.com/api';

/**
 * Helper function to make API requests with authentication
 */
const makeApiRequest = async (endpoint, method = 'GET', data = null) => {
  try {
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      // Add CORS headers
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    const options = {
      method,
      headers,
      // Add CORS mode
      mode: 'cors'
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    // Use full URL with API_BASE_URL
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log(`Making API request to: ${fullUrl}`);
    
    const response = await fetch(fullUrl, options);
    
    // Check if response is HTML (error page) instead of JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('Non-JSON response received:', textResponse.substring(0, 200));
      throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
    }
    
    if (!response.ok) {
      // Try to parse error message from response
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      } catch (jsonError) {
        throw new Error(`Request failed with status ${response.status}`);
      }
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`API error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Helper function to get the current user from localStorage
 */
const getCurrentUser = () => {
  const userString = localStorage.getItem('user');
  if (!userString) {
    return null;
  }
  
  try {
    return JSON.parse(userString);
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

/**
 * API service for ticket operations
 */
const TicketApiService = {
  /**
   * Create a new ticket
   */
  createTicket: async (ticketData) => {
    try {
      // Ensure user email is included
      const user = getCurrentUser();
      if (!user?.email && !ticketData.email) {
        throw new Error('User email is required');
      }
      
      // Use email from ticketData if provided, otherwise use from user object
      if (!ticketData.email && user?.email) {
        ticketData.email = user.email;
      }
      
      // Use displayName from user if not provided
      if (!ticketData.customerName && user?.displayName) {
        ticketData.customerName = user.displayName;
      }
      
      const data = await makeApiRequest('/tickets', 'POST', ticketData);
      return {
        success: true,
        id: data.ticketId,
        message: data.message || 'Ticket created successfully'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get tickets list with optional filters
   */
  getTickets: async (userEmail, filters = {}) => {
    try {
      // Ensure we have a user email
      if (!userEmail) {
        const user = getCurrentUser();
        if (!user?.email) {
          throw new Error('User email not found');
        }
        userEmail = user.email;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('email', userEmail);
      
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      
      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }
      
      if (filters.search) {
        params.append('search', filters.search);
      }

      const data = await makeApiRequest(`/tickets?${params.toString()}`);
      
      return { 
        success: true, 
        tickets: data.tickets || []
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get details of a specific ticket
   */
  getTicketDetails: async (id, userEmail) => {
    try {
      // If no userEmail is provided, try to get it from localStorage
      if (!userEmail) {
        const user = getCurrentUser();
        if (user?.email) {
          userEmail = user.email;
        }
      }

      // Make sure we have a user email - it's required by the API
      if (!userEmail) {
        throw new Error('User email is required to get ticket details');
      }

      // Add the email parameter to the URL
      const data = await makeApiRequest(`/tickets/${id}?email=${encodeURIComponent(userEmail)}`);
      
      return { 
        success: true, 
        ticket: data.ticket
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Add a reply to a ticket
   */
  addReply: async (id, content, userEmail, userName) => {
    try {
      // If no userEmail or userName is provided, try to get it from localStorage
      if (!userEmail || !userName) {
        const user = getCurrentUser();
        if (user) {
          userEmail = userEmail || user.email;
          userName = userName || user.displayName || 'User';
        }
      }
      
      // Fallback if we still don't have values
      userEmail = userEmail || 'anonymous@user.com';
      userName = userName || 'User';

      const messageData = {
        message: content,
        sender: userName,
        senderEmail: userEmail,
        isStaff: false
      };

      const data = await makeApiRequest(`/tickets/${id}/messages`, 'POST', messageData);
      
      return { 
        success: true, 
        messageId: data.messageId,
        message: data.message || 'Reply added successfully'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Update ticket status (e.g., close ticket)
   */
  updateTicketStatus: async (id, status, userEmail) => {
    try {
      // If no userEmail is provided, try to get it from localStorage
      if (!userEmail) {
        const user = getCurrentUser();
        if (user?.email) {
          userEmail = user.email;
        }
      }

      const data = await makeApiRequest(`/tickets/${id}/status`, 'PUT', {
        status: status,
        updatedBy: userEmail || 'User',
        email: userEmail  // Adding email parameter for API consistency
      });
      
      return { 
        success: true, 
        message: data.message || `Ticket status updated to ${status}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get ticket statistics for dashboard
   */
  getTicketStats: async (userEmail) => {
    try {
      // If no userEmail is provided, try to get it from localStorage
      if (!userEmail) {
        const user = getCurrentUser();
        if (!user?.email) {
          throw new Error('User email not found');
        }
        userEmail = user.email;
      }

      const data = await makeApiRequest(`/tickets/stats?email=${encodeURIComponent(userEmail)}`);
      return { 
        success: true, 
        stats: data.stats
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

export default TicketApiService;