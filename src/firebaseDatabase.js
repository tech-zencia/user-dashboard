import { auth, db } from './firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// Base URL for backend API
const API_BASE_URL = 'http://user-dashboard-env-1.eba-jcgmztt6.eu-north-1.elasticbeanstalk.com/api';
const LICENSE_API_BASE_URL = 'http://user-dashboard-env-1.eba-jcgmztt6.eu-north-1.elasticbeanstalk.com/api/admin';




// Helper function to retry Firestore operations
const retryOperation = async (operation, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) {
        console.error(`Operation failed after ${maxAttempts} attempts:`, { error: error.message, code: error.code });
        throw error;
      }
      console.warn(`Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Helper function to make authenticated API requests
const makeApiRequest = async (endpoint, method = 'GET', data = null) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated.' };
    }

    const token = await user.getIdToken();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const options = {
      method,
      headers
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Request failed.' };
    }

    return result;
  } catch (error) {
    console.error(`Error in API request to ${endpoint}:`, { error: error.message, code: error.code });
    return { success: false, error: error.message || 'Network error.' };
  }
};

// =============================================
// TICKET-RELATED FUNCTIONS WITH OFFLINE SUPPORT
// =============================================

// Create a ticket with automatic syncing
export const createTicket = async (ticketData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated.' };
    }

    // Generate a random ticket ID
    const ticketIdPrefix = "TICKET";
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ticketId = `${ticketIdPrefix}-${randomId}`;

    // Generate a document ID
    const docId = uuidv4();

    // Create ticket document
    const ticketRef = doc(db, 'tickets', docId);

    // Prepare the ticket data
    const ticketDoc = {
      id: docId,
      ticketId: ticketId,
      userId: user.uid,
      subject: ticketData.subject,
      description: ticketData.description,
      priority: ticketData.priority || 'medium',
      category: ticketData.category || 'general',
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.email,
      messages: [
        {
          id: uuidv4(),
          sender: user.email,
          content: ticketData.description,
          timestamp: serverTimestamp(),
          isStaff: false
        }
      ],
      pendingSync: true
    };

    // Set the document with retry logic
    await retryOperation(() => setDoc(ticketRef, ticketDoc, { merge: true }));

    // Return immediately with local data for better UX
    const clientTimestamp = new Date();
    return {
      success: true,
      ticketId: ticketId,
      id: docId,
      message: 'Ticket created successfully',
      createdAt: clientTimestamp,
      status: navigator.onLine ? 'Synced' : 'Pending sync'
    };
  } catch (error) {
    console.error('Error creating ticket:', { error: error.message, code: error.code, ticketData });
    return { success: false, error: error.message };
  }
};

// Get user tickets with realtime updates option
export const getUserTickets = async (filters = {}, realtime = false, callback = null) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated.' };
    }

    // Create a base query
    let ticketsQuery = query(
      collection(db, 'tickets'),
      where('userId', '==', user.uid)
    );

    // Apply status filter if provided
    if (filters.status && filters.status !== 'all') {
      ticketsQuery = query(
        ticketsQuery,
        where('status', '==', filters.status)
      );
    }

    // Apply sorting
    ticketsQuery = query(
      ticketsQuery,
      orderBy('createdAt', 'desc')
    );

    // If realtime updates are requested and callback is provided
    if (realtime && typeof callback === 'function') {
      const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
        const tickets = [];
        snapshot.forEach((doc) => {
          const data = doc.data();

          // Apply search filter if provided
          if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            if (!data.subject?.toLowerCase().includes(searchTerm) &&
              !data.description?.toLowerCase().includes(searchTerm)) {
              return;
            }
          }

          tickets.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt || new Date(),
            updatedAt: data.updatedAt || new Date()
          });
        });

        callback({
          success: true,
          tickets: tickets,
          isOffline: !navigator.onLine
        });
      }, (error) => {
        console.error('Error in realtime tickets query:', { error: error.message, code: error.code });
        callback({
          success: false,
          error: error.message,
          isOffline: !navigator.onLine
        });
      });

      return unsubscribe;
    }

    // For non-realtime queries
    const querySnapshot = await getDocs(ticketsQuery);

    // Convert to list of tickets
    let tickets = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Apply search filter if provided
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        if (!data.subject?.toLowerCase().includes(searchTerm) &&
          !data.description?.toLowerCase().includes(searchTerm)) {
          return;
        }
      }
      tickets.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt || new Date(),
        updatedAt: data.updatedAt || new Date()
      });
    });

    return {
      success: true,
      tickets: tickets,
      isOffline: !navigator.onLine
    };
  } catch (error) {
    console.error('Error fetching tickets:', { error: error.message, code: error.code });
    return {
      success: false,
      error: error.message,
      isOffline: !navigator.onLine
    };
  }
};

// Get ticket details with optional realtime updates
export const getTicketDetails = async (ticketId, realtime = false, callback = null) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated.' };
    }

    const ticketRef = doc(db, 'tickets', ticketId);

    // If realtime updates are requested and callback is provided
    if (realtime && typeof callback === 'function') {
      const unsubscribe = onSnapshot(ticketRef, (doc) => {
        if (!doc.exists()) {
          callback({ success: false, error: 'Ticket not found' });
          return;
        }

        const ticketData = doc.data();

        // Check if ticket belongs to this user
        if (ticketData.userId !== user.uid) {
          callback({ success: false, error: 'Unauthorized access to ticket' });
          return;
        }

        callback({
          success: true,
          ticket: {
            id: doc.id,
            ...ticketData,
            createdAt: ticketData.createdAt || new Date(),
            updatedAt: ticketData.updatedAt || new Date()
          },
          isOffline: !navigator.onLine
        });
      }, (error) => {
        console.error('Error in realtime ticket details:', { error: error.message, code: error.code });
        callback({
          success: false,
          error: error.message,
          isOffline: !navigator.onLine
        });
      });

      return unsubscribe;
    }

    // For non-realtime queries
    const ticketDoc = await getDoc(ticketRef);

    if (!ticketDoc.exists()) {
      return { success: false, error: 'Ticket not found' };
    }

    const ticketData = ticketDoc.data();

    // Check if ticket belongs to this user
    if (ticketData.userId !== user.uid) {
      return { success: false, error: 'Unauthorized access to ticket' };
    }

    return {
      success: true,
      ticket: {
        id: ticketDoc.id,
        ...ticketData,
        createdAt: ticketData.createdAt || new Date(),
        updatedAt: ticketData.updatedAt || new Date()
      },
      isOffline: !navigator.onLine
    };
  } catch (error) {
    console.error('Error fetching ticket details:', { error: error.message, code: error.code });
    return {
      success: false,
      error: error.message,
      isOffline: !navigator.onLine
    };
  }
};

// Add reply with offline support
export const addTicketReply = async (ticketId, content) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated.' };
    }

    // Get the ticket document reference
    const ticketRef = doc(db, 'tickets', ticketId);

    // Create new message
    const newMessage = {
      id: uuidv4(),
      sender: user.email,
      content: content,
      timestamp: serverTimestamp(),
      isStaff: false,
      pendingSync: !navigator.onLine
    };

    // Update ticket with retry logic
    await retryOperation(() => updateDoc(ticketRef, {
      messages: arrayUnion(newMessage),
      updatedAt: serverTimestamp(),
      status: 'waiting',
      pendingSync: !navigator.onLine
    }));

    return {
      success: true,
      message: 'Reply added successfully',
      isOffline: !navigator.onLine
    };
  } catch (error) {
    console.error('Error adding reply:', { error: error.message, code: error.code, ticketId });

    // If we're offline, store the reply in local storage for later sync
    if (!navigator.onLine) {
      try {
        const pendingRepliesJSON = localStorage.getItem('pendingTicketReplies') || '{}';
        const pendingReplies = JSON.parse(pendingRepliesJSON);

        if (!pendingReplies[ticketId]) {
          pendingReplies[ticketId] = [];
        }

        const currentUser = auth.currentUser;
        pendingReplies[ticketId].push({
          content,
          timestamp: new Date().toISOString(),
          sender: currentUser ? currentUser.email : 'User',
          id: uuidv4()
        });

        localStorage.setItem('pendingTicketReplies', JSON.stringify(pendingReplies));

        return {
          success: true,
          message: 'Reply stored locally (offline mode)',
          isOffline: true,
          pendingSync: true
        };
      } catch (localError) {
        console.error('Error storing reply locally:', { error: localError.message });
      }
    }

    return {
      success: false,
      error: error.message,
      isOffline: !navigator.onLine
    };
  }
};

// Close ticket with offline support
export const closeTicket = async (ticketId) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated.' };
    }

    // Get the ticket document reference
    const ticketRef = doc(db, 'tickets', ticketId);

    // Update ticket with retry logic
    await retryOperation(() => updateDoc(ticketRef, {
      status: 'closed',
      updatedAt: serverTimestamp(),
      pendingSync: !navigator.onLine
    }));

    return {
      success: true,
      message: 'Ticket closed successfully',
      isOffline: !navigator.onLine
    };
  } catch (error) {
    console.error('Error closing ticket:', { error: error.message, code: error.code, ticketId });

    // If we're offline, mark the ticket as pending close in local storage
    if (!navigator.onLine) {
      try {
        const pendingActionsJSON = localStorage.getItem('pendingTicketActions') || '{}';
        const pendingActions = JSON.parse(pendingActionsJSON);

        pendingActions[ticketId] = {
          action: 'close',
          timestamp: new Date().toISOString()
        };

        localStorage.setItem('pendingTicketActions', JSON.stringify(pendingActions));

        return {
          success: true,
          message: 'Ticket marked for closing (offline mode)',
          isOffline: true,
          pendingSync: true
        };
      } catch (localError) {
        console.error('Error storing close action locally:', { error: localError.message });
      }
    }

    return {
      success: false,
      error: error.message,
      isOffline: !navigator.onLine
    };
  }
};

// Function to get ticket statistics for dashboard
export const getDashboardTicketStats = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated.' };
    }

    // Query all tickets for this user
    const ticketsQuery = query(
      collection(db, 'tickets'),
      where('userId', '==', user.uid)
    );

    const querySnapshot = await getDocs(ticketsQuery);

    // Initialize counters
    let total = 0;
    let open = 0;
    let inProgress = 0;
    let waiting = 0;
    let closed = 0;

    // Count tickets by status
    querySnapshot.forEach((doc) => {
      total++;
      const status = doc.data().status;

      if (status === 'open') {
        open++;
      } else if (status === 'in-progress') {
        inProgress++;
      } else if (status === 'waiting') {
        waiting++;
      } else if (status === 'closed') {
        closed++;
      }
    });

    return {
      success: true,
      stats: {
        total,
        open,
        in_progress: inProgress,
        waiting,
        closed
      },
      isOffline: !navigator.onLine
    };
  } catch (error) {
    console.error('Error getting ticket stats:', { error: error.message, code: error.code });
    return {
      success: false,
      error: error.message,
      isOffline: !navigator.onLine
    };
  }
};

// Function to sync offline data when coming back online
export const syncPendingTicketData = async () => {
  if (!navigator.onLine) {
    return { success: false, message: 'Still offline' };
  }

  try {
    // Get all pending replies
    const pendingRepliesJSON = localStorage.getItem('pendingTicketReplies');
    if (pendingRepliesJSON) {
      const pendingReplies = JSON.parse(pendingRepliesJSON);

      // Process each ticket's pending replies
      for (const ticketId in pendingReplies) {
        const replies = pendingReplies[ticketId];

        for (const reply of replies) {
          // Add the reply to Firestore with retry logic
          await retryOperation(() => addTicketReply(ticketId, reply.content));
        }
      }

      // Clear the pending replies
      localStorage.removeItem('pendingTicketReplies');
    }

    // Get all pending actions
    const pendingActionsJSON = localStorage.getItem('pendingTicketActions');
    if (pendingActionsJSON) {
      const pendingActions = JSON.parse(pendingActionsJSON);

      // Process each pending action
      for (const ticketId in pendingActions) {
        const action = pendingActions[ticketId];

        if (action.action === 'close') {
          // Close the ticket with retry logic
          await retryOperation(() => closeTicket(ticketId));
        }
      }

      // Clear the pending actions
      localStorage.removeItem('pendingTicketActions');
    }

    return { success: true, message: 'Pending data synced successfully' };
  } catch (error) {
    console.error('Error syncing pending ticket data:', { error: error.message, code: error.code });
    return { success: false, error: error.message };
  }
};

// Add an online/offline listener with debounce to sync data automatically
export const setupOnlineListener = () => {
  let syncTimeout;
  const debounceSync = () => {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      console.log('Back online, syncing pending ticket data...');
      await syncPendingTicketData();
    }, 1000);
  };

  window.addEventListener('online', debounceSync);

  // Return a cleanup function
  return () => {
    window.removeEventListener('online', debounceSync);
  };
};

// =============================================
// LICENSE-RELATED FUNCTIONS (API-BASED)
// =============================================

export const getLicenses = async (filters = {}) => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters.expiration && filters.expiration !== 'all') {
      params.append('expiration', filters.expiration);
    }
    if (filters.tier && filters.tier !== 'all') {
      params.append('tier', filters.tier);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    
    // Add current user's email as a parameter
    const currentUser = localStorage.getItem('user');
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      if (userData.email) {
        params.append('email', userData.email);
      }
    }

    // Make API request
    const response = await fetch(`${LICENSE_API_BASE_URL}/licenses?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to fetch licenses' };
    }

    return { success: true, licenses: data.licenses || [] };
  } catch (error) {
    console.error('Error fetching licenses:', error);
    return { success: false, error: error.message };
  }
};

export const createLicense = async (licenseData) => {
  try {
    console.log("License data being sent:", licenseData);
    
    const response = await fetch(`${LICENSE_API_BASE_URL}/generate-license`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hwid: licenseData.hwid,
        duration: licenseData.duration,
        tier: licenseData.tier,
        name: licenseData.name,
        email: licenseData.email,
        notes: licenseData.notes || '',
      }),
    });

    console.log("Response status:", response.status);
    const data = await response.json();
    console.log("Response data:", data);

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to generate license' };
    }

    return {
      success: true,
      licenseId: data.license_id,
      licenseKey: data.license_key,
      formattedKey: data.formatted_key,
      expirationDate: data.expiration_date
    };
  } catch (error) {
    console.error('Error generating license:', error);
    return { success: false, error: error.message };
  }
};

export const getLicenseById = async (licenseId) => {
  try {
    const response = await fetch(`${LICENSE_API_BASE_URL}/license/${licenseId}`);
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to fetch license details' };
    }

    return { success: true, license: data };
  } catch (error) {
    console.error('Error fetching license details:', error);
    return { success: false, error: error.message };
  }
};

export const getReactivationRequests = async () => {
  try {
    const response = await fetch(`${LICENSE_API_BASE_URL}/reactivations`);
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to fetch reactivation requests' };
    }

    return {
      success: true,
      pending: data.pending || [],
      approved: data.approved || [],
      rejected: data.rejected || []
    };
  } catch (error) {
    console.error('Error fetching reactivation requests:', error);
    return { success: false, error: error.message };
  }
};

export const revokeLicense = async (licenseId, reason) => {
  try {
    const response = await fetch(`${LICENSE_API_BASE_URL}/revoke-license`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: licenseId,
        reason: reason,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to revoke license' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error revoking license:', error);
    return { success: false, error: error.message };
  }
};

export const processReactivationRequest = async (requestId, action, newLicenseData = {}) => {
  try {
    const response = await fetch(`${LICENSE_API_BASE_URL}/process-reactivation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: requestId,
        action: action === 'approve' ? 'approve' : 'reject',
        // Add any additional data needed for approval
        ...newLicenseData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to process reactivation request' };
    }

    return { success: true, newLicenseId: data.license_id };
  } catch (error) {
    console.error('Error processing reactivation request:', error);
    return { success: false, error: error.message };
  }
};

// Get recent tickets for dashboard
export const getRecentTickets = async (limit = 5) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated.' };
    }

    // Query recent tickets
    const ticketsQuery = query(
      collection(db, 'tickets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );

    const querySnapshot = await getDocs(ticketsQuery);

    // Convert to list of tickets
    let tickets = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      tickets.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt || new Date(),
        updatedAt: data.updatedAt || new Date()
      });
    });

    return {
      success: true,
      tickets
    };
  } catch (error) {
    console.error('Error getting recent tickets:', { error: error.message, code: error.code });
    return { success: false, error: error.message };
  }
};