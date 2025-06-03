import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import VerifyEmail from './components/VerifyEmail';
import Dashboard from './components/Dashboard/Dashboard';
import LicenseManager from './components/Dashboard/LicenseManager';
import Plans from './components/Dashboard/Plans';
import TicketSystem from './components/Dashboard/TicketSystem';
import Settings from './components/Dashboard/Settings';
import Store from './components/Dashboard/Store';
import TestForm from './components/Dashboard/TestForm';
import RoleSelection from './components/Onboarding/RoleSelection';
import PurposeSelection from './components/Onboarding/PurposeSelection';
import UserInfo from './components/Onboarding/UserInfo';
import LoadingOverlay from './components/common/LoadingOverlay';
import usePageTransition from './hooks/usePageTransition';
import { subscribeToAuthChanges, getCurrentUser, getIdToken } from './firebase';
import { syncOnboardingData, checkOnboardingStatus } from './userService';
import './index.css';

// Component for protected routes
const ProtectedRoute = ({ element, redirectPath = '/login' }) => {
  const isAuthenticated = localStorage.getItem('user') !== null;
  return isAuthenticated ? element : <Navigate to={redirectPath} replace />;
};

// Updated OnboardingCheck component
const OnboardingCheck = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  
  useEffect(() => {
    const checkUserOnboarding = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          setLoading(false);
          return;
        }
        
        const hasCompletedLocalOnboarding = localStorage.getItem('hasCompletedOnboarding') === 'true';
        
        if (hasCompletedLocalOnboarding) {
          setNeedsOnboarding(false);
          setLoading(false);
          return;
        }
        
        const hasRequiredFields = 
          localStorage.getItem('userRole') && 
          localStorage.getItem('userPurpose') && 
          localStorage.getItem('userName');
          
        if (hasRequiredFields) {
          localStorage.setItem('hasCompletedOnboarding', 'true');
          setNeedsOnboarding(false);
          setLoading(false);
          return;
        }
        
        try {
          const userData = JSON.parse(userStr);
          const status = await checkOnboardingStatus(userData.email);
          
          if (status && status.hasCompletedOnboarding) {
            localStorage.setItem('hasCompletedOnboarding', 'true');
            setNeedsOnboarding(false);
          } else {
            setNeedsOnboarding(true);
          }
        } catch (apiError) {
          console.warn("API error in OnboardingCheck, falling back to local check:", apiError);
          const partialData = localStorage.getItem('userRole') || localStorage.getItem('userPurpose');
          setNeedsOnboarding(!partialData);
        }
      } catch (error) {
        console.error("Error in OnboardingCheck:", error);
        setNeedsOnboarding(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkUserOnboarding();
  }, []);
  
  if (loading) {
    return <LoadingOverlay message="Checking your progress..." />;
  }
  
  if (needsOnboarding) {
    return <Navigate to="/onboarding/role" replace />;
  }
  
  return children;
};

// Create a separate component that uses the hook inside Router context
const AppRoutes = () => {
  const { isLoading } = usePageTransition(); // Now this is inside Router context
  
  return (
    <>
      <LoadingOverlay 
        isVisible={isLoading} 
        message="Loading page..." 
      />
      
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Onboarding routes */}
        <Route 
          path="/onboarding/role" 
          element={<ProtectedRoute element={<RoleSelection />} />} 
        />
        <Route 
          path="/onboarding/purpose" 
          element={<ProtectedRoute element={<PurposeSelection />} />} 
        />
        <Route 
          path="/onboarding/company" 
          element={<ProtectedRoute element={<UserInfo />} />} 
        />

        {/* Dashboard route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute 
              element={<OnboardingCheck><Dashboard /></OnboardingCheck>} 
            />
          } 
        />
        
        {/* Plans route */}
        <Route 
          path="/plans" 
          element={
            <ProtectedRoute 
              element={<OnboardingCheck><Plans /></OnboardingCheck>} 
            />
          } 
        />
        
        {/* License Manager route */}
        <Route 
          path="/license-manager" 
          element={
            <ProtectedRoute 
              element={<OnboardingCheck><LicenseManager /></OnboardingCheck>} 
            />
          } 
        />

        {/* Ticket System routes */}
        <Route 
          path="/tickets" 
          element={
            <ProtectedRoute 
              element={<OnboardingCheck><TicketSystem /></OnboardingCheck>} 
            />
          } 
        />
        <Route 
          path="/tickets/:ticketId" 
          element={
            <ProtectedRoute 
              element={<OnboardingCheck><TicketSystem /></OnboardingCheck>} 
            />
          } 
        />

        {/* Store route */}
        <Route 
          path="/store" 
          element={
            <ProtectedRoute 
              element={<OnboardingCheck><Store /></OnboardingCheck>} 
            />
          } 
        />
        
        {/* TestForm route */}
        <Route 
          path="/test-form" 
          element={
            <ProtectedRoute 
              element={<OnboardingCheck><TestForm /></OnboardingCheck>} 
            />
          } 
        />
        
        {/* Settings route */}
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute 
              element={<OnboardingCheck><Settings /></OnboardingCheck>} 
            />
          } 
        />

        {/* Add routes for other sidebar items */}
        <Route 
          path="/projects" 
          element={
            <ProtectedRoute 
              element={<OnboardingCheck><div className="placeholder-container"><h1>Projects Page</h1><p>This feature is coming soon.</p></div></OnboardingCheck>} 
            />
          } 
        />
        
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute 
              element={<OnboardingCheck><div className="placeholder-container"><h1>Analytics Page</h1><p>This feature is coming soon.</p></div></OnboardingCheck>} 
            />
          } 
        />
        
        <Route 
          path="/api" 
          element={
            <ProtectedRoute 
              element={<OnboardingCheck><div className="placeholder-container"><h1>API Documentation</h1><p>This feature is coming soon.</p></div></OnboardingCheck>} 
            />
          } 
        />
        
        <Route 
          path="/checkout" 
          element={
            <ProtectedRoute 
              element={<OnboardingCheck><div className="placeholder-container"><h1>Checkout</h1><p>Complete your subscription purchase.</p></div></OnboardingCheck>} 
            />
          } 
        />
        
        <Route 
          path="/contact" 
          element={
            <ProtectedRoute 
              element={<OnboardingCheck><div className="placeholder-container"><h1>Contact Sales</h1><p>Get in touch with our sales team for premium plans.</p></div></OnboardingCheck>} 
            />
          } 
        />

        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

// Placeholder components for future implementation
const Projects = () => <div className="placeholder-container"><h1>Projects Page</h1><p>This feature is coming soon.</p></div>;
const Analytics = () => <div className="placeholder-container"><h1>Analytics Page</h1><p>This feature is coming soon.</p></div>;
const API = () => <div className="placeholder-container"><h1>API Documentation</h1><p>This feature is coming soon.</p></div>;
const Contact = () => <div className="placeholder-container"><h1>Contact Sales</h1><p>Get in touch with our sales team for premium plans.</p></div>;
const Checkout = () => <div className="placeholder-container"><h1>Checkout</h1><p>Complete your subscription purchase.</p></div>;

function App() {
  const [initialized, setInitialized] = useState(false);

  // Function to store Firebase token for API calls
  const storeFirebaseToken = async (user) => {
    if (user) {
      try {
        const token = await getIdToken(user);
        localStorage.setItem('firebaseToken', token);
        
        setTimeout(() => {
          refreshToken(user);
        }, 55 * 60 * 1000);
      } catch (error) {
        console.error("Error getting Firebase token:", error);
      }
    } else {
      localStorage.removeItem('firebaseToken');
    }
  };
  
  const refreshToken = async (user) => {
    if (user) {
      try {
        const token = await getIdToken(user, true);
        localStorage.setItem('firebaseToken', token);
        
        setTimeout(() => {
          refreshToken(user);
        }, 55 * 60 * 1000);
      } catch (error) {
        console.error("Error refreshing token:", error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      if (currentUser) {
        localStorage.setItem('user', JSON.stringify({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName
        }));
        
        storeFirebaseToken(currentUser);
        
        syncOnboardingData()
          .then(result => {
            if (!result.success) {
              console.log("Could not sync onboarding data from server. Using localStorage if available.");
            }
          })
          .catch(error => {
            console.error("Error syncing onboarding data:", error);
          });
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('firebaseToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userPurpose');
        localStorage.removeItem('userName');
        localStorage.removeItem('referralSource');
        localStorage.removeItem('hasCompletedOnboarding');
      }
      
      setInitialized(true);
    });

    const checkExistingUser = async () => {
      const user = getCurrentUser();
      if (user) {
        await storeFirebaseToken(user);
        
        try {
          const result = await syncOnboardingData();
          if (!result.success) {
            console.log("Could not sync onboarding data for existing user. Using localStorage if available.");
          }
        } catch (error) {
          console.error("Error syncing onboarding data for existing user:", error);
        }
      }
    };
    
    checkExistingUser();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (url, options = {}) => {
      if (url.startsWith('/api/') || url.includes('localhost')) {
        const token = localStorage.getItem('firebaseToken');
        
        if (token) {
          options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
          };
        }
      }
      
      return originalFetch(url, options);
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  useEffect(() => {
    if (!document.getElementById('placeholder-styles')) {
      const style = document.createElement('style');
      style.id = 'placeholder-styles';
      style.textContent = `
        .placeholder-container {
          max-width: 800px;
          margin: 100px auto;
          padding: 40px;
          text-align: center;
          background-color: #121212;
          border-radius: 12px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        .placeholder-container h1 {
          color: var(--primary-color, #e94a8c);
          margin-bottom: 20px;
        }
        .placeholder-container p {
          font-size: 18px;
          color: #a0aec0;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (!initialized) {
    return <LoadingOverlay message="Initializing application..." />;
  }

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;