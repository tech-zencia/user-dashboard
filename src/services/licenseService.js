// licenseService.js - API service for license operations

/**
 * Fetches all licenses with optional filters
 * @param {Object} filters - Optional filters like status, tier, expiration
 * @returns {Promise<Array>} - Promise resolving to array of licenses
 */
export const fetchLicenses = async (filters = {}) => {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      
      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }
      
      if (filters.tier && filters.tier !== 'all') {
        queryParams.append('tier', filters.tier);
      }
      
      if (filters.expiration && filters.expiration !== 'all') {
        queryParams.append('expiration', filters.expiration);
      }
      
      if (filters.search) {
        queryParams.append('search', filters.search);
      }
      
      const url = `/api/admin/licenses${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch licenses');
      }
      
      const data = await response.json();
      return data.licenses || [];
    } catch (error) {
      console.error('Error fetching licenses:', error);
      throw error;
    }
  };
  
  /**
   * Generates a new license
   * @param {Object} licenseData - License data including hwid, name, email, etc.
   * @returns {Promise<Object>} - Promise resolving to the generated license
   */
  export const generateLicense = async (licenseData) => {
    try {
      const response = await fetch('/api/admin/generate-license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(licenseData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate license');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating license:', error);
      throw error;
    }
  };
  
  /**
   * Fetches details for a specific license
   * @param {string} licenseId - The ID of the license to fetch
   * @returns {Promise<Object>} - Promise resolving to license details
   */
  export const getLicenseDetails = async (licenseId) => {
    try {
      const response = await fetch(`/api/admin/license/${licenseId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch license details');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching license details:', error);
      throw error;
    }
  };
  
  /**
   * Revokes a license
   * @param {string} licenseId - The ID of the license to revoke
   * @param {string} reason - The reason for revocation
   * @returns {Promise<Object>} - Promise resolving to the result
   */
  export const revokeLicense = async (licenseId, reason) => {
    try {
      const response = await fetch('/api/admin/revoke-license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: licenseId,
          reason: reason
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to revoke license');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error revoking license:', error);
      throw error;
    }
  };
  
  /**
   * Fetches dashboard data summary
   * @returns {Promise<Object>} - Promise resolving to dashboard data
   */
  export const getDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch dashboard data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  };
  
  /**
   * Verifies a license key
   * @param {string} licenseKey - The license key to verify
   * @returns {Promise<Object>} - Promise resolving to verification result
   */
  export const verifyLicense = async (licenseKey) => {
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          license_key: licenseKey
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify license');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error verifying license:', error);
      throw error;
    }
  };
  
  /**
   * Fetches reactivation requests
   * @returns {Promise<Object>} - Promise resolving to reactivation requests
   */
  export const getReactivationRequests = async () => {
    try {
      const response = await fetch('/api/admin/reactivations');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch reactivation requests');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching reactivation requests:', error);
      throw error;
    }
  };
  
  /**
   * Processes a reactivation request
   * @param {string} requestId - The ID of the reactivation request
   * @param {string} action - The action to take ('approve' or 'reject')
   * @returns {Promise<Object>} - Promise resolving to the result
   */
  export const processReactivation = async (requestId, action) => {
    try {
      const response = await fetch('/api/admin/process-reactivation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: requestId,
          action: action
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process reactivation request');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error processing reactivation request:', error);
      throw error;
    }
  };
  
  /**
   * Requests license reactivation
   * @param {Object} reactivationData - Reactivation request data
   * @returns {Promise<Object>} - Promise resolving to the result
   */
  export const requestReactivation = async (reactivationData) => {
    try {
      const response = await fetch('/api/request-reactivation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reactivationData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit reactivation request');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error requesting reactivation:', error);
      throw error;
    }
  };
  
  /**
   * Gets system hardware information
   * @returns {Promise<Object>} - Promise resolving to system information
   */
  export const getSystemInfo = async () => {
    try {
      const response = await fetch('/api/system-info');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get system information');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting system information:', error);
      throw error;
    }
  };