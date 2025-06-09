import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Store.css';
import Sidebar from './Sidebar';
import Header from './Header';
import LoadingOverlay from '../common/LoadingOverlay';

// Font Awesome imports
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilePdf, 
  faFileWord, 
  faImages, 
  faFileImage, 
  faQrcode, 
  faLock, 
  faBrain, 
  faClipboardList, 
  faFileContract, 
  faDesktop, 
  faShieldAlt 
} from '@fortawesome/free-solid-svg-icons';

library.add(
  faFilePdf, 
  faFileWord, 
  faImages, 
  faFileImage, 
  faQrcode, 
  faLock, 
  faBrain, 
  faClipboardList,
  faFileContract, 
  faDesktop, 
  faShieldAlt
);

const iconMap = {
  'file-pdf': faFilePdf,
  'file-word': faFileWord,
  'images': faImages,
  'file-image': faFileImage,
  'qrcode': faQrcode,
  'lock': faLock,
  'brain': faBrain,
  'clipboard-list': faClipboardList,
  'file-contract': faFileContract,
  'desktop': faDesktop,
  'shield-alt': faShieldAlt
};

const Store = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const tools = [
    // PDF Tools
    {
      id: 'merge-pdf',
      name: 'Merge PDF',
      description: 'Combine multiple PDF files into a single document with customizable order',
      icon: 'file-pdf',
      comingSoon: false,
      iconColor: '#e94a8c'
    },
    {
      id: 'pdf-to-word',
      name: 'PDF to Word',
      description: 'Convert PDF documents to editable Word files with high accuracy',
      icon: 'file-word',
      comingSoon: false,
      iconColor: '#e94a8c'
    },
    {
      id: 'image-to-pdf',
      name: 'Image to PDF',
      description: 'Convert JPG, PNG, and other image formats to PDF documents',
      icon: 'images',
      comingSoon: false,
      iconColor: '#e94a8c'
    },
    {
      id: 'pdf-to-image',
      name: 'PDF to Image',
      description: 'Convert PDF pages to high-quality JPG, PNG or TIFF images',
      icon: 'file-image',
      comingSoon: false,
      iconColor: '#e94a8c'
    },
    
    // Utilities
    {
      id: 'qr-generator',
      name: 'QR Code Studio',
      description: 'Generate customizable QR codes for links, text, and contact information',
      icon: 'qrcode',
      comingSoon: false,
      iconColor: '#e94a8c'
    },
    {
      id: 'file-encryptor',
      name: 'File Shield',
      description: 'Encrypt your sensitive files with AES-256 encryption for protection',
      icon: 'lock',
      comingSoon: false,
      iconColor: '#e94a8c'
    },
    
    // Coming Soon Tools
    {
      id: 'memories-ai',
      name: 'Memories.AI',
      description: 'AI tool to smartly archive, manage, and recall personal memories',
      icon: 'brain',
      comingSoon: true,
      iconColor: '#8a4ddb'
    },
    {
      id: 'offline-mom',
      name: 'Meeting Minutes AI',
      description: 'Automatically generates accurate minutes of meetings in real time',
      icon: 'clipboard-list',
      comingSoon: true,
      iconColor: '#8a4ddb'
    },
    {
      id: 'tender-ai',
      name: 'Tender Document Assistant',
      description: 'Analyzes bidding documents and generates Terms & Conditions',
      icon: 'file-contract',
      comingSoon: true,
      iconColor: '#8a4ddb'
    },
    {
      id: 'presentation-ai',
      name: 'Slide Genius AI',
      description: 'Creates beautiful, professional presentations from your content',
      icon: 'desktop',
      comingSoon: true,
      iconColor: '#8a4ddb'
    }
  ];

  useEffect(() => {
    const currentUser = localStorage.getItem('user');
    
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(currentUser));
    setLoading(false);
  }, [navigate]);

  const handleTryNow = (toolId) => {
    console.log(`Launching tool: ${toolId}`);
  };

  if (loading) {
    return <LoadingOverlay message="Loading store..." />;
  }

  const availableTools = tools.filter(tool => !tool.comingSoon);
  const comingSoonTools = tools.filter(tool => tool.comingSoon);

  return (
    <div className="dashboard-layout">
      <Sidebar 
        userRole="admin"
        currentView="store"
      />
      
      <div className="dashboard-main">
        <Header user={user} companyName={localStorage.getItem('companyName') || ''} />
        
        <div className="dashboard-content">
          <div className="store-container">
            {/* Hero Section */}
            <div className="store-hero">
              <div className="hero-content">
                <h1 className="hero-title">Secure Offline Tools for Your Workflow</h1>
                <p className="hero-description">
                  Enhance your productivity with our suite of privacy-focused tools that work 
                  completely offline, ensuring your sensitive data never leaves your device.
                </p>
                <button className="hero-cta">
                  <FontAwesomeIcon icon={faShieldAlt} />
                  <span style={{ marginLeft: '8px' }}>Explore Secure Tools</span>
                </button>
              </div>
              <div className="hero-image">
                <img src="/api/placeholder/400/300" alt="Secure Tools" />
              </div>
            </div>
            
            {/* Available Tools Section */}
            <div className="tools-section">
              <div className="tools-grid">
                {availableTools.map(tool => (
                  <div key={tool.id} className="tool-card">
                    <div className="tool-icon-container">
                      <div className="tool-icon" style={{backgroundColor: tool.iconColor}}>
                        <FontAwesomeIcon icon={iconMap[tool.icon]} size="lg" />
                      </div>
                    </div>
                    <h3 className="tool-name">{tool.name}</h3>
                    <p className="tool-description">{tool.description}</p>
                    <button 
                      className="try-button"
                      onClick={() => handleTryNow(tool.id)}
                    >
                      Try Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Coming Soon Tools Section */}
            {comingSoonTools.length > 0 && (
              <div className="tools-section">
                <div className="section-header">
                  <h2 className="section-title">Coming Soon</h2>
                </div>
                <div className="tools-grid">
                  {comingSoonTools.map(tool => (
                    <div key={tool.id} className="tool-card coming-soon">
                      <div className="tool-icon-container">
                        <div className="tool-icon" style={{backgroundColor: tool.iconColor}}>
                          <FontAwesomeIcon icon={iconMap[tool.icon]} size="lg" />
                        </div>
                      </div>
                      <h3 className="tool-name">{tool.name}</h3>
                      <p className="tool-description">{tool.description}</p>
                      <button 
                        className="try-button"
                        disabled
                      >
                        Coming Soon
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Store;