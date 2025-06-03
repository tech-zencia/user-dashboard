// userService.js - Frontend code to work with user data and onboarding
import { auth } from './firebase';

// Base URL for API endpoints - Updated to use full URL
const API_BASE_URL = 'http://user-dashboard-env-1.eba-jcgmztt6.eu-north-1.elasticbeanstalk.com/api';

// Function to get user data including onboarding information
export const getUserData = async (email) => {
  try {
    // First check if we already have a token in localStorage
    let token = localStorage.getItem('firebaseToken');
    
    // If not, try to get from current user
    if (!token) {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      token = await user.getIdToken();
    }
    
    // Set a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    // Call the API to get user data - Updated with full URL
    const response = await fetch(`${API_BASE_URL}/user-data?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      mode: 'cors',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!response.ok || !contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('Non-JSON response received:', textResponse.substring(0, 200));
      throw new Error(`API error: ${response.status} - Server returned HTML instead of JSON`);
    }
    
    const data = await response.json();
    return { success: true, userData: data };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return { success: false, error: error.message };
  }
};

// Function to store user data including onboarding information
export const storeUserData = async (userData) => {
  try {
    // First check if we already have a token in localStorage
    let token = localStorage.getItem('firebaseToken');
    
    // If not, try to get from current user
    if (!token) {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      token = await user.getIdToken();
    }
    
    // Ensure email is included
    if (!userData.email) {
      const user = auth.currentUser;
      if (user && user.email) {
        userData.email = user.email;
      }
    }
    
    // Set a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    // Call the API to store user data - Updated with full URL
    const response = await fetch(`${API_BASE_URL}/user-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Access-Control-Allow-Origin': '*'
      },
      mode: 'cors',
      body: JSON.stringify(userData),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Always update localStorage regardless of API success
    Object.entries(userData).forEach(([key, value]) => {
      if (key !== 'email') {
        localStorage.setItem(key, value);
      }
    });
    
    // Set the completion flag if we have the important fields
    if (userData.hasCompletedOnboarding === true || 
        (userData.userName && (userData.userRole || userData.userPurpose))) {
      localStorage.setItem('hasCompletedOnboarding', 'true');
    }
    
    // Handle API response
    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        console.warn(`API error when storing user data: ${response.status} - ${errorData.error || 'Unknown error'}`);
      } else {
        const textResponse = await response.text();
        console.warn(`API error when storing user data: ${response.status} - Server returned HTML instead of JSON`);
        console.warn('Response preview:', textResponse.substring(0, 200));
      }
      return { 
        success: false, 
        error: `API error: ${response.status}`,
        localStorageUpdated: true
      };
    }
    
    // Check if response is JSON
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.warn('Server returned non-JSON response:', textResponse.substring(0, 200));
      return { 
        success: false, 
        error: 'Server returned non-JSON response',
        localStorageUpdated: true
      };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error storing user data:', error);
    
    // Even if API call fails, update localStorage
    if (userData) {
      Object.entries(userData).forEach(([key, value]) => {
        if (key !== 'email') {
          localStorage.setItem(key, value);
        }
      });
      
      // Set the completion flag if we have the important fields
      if (userData.hasCompletedOnboarding === true || 
          (userData.userName && (userData.userRole || userData.userPurpose))) {
        localStorage.setItem('hasCompletedOnboarding', 'true');
      }
    }
    
    return { 
      success: false, 
      error: error.message,
      localStorageUpdated: true
    };
  }
};

// Function to fetch onboarding data and update localStorage
export const syncOnboardingData = async () => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      // Try to get user from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        return { success: false, error: 'User not authenticated' };
      }
      
      const userData = JSON.parse(userStr);
      if (!userData || !userData.email) {
        return { success: false, error: 'User email not found' };
      }
      
      // Fetch user data from server with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const result = await getUserData(userData.email);
        clearTimeout(timeoutId);
        
        if (result.success && result.userData) {
          // Update localStorage with data from server
          const serverData = result.userData;
          
          // Store onboarding fields in localStorage
          if (serverData.userRole) localStorage.setItem('userRole', serverData.userRole);
          if (serverData.userPurpose) localStorage.setItem('userPurpose', serverData.userPurpose);
          if (serverData.userName) localStorage.setItem('userName', serverData.userName);
          if (serverData.referralSource) localStorage.setItem('referralSource', serverData.referralSource);
          
          // Set the completion flag if we have the important fields
          if (serverData.hasCompletedOnboarding === true || 
              (serverData.userName && (serverData.userRole || serverData.userPurpose))) {
            localStorage.setItem('hasCompletedOnboarding', 'true');
          }
          
          return { success: true, data: serverData };
        }
      } catch (timeoutError) {
        clearTimeout(timeoutId);
        console.warn('Timeout syncing onboarding data:', timeoutError);
        return { success: false, error: 'Timeout syncing data' };
      }
    }
    
    // If we have the current user, try with that
    const result = await getUserData(user.email);
    
    if (result.success && result.userData) {
      // Update localStorage with data from server
      const serverData = result.userData;
      
      // Store onboarding fields in localStorage
      if (serverData.userRole) localStorage.setItem('userRole', serverData.userRole);
      if (serverData.userPurpose) localStorage.setItem('userPurpose', serverData.userPurpose);
      if (serverData.userName) localStorage.setItem('userName', serverData.userName);
      if (serverData.referralSource) localStorage.setItem('referralSource', serverData.referralSource);
      
      // Set the completion flag if we have the important fields
      if (serverData.hasCompletedOnboarding === true || 
          (serverData.userName && (serverData.userRole || serverData.userPurpose))) {
        localStorage.setItem('hasCompletedOnboarding', 'true');
      }
      
      return { success: true, data: serverData };
    }
    
    return { success: false, error: 'User data not found or invalid' };
  } catch (error) {
    console.error('Error syncing onboarding data:', error);
    return { success: false, error: error.message };
  }
};

// Function to check if a user has completed onboarding
export const checkOnboardingStatus = async (email) => {
  try {
    // First check for the explicit completion flag
    if (localStorage.getItem('hasCompletedOnboarding') === 'true') {
      return {
        hasCompletedOnboarding: true,
        source: 'localStorage-flag'
      };
    }
    
    // Then check if we have all required data in localStorage
    const userRole = localStorage.getItem('userRole');
    const userPurpose = localStorage.getItem('userPurpose');
    const userName = localStorage.getItem('userName');
    
    // If we have all required data in localStorage, consider onboarding complete
    if (userRole && userPurpose && userName) {
      // Set the flag for future checks
      localStorage.setItem('hasCompletedOnboarding', 'true');
      
      return {
        hasCompletedOnboarding: true,
        source: 'localStorage-fields'
      };
    }
    
    // If not in localStorage, check from server with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const result = await getUserData(email);
      clearTimeout(timeoutId);
      
      if (result.success && result.userData) {
        const userData = result.userData;
        
        // Check if server has onboarding data
        const hasCompletedServerOnboarding = 
          userData.hasCompletedOnboarding === true || 
          Boolean(userData.userRole && userData.userPurpose && userData.userName);
        
        if (hasCompletedServerOnboarding) {
          // Update localStorage with server data
          if (userData.userRole) localStorage.setItem('userRole', userData.userRole);
          if (userData.userPurpose) localStorage.setItem('userPurpose', userData.userPurpose);
          if (userData.userName) localStorage.setItem('userName', userData.userName);
          if (userData.referralSource) localStorage.setItem('referralSource', userData.referralSource);
          
          // Set the flag for future checks
          localStorage.setItem('hasCompletedOnboarding', 'true');
        }
        
        return {
          hasCompletedOnboarding: hasCompletedServerOnboarding,
          source: 'server',
          userData: userData
        };
      }
    } catch (timeoutError) {
      clearTimeout(timeoutId);
      console.warn('Timeout checking onboarding status:', timeoutError);
      return {
        hasCompletedOnboarding: false,
        error: 'Timeout checking status'
      };
    }
    
    return {
      hasCompletedOnboarding: false,
      source: 'none'
    };
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return {
      hasCompletedOnboarding: false,
      error: error.message
    };
  }
};