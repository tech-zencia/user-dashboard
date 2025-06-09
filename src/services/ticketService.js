import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";
import { getAuth } from "firebase/auth";

// Firebase config should be imported from firebase.js
// or added here if not available
const firebaseConfig = {
  apiKey: "AIzaSyDnmJi-PqqZMNWGwrrERRxc-QXaiFltg6U",
  authDomain: "zenciadashboard.firebaseapp.com",
  projectId: "zenciadashboard",
  storageBucket: "zenciadashboard.firebasestorage.app",
  messagingSenderId: "809632075756",
  appId: "1:809632075756:web:b6398f07d30c6333cefac9",
  measurementId: "G-1VP1RH6P78"
};

// Initialize Firebase if app isn't already initialized
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // Firebase already initialized, use existing app
  console.log("Firebase already initialized");
}

const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

// Create a new support ticket
export const createTicket = async (ticketData, attachments = []) => {
  try {
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Upload attachments if any
    const attachmentUrls = [];
    if (attachments.length > 0) {
      for (const file of attachments) {
        try {
          const attachmentRef = ref(storage, `ticket-attachments/${user.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(attachmentRef, file);
          const downloadUrl = await getDownloadURL(attachmentRef);
          
          attachmentUrls.push({
            name: file.name,
            url: downloadUrl,
            type: file.type,
            size: file.size
          });
        } catch (error) {
          console.error("Error uploading file:", error);
          // Continue with other files if one fails
        }
      }
    }

    // Create a timestamp manually instead of using serverTimestamp()
    // This avoids the issue with timestamps in arrays
    const now = new Date();
    const firestoreTimestamp = Timestamp.fromDate(now);
    
    // Prepare ticket data with user info and timestamps
    const ticketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newTicket = {
      ticketId,
      subject: ticketData.subject,
      description: ticketData.description,
      category: ticketData.category,
      priority: ticketData.priority,
      status: 'open',
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || user.email,
      createdAt: serverTimestamp(), // Safe to use outside arrays
      updatedAt: serverTimestamp(), // Safe to use outside arrays
      attachments: attachmentUrls,
      messages: [
        {
          id: `MSG-${Math.floor(1000 + Math.random() * 9000)}`,
          sender: user.displayName || user.email,
          content: ticketData.description,
          timestamp: firestoreTimestamp, // Use manual timestamp in arrays
          isStaff: false,
          attachments: attachmentUrls
        }
      ]
    };

    // Save ticket to Firestore
    const ticketsRef = collection(db, "tickets");
    const docRef = await addDoc(ticketsRef, newTicket);
    
    return {
      success: true,
      ticketId,
      docId: docRef.id
    };
  } catch (error) {
    console.error("Error creating ticket:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all tickets for the current user
export const getUserTickets = async (filters = {}) => {
  try {
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Build query
    const ticketsRef = collection(db, "tickets");
    let ticketQuery = query(
      ticketsRef,
      where("userId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );
    
    // Add status filter if specified
    if (filters.status && filters.status !== 'all') {
      ticketQuery = query(
        ticketsRef,
        where("userId", "==", user.uid),
        where("status", "==", filters.status),
        orderBy("updatedAt", "desc")
      );
    }
    
    // Execute query
    const querySnapshot = await getDocs(ticketQuery);
    const tickets = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Apply search filter if provided
      if (filters.search && filters.search.trim() !== '') {
        const searchTerm = filters.search.toLowerCase();
        if (
          !data.subject.toLowerCase().includes(searchTerm) &&
          !data.description.toLowerCase().includes(searchTerm) &&
          !data.ticketId.toLowerCase().includes(searchTerm)
        ) {
          return; // Skip this item if it doesn't match the search
        }
      }
      
      tickets.push({
        id: doc.id,
        ...data
      });
    });
    
    return {
      success: true,
      tickets
    };
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get details for a specific ticket
export const getTicketDetails = async (ticketId) => {
  try {
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Query to find the ticket by ticketId
    const ticketsRef = collection(db, "tickets");
    const ticketQuery = query(
      ticketsRef,
      where("ticketId", "==", ticketId),
      where("userId", "==", user.uid)
    );
    
    const querySnapshot = await getDocs(ticketQuery);
    
    if (querySnapshot.empty) {
      throw new Error('Ticket not found or access denied');
    }
    
    // Get the ticket document
    const ticketDoc = querySnapshot.docs[0];
    const ticketData = ticketDoc.data();
    
    return {
      success: true,
      ticket: {
        id: ticketDoc.id,
        ...ticketData
      }
    };
  } catch (error) {
    console.error("Error fetching ticket details:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Add a reply to an existing ticket
export const addTicketReply = async (ticketId, replyContent, attachments = []) => {
  try {
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // First get the ticket to verify access
    const ticketResult = await getTicketDetails(ticketId);
    
    if (!ticketResult.success) {
      throw new Error(ticketResult.error || 'Failed to access ticket');
    }
    
    const ticket = ticketResult.ticket;
    const docId = ticket.id;
    
    // Upload attachments if any
    const attachmentUrls = [];
    if (attachments.length > 0) {
      for (const file of attachments) {
        try {
          const attachmentRef = ref(storage, `ticket-attachments/${user.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(attachmentRef, file);
          const downloadUrl = await getDownloadURL(attachmentRef);
          
          attachmentUrls.push({
            name: file.name,
            url: downloadUrl,
            type: file.type,
            size: file.size
          });
        } catch (error) {
          console.error("Error uploading file:", error);
          // Continue with other files if one fails
        }
      }
    }

    // Create new message with manual timestamp
    const messageId = `MSG-${Math.floor(1000 + Math.random() * 9000)}`;
    const firestoreTimestamp = Timestamp.fromDate(new Date());
    
    const newMessage = {
      id: messageId,
      sender: user.displayName || user.email,
      content: replyContent,
      timestamp: firestoreTimestamp, // Use manual timestamp in arrays
      isStaff: false,
      attachments: attachmentUrls
    };

    // Update the ticket document
    const ticketRef = doc(db, "tickets", docId);
    await updateDoc(ticketRef, {
      updatedAt: serverTimestamp(), // Safe to use outside arrays
      status: 'open', // Reopens the ticket if it was closed
      messages: [...ticket.messages, newMessage]
    });
    
    return {
      success: true,
      messageId
    };
  } catch (error) {
    console.error("Error adding reply:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Close a ticket
export const closeTicket = async (ticketId) => {
  try {
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // First get the ticket to verify access
    const ticketResult = await getTicketDetails(ticketId);
    
    if (!ticketResult.success) {
      throw new Error(ticketResult.error || 'Failed to access ticket');
    }
    
    const docId = ticketResult.ticket.id;
    
    // Update the ticket status
    const ticketRef = doc(db, "tickets", docId);
    await updateDoc(ticketRef, {
      status: 'closed',
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true
    };
  } catch (error) {
    console.error("Error closing ticket:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Mark a ticket as in-progress (typically done by staff, but can be made available for users)
export const updateTicketStatus = async (ticketId, newStatus) => {
  try {
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate status
    const validStatuses = ['open', 'in-progress', 'waiting', 'closed'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Invalid status value');
    }

    // First get the ticket to verify access
    const ticketResult = await getTicketDetails(ticketId);
    
    if (!ticketResult.success) {
      throw new Error(ticketResult.error || 'Failed to access ticket');
    }
    
    const docId = ticketResult.ticket.id;
    
    // Update the ticket status
    const ticketRef = doc(db, "tickets", docId);
    await updateDoc(ticketRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true
    };
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return {
      success: false,
      error: error.message
    };
  }
};