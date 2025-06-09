import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';
import Sidebar from './Sidebar';
import Header from './Header';
import FeaturedSection from './widgets/FeaturedSection';
import WelcomeWidget from './widgets/WelcomeWidget';
import StatsWidget from './widgets/StatsWidget';
import ActivityWidget from './widgets/ActivityWidget';
import ResourcesWidget from './widgets/ResourcesWidget';
import SetupFlow from './SetupFlow';
import LoadingOverlay from '../common/LoadingOverlay';
import './SetupFlow.css';
import { getLicenses } from '../../firebaseDatabase';
import TicketApiService from '../../services/ticketApiService';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [showFeatured, setShowFeatured] = useState(true);
  
  const [licenseStats, setLicenseStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    revoked: 0
  });
  
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  
  const [userPreferences, setUserPreferences] = useState({
    role: '',
    purpose: '',
    companyName: '',
    teamSize: '',
    industry: ''
  });

  useEffect(() => {
    const currentUser = localStorage.getItem('user');
    
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const userRole = localStorage.getItem('userRole');
    const userPurpose = localStorage.getItem('userPurpose');
    const companyName = localStorage.getItem('companyName');
    
    if (!userRole || !userPurpose || !companyName) {
      navigate('/onboarding/role');
      return;
    }
    
    const isSetupCompleted = localStorage.getItem('setupCompleted') === 'true';
    setSetupCompleted(isSetupCompleted);
    
    const showGuide = new URLSearchParams(location.search).get('showSetup');
    if (showGuide === 'true') {
      setShowSetupGuide(true);
      setShowFeatured(false);
    } else if (!isSetupCompleted) {
      setShowSetupGuide(true);
      setShowFeatured(false);
    }
    
    const hasDismissedFeatured = localStorage.getItem('dismissedFeatured') === 'true';
    if (hasDismissedFeatured) {
      setShowFeatured(false);
    }
    
    setUser(JSON.parse(currentUser));
    setUserPreferences({
      role: localStorage.getItem('userRole') || '',
      purpose: localStorage.getItem('userPurpose') || '',
      companyName: localStorage.getItem('companyName') || '',
      teamSize: localStorage.getItem('teamSize') || '',
      industry: localStorage.getItem('industry') || ''
    });
    
    fetchUserData(JSON.parse(currentUser).email);
  }, [navigate, location]);

  const fetchUserData = async (userEmail) => {
    try {
      const licenseResult = await getLicenses({});
      
      if (licenseResult.success) {
        const licenses = licenseResult.licenses || [];
        
        const licenseStatusCounts = licenses.reduce((counts, license) => {
          const status = (license.Status || '').toLowerCase();
          counts.total++;
          
          if (status === 'active') counts.active++;
          else if (status === 'expired') counts.expired++; 
          else if (status === 'revoked') counts.revoked++;
          
          return counts;
        }, { total: 0, active: 0, expired: 0, revoked: 0 });
        
        setLicenseStats(licenseStatusCounts);
      }
      
      const ticketResult = await TicketApiService.getTickets(userEmail, {});
      
      if (ticketResult.success) {
        const tickets = ticketResult.tickets || [];
        
        const ticketStatusCounts = tickets.reduce((counts, ticket) => {
          const status = (ticket.status || '').toLowerCase();
          counts.total++;
          
          if (status === 'open') counts.open++;
          else if (status === 'in-progress') counts.inProgress++;
          else if (status === 'closed') counts.closed++;
          
          return counts;
        }, { total: 0, open: 0, inProgress: 0, closed: 0 });
        
        setTicketStats(ticketStatusCounts);
      }
      
      const allActivities = [];
      
      if (licenseResult.success && licenseResult.licenses) {
        const licenseActivities = licenseResult.licenses
          .slice(0, 5)
          .map(license => ({
            id: `license-${license.LicenseID}`,
            type: 'license',
            title: license.CustomerName ? 
              `License for ${license.CustomerName}` : 
              'New License Generated',
            description: `A license key was generated for ${license.Tier || 'basic'} tier.`,
            timestamp: new Date(license.CreationDate || Date.now())
          }));
        
        allActivities.push(...licenseActivities);
      }
      
      if (ticketResult.success && ticketResult.tickets) {
        const ticketActivities = ticketResult.tickets
          .slice(0, 5)
          .map(ticket => ({
            id: `ticket-${ticket.id}`,
            type: 'ticket',
            title: `Ticket: ${ticket.subject || 'Support Request'}`,
            description: `Status: ${ticket.status || 'open'}. Category: ${ticket.category || 'general'}`,
            timestamp: new Date(ticket.updatedAt || ticket.createdAt || Date.now())
          }));
        
        allActivities.push(...ticketActivities);
      }
      
      if (allActivities.length < 4) {
        allActivities.push({
          id: 'store-1',
          type: 'store',
          title: 'New Tool Available',
          description: 'PDF to Word Converter tool is now available in the Tools Store.',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        });
      }
      
      const sortedActivities = allActivities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
      
      setRecentActivities(sortedActivities);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      
      setLicenseStats({
        total: 0,
        active: 0,
        expired: 0,
        revoked: 0
      });
      
      setTicketStats({
        total: 0,
        open: 0,
        inProgress: 0,
        closed: 0
      });
      
      setRecentActivities([{
        id: 'system-1',
        type: 'system',
        title: 'Welcome to Zencia',
        description: 'Thank you for joining Zencia. Explore our tools and features.',
        timestamp: new Date()
      }]);
      
      setLoading(false);
    }
  };

  const handleSetupComplete = () => {
    localStorage.setItem('setupCompleted', 'true');
    setSetupCompleted(true);
    setShowSetupGuide(false);
  };

  const handleShowSetupGuide = () => {
    setShowSetupGuide(true);
    setShowFeatured(false);
    navigate('/dashboard?showSetup=true', { replace: true });
  };

  const handleHideSetupGuide = () => {
    setShowSetupGuide(false);
    navigate('/dashboard', { replace: true });
  };

  const handleSidebarNavigation = (item) => {
    if (item === 'dashboard') {
      handleHideSetupGuide();
    } else if (item === 'get-started') {
      handleShowSetupGuide();
    }
  };

  const handleNavigate = (destination) => {
    navigate(destination);
  };
  
  const handleDismissFeatured = () => {
    setShowFeatured(false);
    localStorage.setItem('dismissedFeatured', 'true');
  };

  if (loading) {
    return <LoadingOverlay message="Loading your dashboard..." />;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar 
        userRole={userPreferences.role} 
        onShowSetupGuide={handleShowSetupGuide}
        onNavigate={handleSidebarNavigation}
        currentView={showSetupGuide ? 'get-started' : 'dashboard'}
      />
      
      <div className="dashboard-main">
        <Header user={user} companyName={userPreferences.companyName} />
        
        <div className="dashboard-content">
          {showSetupGuide ? (
            <div className="setup-guide-container">
              {setupCompleted && (
                <div className="setup-guide-header">
                  
                </div>
              )}
              
              <SetupFlow onComplete={handleSetupComplete} />
            </div>
          ) : (
            <>
              <WelcomeWidget 
                userName={user?.displayName || user?.email} 
                companyName={userPreferences.companyName}
                purpose={userPreferences.purpose}
              />
              
              {showFeatured && (
                <>
                  <div className="featured-section-header" style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '10px'}}>
                    <button 
                      onClick={handleDismissFeatured} 
                      style={{
                        background: 'none', 
                        border: 'none', 
                        color: '#6b7280', 
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                  <FeaturedSection onGetStarted={handleShowSetupGuide} />
                </>
              )}
              
              <div className="dashboard-grid">
                <StatsWidget 
                  role={userPreferences.role} 
                  purpose={userPreferences.purpose}
                  licenseStats={licenseStats}
                  ticketStats={ticketStats}
                  onNavigate={handleNavigate}
                />
                
                <ActivityWidget 
                  role={userPreferences.role}
                  activities={recentActivities}
                  onNavigate={handleNavigate}
                />
                
                <ResourcesWidget 
                  role={userPreferences.role}
                  purpose={userPreferences.purpose}
                  industry={userPreferences.industry}
                  onNavigate={handleNavigate}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;