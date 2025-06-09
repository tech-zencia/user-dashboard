import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Plans.css';
import Sidebar from './Sidebar';
import Header from './Header';
import ContactFormModal from './ContactFormModal';
import LoadingOverlay from '../common/LoadingOverlay';

const Plans = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
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
    
    setUser(JSON.parse(currentUser));
    setLoading(false);
  }, [navigate]);
  
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);

    if (plan === 'premium') {
      setIsContactModalOpen(true);
    } else if (plan === 'custom') {
      navigate('/license-manager', { state: { plan } });
    } else {
      navigate('/license-manager', { state: { plan } });
    }
  };

  const handleContactClick = () => {
    setSelectedPlan('general');
    setIsContactModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsContactModalOpen(false);
  };
  
  if (loading) {
    return <LoadingOverlay message="Loading plans..." />;
  }
  
  return (
    <div className="dashboard-layout">
      <Sidebar 
        userRole="admin"
        currentView="plans"
      />
      
      <div className="dashboard-main">
        <Header user={user} companyName="Zencia" />
        
        <div className="dashboard-content">
          <div className="plans-container">
            <div className="plans-header">
              <h1>Choose Your Plan</h1>
              <p>Select the plan that works best for your business needs</p>
            </div>
            
            <div className="plans-grid">
              {/* Trial Plan */}
              <div className="plan-card">
                <div className="plan-header">
                  <h2>Trial</h2>
                  <p>Limited time access to all features</p>
                </div>
                
                <div className="plan-pricing">
                  <div className="original-price">$0</div>
                  <div className="current-price">$0</div>
                  <div className="pricing-description">Perfect for testing the platform (15 days)</div>
                </div>
                
                <div className="plan-features">
                  <div className="feature-item">
                    <span className="feature-icon check"></span>
                    <span className="feature-text">Limited Time Access</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon check"></span>
                    <span className="feature-text">Full Feature Access</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon check"></span>
                    <span className="feature-text">All Personas Access</span>
                  </div>
                </div>
                
                <div className="plan-action">
                  <button 
                    className="plan-button"
                    onClick={() => handleSelectPlan('trial')}
                  >
                    Choose This Plan
                    <span className="arrow-icon"></span>
                  </button>
                </div>
              </div>
              
              {/* Custom Plan - Most Popular */}
              <div className="plan-card popular">
                <div className="popular-tag">
                  <span className="popular-icon">⚡</span>
                  Most Popular
                </div>
                
                <div className="plan-header">
                  <h2>Custom</h2>
                  <p>Access all features for 1 year</p>
                </div>
                
                <div className="plan-pricing">
                  <div className="original-price">$99</div>
                  <div className="current-price">$49.00</div>
                  <div className="pricing-description">Ideal for long-term use (365 days)</div>
                </div>
                
                <div className="plan-features">
                  <div className="feature-item">
                    <span className="feature-icon check"></span>
                    <span className="feature-text">365 Days Access</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon check"></span>
                    <span className="feature-text">Full Feature Access</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon check"></span>
                    <span className="feature-text">Tools access Upto One Year</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon check"></span>
                    <span className="feature-text">Personas for Business Workflows</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon check"></span>
                    <span className="feature-text">Ticket Support</span>
                  </div>
                </div>
                
                <div className="plan-action">
                  <button 
                    className="plan-button popular-button"
                    onClick={() => handleSelectPlan('custom')}
                  >
                    Choose This Plan
                    <span className="arrow-icon"></span>
                  </button>
                </div>
              </div>
              
              {/* Premium Plan */}
              <div className="plan-card">
                <div className="plan-header">
                  <h2>Premium</h2>
                  <p>Perfect for businesses with advanced needs</p>
                </div>
                
                <div className="plan-pricing">
                  <div className="contact-text">Get in touch</div>
                </div>
                
                <div className="plan-features">
                  <div className="feature-item">
                    <span className="feature-icon check"></span>
                    <span className="feature-text">Lifetime Access</span>
                 </div>
                 <div className="feature-item">
                   <span className="feature-icon check"></span>
                   <span className="feature-text">Priority Support</span>
                 </div>
                 <div className="feature-item">
                   <span className="feature-icon check"></span>
                   <span className="feature-text">White Label Solution</span>
                 </div>
                 <div className="feature-item">
                   <span className="feature-icon check"></span>
                   <span className="feature-text">Advanced Software Customization</span>
                 </div>
               </div>
               
               <div className="plan-action">
                 <button 
                   className="plan-button contact-button"
                   onClick={() => handleSelectPlan('premium')}
                 >
                   Contact Us
                   <span className="arrow-icon"></span>
                 </button>
               </div>
             </div>
           </div>
           
           <div className="plans-footer">
             <p>Have questions about our plans? <a href="#" onClick={handleContactClick}>Contact our sales team</a></p>
           </div>
         </div>
       </div>
     </div>
     
     {/* Contact Form Modal */}
     <ContactFormModal 
       isOpen={isContactModalOpen}
       onClose={handleCloseModal}
       planType={selectedPlan}
     />
   </div>
 );
};

export default Plans;