import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingOverlay from '../common/LoadingOverlay';
import './SetupFlow.css';

const ZenciaEdgeSetupFlow = ({ onComplete }) => {
  // Use localStorage for authentication instead of context
  const [user, setUser] = useState(null);
  
  // Add navigate hook for redirection
  const navigate = useNavigate();
  
  // State for tracking if setup is completed
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track the current active step
  const [activeStep, setActiveStep] = useState(1);
  const [steps, setSteps] = useState({
    1: { completed: false, active: true },
    2: { completed: false, active: false },
    3: { completed: false, active: false },
    4: { completed: false, active: false }
  });
  
  // Add selectedOS state
  const [selectedOS, setSelectedOS] = useState('windows');
  
  // Add downloadTracked state
  const [downloadTracked, setDownloadTracked] = useState(false);
  
  // Add analytics state
  const [analytics, setAnalytics] = useState({
    downloadCount: 0,
    setupCompletedAt: null,
    hasActiveLicense: false,
    licenseInfo: null
  });

  // API Base URL
  const API_BASE_URL = 'http://user-dashboard-env-1.eba-jcgmztt6.eu-north-1.elasticbeanstalk.com/api';

  // This effect runs once on component mount to check initial setup status and load user data
  useEffect(() => {
    // Get user from localStorage (matching pattern from Dashboard.js)
    const currentUser = localStorage.getItem('user');
    
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    }
    
    const checkSetupStatus = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // If no user is logged in, we can't check setup status
        if (!currentUser) {
          console.warn('No authenticated user found');
          setIsLoading(false);
          return;
        }
        
        const userData = JSON.parse(currentUser);
        
        // First check server for setup status
        if (userData.email) {
          try {
            const response = await fetch(`${API_BASE_URL}/setup-status?email=${encodeURIComponent(userData.email)}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              mode: 'cors'
            });
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (response.ok && contentType && contentType.includes('application/json')) {
              const data = await response.json();
              if (data.setupCompleted) {
                setSetupCompleted(true);
                setAnalytics({
                  downloadCount: data.downloadCount || 0,
                  setupCompletedAt: data.setupCompletedAt || null,
                  setupOS: data.setupOS || selectedOS
                });
                
                // Also get license information if setup is completed
                try {
                  const licenseResponse = await fetch(`${API_BASE_URL}/user-downloads?email=${encodeURIComponent(userData.email)}`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                    },
                    mode: 'cors'
                  });
                  
                  const licenseContentType = licenseResponse.headers.get('content-type');
                  if (licenseResponse.ok && licenseContentType && licenseContentType.includes('application/json')) {
                    const licenseData = await licenseResponse.json();
                    setAnalytics(prev => ({
                      ...prev,
                      hasActiveLicense: licenseData.stats?.hasActiveLicense || false,
                      licenseInfo: licenseData.stats?.activeLicense || null
                    }));
                  }
                } catch (licenseError) {
                  console.warn('Error fetching license info:', licenseError);
                }
              } else {
                // If not completed on server, check localStorage as fallback
                const completionStatus = localStorage.getItem('zenciaEdgeSetupCompleted');
                if (completionStatus === 'true') {
                  setSetupCompleted(true);
                  // Get other data from localStorage
                  const downloadCount = parseInt(localStorage.getItem('zenciaEdgeDownloadCount') || '0');
                  const setupDate = localStorage.getItem('zenciaEdgeSetupCompletedAt');
                  setAnalytics({
                    downloadCount: downloadCount,
                    setupCompletedAt: setupDate || null,
                    setupOS: localStorage.getItem('zenciaEdgeSetupOS') || selectedOS
                  });
                }
              }
            } else {
              throw new Error('Server returned non-JSON response');
            }
          } catch (serverError) {
            console.warn('Server API not available, checking localStorage:', serverError);
            // If server request fails, check localStorage as fallback
            const completionStatus = localStorage.getItem('zenciaEdgeSetupCompleted');
            if (completionStatus === 'true') {
              setSetupCompleted(true);
              // Get other data from localStorage
              const downloadCount = parseInt(localStorage.getItem('zenciaEdgeDownloadCount') || '0');
              const setupDate = localStorage.getItem('zenciaEdgeSetupCompletedAt');
              setAnalytics({
                downloadCount: downloadCount,
                setupCompletedAt: setupDate || null,
                setupOS: localStorage.getItem('zenciaEdgeSetupOS') || selectedOS
              });
            }
          }
          
          // Check if the user has already tracked downloads
          try {
            const userDownloadResponse = await fetch(`${API_BASE_URL}/user-has-downloaded?email=${encodeURIComponent(userData.email)}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              mode: 'cors'
            });
            
            const downloadContentType = userDownloadResponse.headers.get('content-type');
            if (userDownloadResponse.ok && downloadContentType && downloadContentType.includes('application/json')) {
              const downloadData = await userDownloadResponse.json();
              if (downloadData.hasDownloaded) {
                setDownloadTracked(true);
                // If they've downloaded but not completed setup, mark first step as complete
                if (!setupCompleted) {
                  const updatedSteps = { ...steps };
                  updatedSteps[1].completed = true;
                  updatedSteps[2].active = true;
                  setSteps(updatedSteps);
                  setActiveStep(2);
                }
              }
            }
          } catch (downloadError) {
            console.warn('Error checking download status:', downloadError);
          }
        }
      } catch (err) {
        console.error('Error checking setup status:', err);
        // Don't show error to user, just use localStorage fallback
        const completionStatus = localStorage.getItem('zenciaEdgeSetupCompleted');
        if (completionStatus === 'true') {
          setSetupCompleted(true);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSetupStatus();
  }, []); // Empty dependency array to run once on mount

  // Load saved progress from localStorage
  useEffect(() => {
    if (setupCompleted || !user?.email) return; // Don't load progress if setup is completed or no user
    
    const savedProgress = localStorage.getItem(`zenciaEdgeSetupProgress_${user.email}`);
    if (savedProgress) {
      try {
        const parsedProgress = JSON.parse(savedProgress);
        setSteps(parsedProgress.steps);
        setActiveStep(parsedProgress.activeStep);
        if (parsedProgress.selectedOS) {
          setSelectedOS(parsedProgress.selectedOS);
        }
        if (parsedProgress.downloadTracked) {
          setDownloadTracked(parsedProgress.downloadTracked);
        }
      } catch (err) {
        console.error('Error parsing saved progress:', err);
      }
    }
  }, [setupCompleted, user]); 

  // Save progress to localStorage when changes occur
  useEffect(() => {
    if (setupCompleted || !user?.email) return; // Don't save progress if setup is completed or no user
    
    localStorage.setItem(`zenciaEdgeSetupProgress_${user.email}`, JSON.stringify({
      steps,
      activeStep,
      selectedOS,
      downloadTracked
    }));
  }, [steps, activeStep, selectedOS, downloadTracked, setupCompleted, user]);

  // Track download click with improved error handling and license integration
  const trackDownload = async () => {
    try {
      if (!user?.email) {
        console.error('No authenticated user found - cannot track download');
        // You might want to show a login prompt here
        alert('Please log in to download Zencia Edge');
        return;
      }
      
      // Start download (this would be your actual download logic)
      const downloadUrl = getDownloadUrl(selectedOS);
      window.open(downloadUrl, '_blank');
      
      // Track download with the server
      try {
        const response = await fetch(`${API_BASE_URL}/track-download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          mode: 'cors',
          body: JSON.stringify({
            os: selectedOS,
            timestamp: new Date().toISOString(),
            email: user.email,
            // Add version information
            version: "1.0.0" // or get this dynamically
          }),
        });
        
        const contentType = response.headers.get('content-type');
        if (!response.ok || !contentType || !contentType.includes('application/json')) {
          console.error('Failed to track download on server');
          // Continue with local tracking even if server tracking fails
        } else {
          // Get response data to check license status
          const data = await response.json();
          // Update analytics with license information if available
          if (data.hasActiveLicense) {
            setAnalytics(prev => ({
              ...prev,
              hasActiveLicense: true,
              licenseInfo: { id: data.licenseId }
            }));
          }
        }
      } catch (serverError) {
        console.warn('Server tracking failed, continuing with local tracking:', serverError);
      }
      
      // Set local download tracked state regardless of server response
      setDownloadTracked(true);
      // Store download count in localStorage as backup
      const currentCount = parseInt(localStorage.getItem('zenciaEdgeDownloadCount') || '0');
      localStorage.setItem('zenciaEdgeDownloadCount', (currentCount + 1).toString());
      
      // Mark step as completed
      completeStep(1);
    } catch (error) {
      console.error('Error tracking download:', error);
      // Even if tracking fails, we still want to proceed with the step
      // But we should show an error to the user
      alert('Download started, but we couldn\'t track it. You can continue with the setup.');
      completeStep(1);
    }
  };

  // Get the appropriate download URL based on OS
  const getDownloadUrl = (os) => {
    switch (os) {
      case 'mac':
        return '/downloads/ZenciaEdgeSetup-mac.dmg';
      case 'linux':
        return '/downloads/ZenciaEdgeSetup-linux.deb';
      case 'windows':
      default:
        return 'https://zencia-exe.s3.amazonaws.com/ZENCIA-2.0.5.zip';
    }
  };

  // Mark a step as completed and activate the next step
  const completeStep = (stepNumber) => {
    if (!steps[stepNumber].active) return;

    const updatedSteps = { ...steps };
    updatedSteps[stepNumber].completed = true;
    
    // Activate next step if it exists
    if (updatedSteps[stepNumber + 1]) {
      updatedSteps[stepNumber + 1].active = true;
      setActiveStep(stepNumber + 1);
    } else {
      // All steps completed - mark setup as completed
      markSetupCompleted();
      // Call the onComplete callback if provided
      onComplete && onComplete();
    }
    
    setSteps(updatedSteps);
  };

  // Mark the entire setup as completed
  const markSetupCompleted = async () => {
    if (!user?.email) {
      console.error('No authenticated user found - cannot mark setup as completed');
      return;
    }
    
    // Store completion in localStorage
    localStorage.setItem('setupCompleted', 'true'); // For Dashboard.js compatibility
    localStorage.setItem('zenciaEdgeSetupCompleted', 'true');
    localStorage.setItem('zenciaEdgeSetupCompletedAt', new Date().toISOString());
    localStorage.setItem('zenciaEdgeSetupOS', selectedOS);
    setSetupCompleted(true);
    
    // Store on server
    try {
      await fetch(`${API_BASE_URL}/setup-completed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        mode: 'cors',
        body: JSON.stringify({
          os: selectedOS,
          timestamp: new Date().toISOString(),
          email: user.email
        }),
      });
    } catch (error) {
      console.error('Error saving setup completion:', error);
    }
    
    // Update analytics
    setAnalytics(prev => ({
      ...prev,
      setupCompletedAt: new Date().toISOString(),
      setupOS: selectedOS
    }));
    
    // Get final license information
    try {
      const licenseResponse = await fetch(`${API_BASE_URL}/user-downloads?email=${encodeURIComponent(user.email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        mode: 'cors'
      });
      
      const contentType = licenseResponse.headers.get('content-type');
      if (licenseResponse.ok && contentType && contentType.includes('application/json')) {
        const licenseData = await licenseResponse.json();
        setAnalytics(prev => ({
          ...prev,
          hasActiveLicense: licenseData.stats?.hasActiveLicense || false,
          licenseInfo: licenseData.stats?.activeLicense || null,
          downloadCount: licenseData.stats?.downloadCount || prev.downloadCount
        }));
      }
    } catch (error) {
      console.error('Error getting final license information:', error);
    }
  };

  const resetProgress = async () => {
    if (!user?.email) {
      console.error('No authenticated user found - cannot reset progress');
      return;
    }
    
    // Clear localStorage
    localStorage.removeItem(`zenciaEdgeSetupProgress_${user.email}`);
    localStorage.removeItem('setupCompleted'); // For Dashboard.js compatibility
    localStorage.removeItem('zenciaEdgeSetupCompleted');
    localStorage.removeItem('zenciaEdgeSetupCompletedAt');
    localStorage.removeItem('zenciaEdgeSetupOS');
    
    // Reset state
    setSteps({
      1: { completed: false, active: true },
      2: { completed: false, active: false },
      3: { completed: false, active: false },
      4: { completed: false, active: false }
    });
    setActiveStep(1);
    setSelectedOS('windows');
    setDownloadTracked(false);
    setSetupCompleted(false);
    
    // Reset on server too
    try {
      await fetch(`${API_BASE_URL}/reset-setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        mode: 'cors',
        body: JSON.stringify({
          email: user.email
        }),
      });
    } catch (error) {
      console.error('Error resetting setup progress on server:', error);
    }
    
    console.log('Progress reset');
  };

  // Navigate to license page
  const redirectToLicensePage = () => {
    navigate('/license-manager');
  };

  // Handle OS selection change
  const handleOSChange = (e) => {
    setSelectedOS(e.target.value);
  };

  // System Requirements Component
  const SystemRequirements = ({ os }) => {
    if (os === 'windows') {
      return (
        <div className="system-requirements">
          <h4>System Requirements</h4>
          <div className="requirements-group">
            <h5>Minimum Requirements</h5>
            <ul>
              <li><span className="check-mark">✓</span> Windows 10 (64-bit)</li>
              <li><span className="check-mark">✓</span> RAM: 16GB</li>
              <li><span className="check-mark">✓</span> Storage: 512GB SSD</li>
              <li><span className="check-mark">✓</span> CPU: Intel i5 14th Gen / AMD Ryzen 5 7000 Series</li>
              <li><span className="check-mark">✓</span> GPU: RTX 3060 or greater</li>
            </ul>
          </div>
          <div className="requirements-group">
            <h5>Recommended Requirements</h5>
            <ul>
              <li><span className="check-mark">✓</span> RAM: 32GB DDR5</li>
              <li><span className="check-mark">✓</span> Storage: 1TB SSD</li>
              <li><span className="check-mark">✓</span> CPU: Intel i7 14th Gen / AMD Ryzen 7 7000 Series or greater</li>
              <li><span className="check-mark">✓</span> GPU: RTX 4070 or greater</li>
            </ul>
          </div>
        </div>
      );
    } else if (os === 'mac' || os === 'linux') {
      return (
        <div className="system-requirements coming-soon">
          <h4>System Requirements</h4>
          <p>Coming soon for {os === 'mac' ? 'macOS' : 'Linux'} users!</p>
        </div>
      );
    }
    
    return null;
  };

  // Show auth check message if user is not logged in
  if (!user) {
    return (
      <>
        <LoadingOverlay isVisible={false} />
        <div className="setup-flow-container">
          <div className="error-message">
            <h2>Authentication Required</h2>
            <p>You need to be logged in to access the Zencia Edge setup process.</p>
            <button 
              className="action-button" 
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </div>
        </div>
      </>
    );
  }

  // Show loading state with the LoadingOverlay
  if (isLoading) {
    return (
      <>
        <LoadingOverlay 
          isVisible={true} 
          message="Loading setup status..." 
        />
        <div className="setup-flow-container">
          {/* Content is hidden behind the overlay */}
        </div>
      </>
    );
  }

  // Show error message if there was an error
  if (error) {
    return (
      <>
        <LoadingOverlay isVisible={false} />
        <div className="setup-flow-container">
          <div className="error-message">
            <h2>Error</h2>
            <p>{error}</p>
            <button 
              className="action-button" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  // If setup is already completed, show a message with options
  if (setupCompleted) {
    return (
      <>
        <LoadingOverlay isVisible={false} />
        <div className="setup-flow-container">
          <div className="setup-completed-message">
            <h2>Setup Already Completed</h2>
            <p>You have already completed the Zencia Edge setup process.</p>
            
            {analytics.downloadCount > 0 && (
              <div className="download-status">
                <span className="download-status-icon">✓</span>
                <span className="download-status-text">
                  You've downloaded Zencia Edge {analytics.downloadCount} {analytics.downloadCount === 1 ? 'time' : 'times'}.
                  {analytics.setupCompletedAt && (
                    <> Setup was completed on {new Date(analytics.setupCompletedAt).toLocaleDateString()}.</>
                  )}
                </span>
              </div>
            )}
            
            {analytics.hasActiveLicense && (
              <div className="license-status success">
                <span className="license-status-icon success">✓</span>
                <span className="license-status-text">
                  You have an active license: {analytics.licenseInfo?.Tier || 'Standard'} tier.
                  {analytics.licenseInfo?.ExpirationDate && (
                    <> Valid until {analytics.licenseInfo.ExpirationDate}.</>
                  )}
                </span>
              </div>
            )}
            
            {!analytics.hasActiveLicense && (
              <div className="license-status warning">
                <span className="license-status-icon warning">!</span>
                <span className="license-status-text">
                  You don't have an active license. Please generate a license key.
                  </span>
                <button 
                  className="action-button"
                  onClick={redirectToLicensePage}
                >
                  Generate License Key
                </button>
              </div>
            )}
            
            <div className="buttons-container">
              <button 
                className="action-button"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </button>
              <button 
                className="action-button redirect-button"
                onClick={() => window.open(getDownloadUrl(selectedOS), '_blank')}
              >
                Download Again
              </button>
              <button 
                className="reset-button"
                onClick={resetProgress}
              >
                Restart Setup
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <LoadingOverlay isVisible={false} />
      <div className="setup-flow-container">
        <div className="setup-header">
          <h1>Set up Zencia Edge</h1>
          <div className="user-info">
            <span>Logged in as: {user.email || user.displayName}</span>
            <button className="reset-button" onClick={resetProgress}>Reset Progress</button>
          </div>
        </div>

        <div className="setup-steps">
          {/* Step 1: Download Zencia Edge */}
          <div className={`setup-step ${steps[1].completed ? 'completed' : ''} ${steps[1].active ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Download Zencia Edge</h3>
              <p>Download the latest version of Zencia Edge for your operating system</p>
              
              <div className="input-group">
                <label htmlFor="os-select">Select your operating system</label>
                <select 
                  id="os-select" 
                  disabled={!steps[1].active}
                  value={selectedOS}
                  onChange={handleOSChange}
                >
                  <option value="windows">Windows (64-bit)</option>
                  <option value="mac">macOS</option>
                  <option value="linux">Linux</option>
                </select>
              </div>
              
              {/* Display System Requirements based on OS selection */}
              {steps[1].active && <SystemRequirements os={selectedOS} />}
              
              {steps[1].active && !steps[1].completed && (
                <button 
                  className="action-button" 
                  onClick={trackDownload}
                >
                  Download Zencia Edge
                </button>
              )}
              
              {/* Show download info if downloaded but step not completed */}
              {downloadTracked && !steps[1].completed && (
                <div className="download-hint">
                  <p>Download started. Once installation is complete, click the button below to continue.</p>
                  <button 
                    className="action-button secondary" 
                    onClick={() => completeStep(1)}
                  >
                    I've downloaded Zencia Edge
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Step 2: Extract and Install */}
          <div className={`setup-step ${steps[2].completed ? 'completed' : ''} ${steps[2].active ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Extract and Install Zencia Edge</h3>
              <p>Follow these steps to extract and install Zencia Edge on your system</p>
              
              <div className="installation-steps">
                <div className="installation-step">
                  <div className="step-marker">1</div>
                  <div className="step-text">Extract the downloaded ZIP file</div>
                </div>
                <div className="installation-step">
                  <div className="step-marker">2</div>
                  <div className="step-text">Run the installer executable (ZenciaEdgeSetup.exe)</div>
                </div>
                <div className="installation-step">
                  <div className="step-marker">3</div>
                  <div className="step-text">Follow the on-screen instructions</div>
                </div>
                <div className="installation-step">
                  <div className="step-marker">4</div>
                  <div className="step-text">Choose your installation directory</div>
                </div>
                <div className="installation-step">
                  <div className="step-marker">5</div>
                  <div className="step-text">Wait for the installation to complete</div>
                </div>
              </div>
              
              {steps[2].active && !steps[2].completed && (
                <button 
                  className="action-button" 
                  onClick={() => completeStep(2)}
                >
                  I've installed Zencia Edge
                </button>
              )}
            </div>
          </div>
          
          {/* Step 3: Generate License Key */}
          <div className={`setup-step ${steps[3].completed ? 'completed' : ''} ${steps[3].active ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Generate License Key</h3>
              <p>Generate a license key to activate your Zencia Edge installation</p>
              
              <div className="license-info">
                <p>You'll need to visit our license portal to generate your unique license key.</p>
                
                {/* Show license status if we have that info */}
                {analytics.hasActiveLicense && (
                  <div className="license-status success">
                    <span className="license-status-icon success">✓</span>
                    <span className="license-status-text">
                      You already have an active license: {analytics.licenseInfo?.Tier || 'Standard'} tier.
                    </span>
                  </div>
                )}
              </div>
              
              {steps[3].active && !steps[3].completed && (
                <div className="buttons-container">
                  <button 
                    className="action-button redirect-button" 
                    onClick={redirectToLicensePage}
                  >
                    Generate License Key
                  </button>
                  <button 
                    className="action-button" 
                    onClick={() => completeStep(3)}
                  >
                    I've generated my license key
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Step 4: Activate and Use */}
          <div className={`setup-step ${steps[4].completed ? 'completed' : ''} ${steps[4].active ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Activate and Use Zencia Edge</h3>
              <p>You're all set! Launch Zencia Edge, enter your license key when prompted, and start enjoying all the features!</p>
              
              {steps[4].active && !steps[4].completed && (
                <button 
                  className="action-button final-button" 
                  onClick={() => completeStep(4)}
                >
                  Start Using Zencia Edge
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ZenciaEdgeSetupFlow;