import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './LicenseManager.css';
import Sidebar from './Sidebar';
import Header from './Header';
import LoadingOverlay from '../common/LoadingOverlay';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

import ReactivationRequests from './ReactivationRequests.js';
import {
  getLicenses,
  getLicenseById
} from '../../firebaseDatabase.js';

const LicenseManager = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState([]);
  const [formData, setFormData] = useState({
    hwid: '',
    duration: '15d',
    tier: 'basic',
    name: '',
    email: '',
    notes: ''
  });
  
  const [fieldsAutofilled, setFieldsAutofilled] = useState({
    name: false,
    email: false
  });
  
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedLicense, setGeneratedLicense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);

  const durations = [
    { value: '15d', label: '15 Days (Trial)' },
    { value: '1m', label: '1 Month (Coming Soon)' },
    { value: '3m', label: '3 Months (Coming Soon)' },
    { value: '6m', label: '6 Months (Coming Soon)' },
    { value: '1y', label: '1 Year (Coming Soon)' },
    { value: 'lifetime', label: 'Lifetime (Coming Soon)' }
  ];

  const tiers = [
    { value: 'basic', label: 'Basic' },
    { value: 'premium', label: 'Premium' },
    { value: 'professional', label: 'Professional' },
    { value: 'enterprise', label: 'Enterprise' }
  ];

  const loadLicenses = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const filters = {
        status: filterStatus !== 'all' ? filterStatus : null,
        search: searchTerm || null
      };

      console.log("Fetching licenses with filters:", filters);
      const result = await getLicenses(filters);
      console.log("License fetch result:", result);

      if (result.success) {
        const formattedLicenses = result.licenses.map(license => ({
          LicenseID: license.LicenseID,
          CustomerName: license.CustomerName,
          Email: license.Email,
          HardwareID: license.HardwareID,
          CreationDate: formatDateFromBackend(license.CreationDate),
          ExpirationDate: formatDateFromBackend(license.ExpirationDate),
          Tier: license.Tier,
          Status: license.Status,
          LicenseKey: license.LicenseKey,
          Notes: license.Notes,
          Features: license.Features ? license.Features.split(',') : []
        }));

        console.log("Formatted licenses:", formattedLicenses);
        setLicenses(formattedLicenses);
      } else {
        console.error("Failed to load licenses:", result.error);
        await loadLicensesDirectlyFromFirebase();
      }
    } catch (error) {
      console.error("Error loading licenses:", error);
      setErrorMessage('Failed to load licenses. Please try again.');
      await loadLicensesDirectlyFromFirebase();
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchTerm]);

  const loadLicensesDirectlyFromFirebase = async () => {
    try {
      console.log("Loading licenses directly from Firebase");
      
      const currentUser = localStorage.getItem('user');
      if (!currentUser) {
        console.error("No user found in localStorage");
        return;
      }
      
      const userData = JSON.parse(currentUser);
      if (!userData.email) {
        console.error("No email found for current user");
        return;
      }
      
      const safeEmail = userData.email.replace('@', '_at_').replace(/\./g, '_dot_');
      
      const licensesRef = collection(db, `users/${safeEmail}/licenses`);
      let licenseQuery = query(licensesRef);
      
      if (filterStatus !== 'all') {
        licenseQuery = query(licenseQuery, where('Status', '==', filterStatus));
      }
      
      const querySnapshot = await getDocs(licenseQuery);
      console.log("Firebase returned", querySnapshot.size, "license documents from user path");
      
      const loadedLicenses = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("License data from Firebase:", doc.id, data);
        
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const name = (data.CustomerName || '').toLowerCase();
          const email = (data.Email || '').toLowerCase();
          const licenseId = (data.LicenseID || doc.id).toLowerCase();
          
          if (!name.includes(term) && !email.includes(term) && !licenseId.includes(term)) {
            return;
          }
        }
        
        loadedLicenses.push({
          LicenseID: data.LicenseID || doc.id,
          CustomerName: data.CustomerName || 'N/A',
          Email: data.Email || 'N/A',
          HardwareID: data.HardwareID || 'N/A',
          CreationDate: formatDateFromBackend(data.CreationDate),
          ExpirationDate: formatDateFromBackend(data.ExpirationDate),
          Tier: data.Tier || 'basic',
          Status: data.Status || 'active',
          LicenseKey: data.LicenseKey || 'N/A',
          Notes: data.Notes || '',
          Features: data.Features ? (
            typeof data.Features === 'string' ? data.Features.split(',') : data.Features
          ) : []
       });
     });
     
     console.log("Loaded licenses from Firebase:", loadedLicenses);
     setLicenses(loadedLicenses);
     
   } catch (error) {
     console.error("Error loading licenses from Firebase:", error);
     setErrorMessage('Failed to load licenses from the database.');
   }
 };

 const forceRefreshLicenses = async () => {
   try {
     setLoading(true);
     await loadLicensesDirectlyFromFirebase();
     setSuccessMessage('Licenses refreshed from database');
     setTimeout(() => setSuccessMessage(''), 3000);
   } catch (error) {
     console.error("Error during force refresh:", error);
     setErrorMessage('Failed to refresh licenses');
   } finally {
     setLoading(false);
   }
 };

 useEffect(() => {
   const currentUser = localStorage.getItem('user');

   if (!currentUser) {
     navigate('/login');
     return;
   }

   const userData = JSON.parse(currentUser);
   setUser(userData);
   
   if (userData) {
     if (userData.displayName) {
       setFormData(prev => ({
         ...prev,
         name: userData.displayName
       }));
       setFieldsAutofilled(prev => ({
         ...prev,
         name: true
       }));
     }
     
     if (userData.email) {
       setFormData(prev => ({
         ...prev,
         email: userData.email
       }));
       setFieldsAutofilled(prev => ({
         ...prev,
         email: true
       }));
     }
   }

   loadLicenses();
 }, [navigate, loadLicenses]);

 useEffect(() => {
   const handler = setTimeout(() => {
     loadLicenses();
   }, 500);

   return () => {
     clearTimeout(handler);
   };
 }, [searchTerm, filterStatus, loadLicenses]);

 const formatDateFromTimestamp = (timestamp) => {
   if (!timestamp) return 'N/A';
   
   try {
     let date;
     if (timestamp.toDate) { 
       date = timestamp.toDate();
     } else if (timestamp instanceof Date) {
       date = timestamp;
     } else if (typeof timestamp === 'string') {
       date = new Date(timestamp);
     } else if (typeof timestamp === 'number') {
       date = new Date(timestamp);
     } else {
       return 'N/A';
     }
     
     if (isNaN(date.getTime())) {
       return 'N/A';
     }
     
     return date.toLocaleDateString('en-US', {
       year: 'numeric',
       month: 'short',
       day: 'numeric'
     });
   } catch (error) {
     console.error("Date formatting error:", error);
     return 'N/A';
   }
 };

 const formatDateFromBackend = (dateString) => {
   if (!dateString) return 'N/A';
   if (dateString === 'Lifetime') return 'Lifetime';

   try {
     const date = new Date(dateString);
     return date.toLocaleDateString('en-US', {
       year: 'numeric',
       month: 'short',
       day: 'numeric'
     });
   } catch (error) {
     console.error("Date formatting error:", error);
     return 'Invalid Date';
   }
 };

 const handleInputChange = (e) => {
   const { name, value } = e.target;
   
   if (name === 'duration' && value !== '15d') {
     setShowComingSoonModal(true);
     return;
   }
   
   setFormData(prev => ({
     ...prev,
     [name]: value
   }));
   
   if (name === 'name' || name === 'email') {
     setFieldsAutofilled(prev => ({
       ...prev,
       [name]: false
     }));
   }
 };

 const handleSearchChange = (e) => {
   setSearchTerm(e.target.value);
 };

 const handleFilterChange = (e) => {
   setFilterStatus(e.target.value);
 };

 const checkExisting15DayLicense = (hwid) => {
   const existingLicense = licenses.find(license => 
     license.HardwareID === hwid && 
     license.Status.toLowerCase() === 'active'
   );
   
   if (existingLicense) {
     return true;
   }
   
   return false;
 };

 const handleGenerateLicense = async (e) => {
   e.preventDefault();
   setSuccessMessage('');
   setErrorMessage('');
   setGeneratedLicense(null);

   if (!formData.hwid.trim()) {
     setErrorMessage('Hardware ID is required');
     return;
   }

   const hasExistingLicense = checkExisting15DayLicense(formData.hwid);
   if (hasExistingLicense) {
     setErrorMessage('This hardware ID already has an active license. Each device can only have one license.');
     return;
   }

   try {
     setLoading(true);
     console.log("Generating license with data:", formData);

     const response = await fetch('/api/admin/generate-license', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         hwid: formData.hwid,
         duration: formData.duration,
         tier: formData.tier,
         name: formData.name,
         email: formData.email,
         notes: formData.notes
       }),
     });

     const result = await response.json();
     console.log("License generation result:", result);

     if (!response.ok) {
       throw new Error(result.error || 'Failed to generate license');
     }

     const newLicense = {
       id: result.license_id,
       customerName: formData.name,
       email: formData.email,
       hwid: formData.hwid,
       licenseKey: result.license_key,
       formattedKey: result.formatted_key,
       creationDate: formatDateFromTimestamp(new Date()),
       expirationDate: result.expiration_date || 'Lifetime',
       tier: formData.tier,
       status: 'active',
       features: result.features || []
     };

     setGeneratedLicense(newLicense);
     setSuccessMessage('License generated successfully!');

     const formattedNewLicense = {
       LicenseID: newLicense.id,
       CustomerName: newLicense.customerName,
       Email: newLicense.email,
       HardwareID: newLicense.hwid,
       CreationDate: newLicense.creationDate,
       ExpirationDate: newLicense.expirationDate,
       Tier: newLicense.tier,
       Status: newLicense.status,
       LicenseKey: newLicense.licenseKey,
       Features: newLicense.features
     };

     setLicenses(prevLicenses => [formattedNewLicense, ...prevLicenses]);

     setTimeout(() => {
       forceRefreshLicenses();
     }, 1000);
   } catch (error) {
     console.error("Error generating license:", error);
     setErrorMessage(error.message || 'Failed to generate license. Please try again.');
   } finally {
     setLoading(false);
   }
 };

 const viewLicenseDetails = async (licenseId) => {
   try {
     setLoading(true);
     setErrorMessage('');
     console.log("Fetching license details for ID:", licenseId);

     const result = await getLicenseById(licenseId);
     console.log("License details result:", result);

     if (result.success && result.license) {
       const license = result.license;

       setSelectedLicense({
         LicenseID: license.id || license.LicenseID || 'N/A',
         CustomerName: license.name || license.CustomerName || 'N/A',
         Email: license.email || license.Email || 'N/A',
         HardwareID: license.hwid || license.HardwareID || 'N/A',
         CreationDate: license.createdAt ? formatDateFromTimestamp(license.createdAt) :
           (license.CreationDate || 'N/A'),
         ExpirationDate: license.expirationDate ? formatDateFromTimestamp(license.expirationDate) :
           (license.ExpirationDate || 'N/A'),
         Tier: license.tier || license.Tier || 'N/A',
         Status: license.status || license.Status || 'N/A',
         LicenseKey: license.licenseKey || license.LicenseKey || 'N/A',
         Features: license.features ? (Array.isArray(license.features) ?
           license.features.join(', ') : license.features) : 'N/A',
         Notes: license.notes || license.Notes || ''
       });

       setShowModal(true);
     } else {
       console.error("Failed to fetch license details:", result.error);
       setErrorMessage('Failed to fetch license details. Please try again.');
     }
   } catch (error) {
     console.error("Error fetching license details:", error);
     setErrorMessage('Failed to fetch license details. Please try again.');
   } finally {
     setLoading(false);
   }
 };

 const getStatusBadgeClass = (status) => {
   switch (String(status).toLowerCase()) {
     case 'active':
       return 'status-badge active';
     case 'expired':
       return 'status-badge expired';
     case 'revoked':
       return 'status-badge revoked';
     default:
       return 'status-badge';
   }
 };

 const getTierBadgeClass = (tier) => {
   switch (String(tier).toLowerCase()) {
     case 'basic':
       return 'tier-badge basic';
     case 'premium':
       return 'tier-badge premium';
     case 'professional':
       return 'tier-badge professional';
     case 'enterprise':
       return 'tier-badge enterprise';
     default:
       return 'tier-badge';
   }
 };

 const copyToClipboard = (text) => {
   navigator.clipboard.writeText(text)
     .then(() => {
       alert('License key copied to clipboard!');
     })
     .catch(err => {
       console.error('Failed to copy: ', err);
     });
 };

 const closeModal = () => {
   setShowModal(false);
   setSelectedLicense(null);
 };

 const resetForm = () => {
   const resetData = {
     hwid: '',
     duration: '15d',
     tier: 'basic',
     notes: '',
     name: fieldsAutofilled.name ? formData.name : '',
     email: fieldsAutofilled.email ? formData.email : ''
   };
   
   setFormData(resetData);
   setGeneratedLicense(null);
   setSuccessMessage('');
   setErrorMessage('');
 };

 if (loading && licenses.length === 0) {
   return <LoadingOverlay message="Loading license manager..." />;
 }

 return (
   <div className="dashboard-layout">
     <Sidebar
       userRole="admin"
       currentView="license-manager"
     />

     <div className="dashboard-main">
       <Header user={user} companyName="Zencia" />

       <div className="dashboard-content">
         <LoadingOverlay 
           isVisible={loading} 
           message="Processing license..." 
         />

         <div className="license-manager-container">
           <div className="license-generation-section">
             <h2 className="section-title">Generate License</h2>

             {successMessage && (
               <div className="success-message">
                 {successMessage}
               </div>
             )}

             {errorMessage && (
               <div className="error-message">
                 {errorMessage}
               </div>
             )}

             {generatedLicense ? (
               <div className="generated-license-box">
                 <h3>License Generated Successfully</h3>

                 <div className="license-details">
                   <div className="license-key-section">
                     <label>License Key:</label>
                     <div className="license-key-display">
                       <code>{generatedLicense.formattedKey}</code>
                       <button
                         className="copy-button"
                         onClick={() => copyToClipboard(generatedLicense.licenseKey)}
                         title="Copy to clipboard"
                       >
                         <i className="copy-icon"></i>
                       </button>
                     </div>
                   </div>

                   <div className="license-info-grid">
                     <div className="license-info-item" data-field="licenseId">
                       <label>License ID:</label>
                       <span>{generatedLicense.id}</span>
                     </div>
                     <div className="license-info-item">
                       <label>Customer:</label>
                       <span>{generatedLicense.customerName || 'N/A'}</span>
                     </div>
                     <div className="license-info-item">
                       <label>Email:</label>
                       <span>{generatedLicense.email || 'N/A'}</span>
                     </div>
                     <div className="license-info-item" data-field="hardwareId">
                       <label>Hardware ID:</label>
                       <span>{generatedLicense.hwid}</span>
                     </div>
                     <div className="license-info-item">
                       <label>Creation Date:</label>
                       <span>{generatedLicense.creationDate}</span>
                     </div>
                     <div className="license-info-item">
                       <label>Expiration:</label>
                       <span>{generatedLicense.expirationDate}</span>
                     </div>
                     <div className="license-info-item">
                       <label>Tier:</label>
                       <span className={getTierBadgeClass(generatedLicense.tier)}>
                         {generatedLicense.tier.charAt(0).toUpperCase() + generatedLicense.tier.slice(1)}
                       </span>
                     </div>
                     <div className="license-info-item">
                       <label>Features:</label>
                       <span>{Array.isArray(generatedLicense.features) && generatedLicense.features.length > 0 ?
                         generatedLicense.features.join(', ') : 'N/A'}</span>
                     </div>
                   </div>
                 </div>

                 <div className="license-actions">
                   <button 
                     className="primary-button"
                     onClick={forceRefreshLicenses}
                     style={{ marginRight: '10px' }}
                   >
                     Refresh Licenses
                   </button>
                   <button className="primary-button" onClick={resetForm}>
                     Generate Another License
                   </button>
                 </div>
               </div>
             ) : (
               <form className="license-form" onSubmit={handleGenerateLicense}>
                 <div className="form-row">
                   <div className={`form-group ${fieldsAutofilled.name ? 'auto-filled' : ''}`}>
                     <label htmlFor="name">Customer Name</label>
                     <input
                       type="text"
                       id="name"
                       name="name"
                       value={formData.name}
                       onChange={handleInputChange}
                       placeholder="Enter customer name"
                       required
                     />
                   </div>
                   
                   <div className={`form-group ${fieldsAutofilled.email ? 'auto-filled' : ''}`}>
                     <label htmlFor="email">Email Address</label>
                     <input
                       type="email"
                       id="email"
                       name="email"
                       value={formData.email}
                       onChange={handleInputChange}
                       placeholder="customer@example.com"
                       required
                     />
                   </div>
                 </div>
                 <div className="form-row">
                   <div className="form-group">
                     <label htmlFor="hwid">Hardware ID</label>
                     <input
                       type="text"
                       id="hwid"
                       name="hwid"
                       value={formData.hwid}
                       onChange={handleInputChange}
                       placeholder="Paste hardware ID from client application"
                       required
                     />
                   </div>
                   
                   <div className="form-group">
                     <label htmlFor="tier">License Tier</label>
                     <select
                       id="tier"
                       name="tier"
                       value={formData.tier}
                       onChange={handleInputChange}
                     >
                       {tiers.map(tier => (
                         <option key={tier.value} value={tier.value}>
                           {tier.label}
                         </option>
                       ))}
                     </select>
                   </div>
                 </div>

                 <div className="form-row">
                   <div className="form-group">
                     <label htmlFor="duration">License Duration</label>
                     <select
                       id="duration"
                       name="duration"
                       value={formData.duration}
                       onChange={handleInputChange}
                     >
                       <option value="15d">15 Days (Trial)</option>
                       <option value="1m" disabled>1 Month (Coming Soon)</option>
                       <option value="3m" disabled>3 Months (Coming Soon)</option>
                       <option value="6m" disabled>6 Months (Coming Soon)</option>
                       <option value="1y" disabled>1 Year (Coming Soon)</option>
                       <option value="lifetime" disabled>Lifetime (Coming Soon)</option>
                     </select>
                     {formData.duration === '15d' && (
                       <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                         Only 15-day trial licenses are currently available.
                       </small>
                     )}
                   </div>
                   <div className="form-group">
                     <label htmlFor="notes">Notes (Optional)</label>
                     <input
                       type="text"
                       id="notes"
                       name="notes"
                       value={formData.notes}
                       onChange={handleInputChange}
                       placeholder="Additional notes"
                     />
                   </div>
                 </div>

                 <div className="form-actions">
                   <button type="submit" className="primary-button">
                     Generate License
                   </button>
                 </div>
               </form>
             )}
           </div>

           <div className="licenses-list-section">
             <div className="section-header">
               <h2 className="section-title">Manage Licenses</h2>
               <div className="license-filters">
                 <div className="search-container">
                   <input
                     type="text"
                     className="search-input"
                     placeholder="Search licenses..."
                     value={searchTerm}
                     onChange={handleSearchChange}
                   />
                   <i className="search-icon"></i>
                 </div>

                 <div className="filter-container">
                   <select
                     className="filter-select"
                     value={filterStatus}
                     onChange={handleFilterChange}
                   >
                     <option value="all">All Statuses</option>
                     <option value="active">Active</option>
                     <option value="expired">Expired</option>
                     <option value="revoked">Revoked</option>
                   </select>
                 </div>
               </div>
             </div>

             <div style={{ marginBottom: '15px' }}>
               <button 
                 className="primary-button" 
                 onClick={forceRefreshLicenses}
                 style={{ padding: '8px 16px', fontSize: '0.9rem' }}
               >
                 Refresh Licenses
               </button>
               <span style={{ marginLeft: '10px', color: '#666', fontSize: '0.9rem' }}>
                 {licenses.length} license(s) found
               </span>
             </div>

             <div className="licenses-table-container">
               <table className="licenses-table">
                 <thead>
                   <tr>
                     <th>ID</th>
                     <th>Customer</th>
                     <th>Email</th>
                     <th>Expiration</th>
                     <th>Tier</th>
                     <th>Status</th>
                     <th>Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {licenses.length > 0 ? (
                     licenses.map(license => (
                       <tr key={license.LicenseID}>
                         <td className="license-id">{license.LicenseID}</td>
                         <td>{license.CustomerName}</td>
                         <td>{license.Email}</td>
                         <td>{license.ExpirationDate}</td>
                         <td>
                           <span className={getTierBadgeClass(license.Tier)}>
                             {String(license.Tier).charAt(0).toUpperCase() + String(license.Tier).slice(1)}
                           </span>
                         </td>
                         <td>
                           <span className={getStatusBadgeClass(license.Status)}>
                             {String(license.Status).charAt(0).toUpperCase() + String(license.Status).slice(1)}
                           </span>
                         </td>
                         <td>
                           <div className="license-actions">
                             <button
                               className="action-button view-button"
                               title="View Details"
                               onClick={() => viewLicenseDetails(license.LicenseID)}
                             >
                               <i className="view-icon"></i>
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr>
                       <td colSpan="7" className="no-results">No licenses found</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
           </div>

           <ReactivationRequests />
         </div>
       </div>
     </div>

     {/* License Details Modal */}
     {showModal && selectedLicense && (
       <div className="modal-backdrop" onClick={closeModal}>
         <div className="modal-content" onClick={e => e.stopPropagation()}>
           <div className="modal-header">
             <h3>License Details</h3>
             <button className="modal-close" onClick={closeModal}>×</button>
           </div>
           <div className="modal-body">
             <div className="license-info-grid">
               <div className="license-info-item" data-field="licenseId">
                 <label>License ID:</label>
                 <span>{selectedLicense.LicenseID || 'N/A'}</span>
               </div>
               <div className="license-info-item">
                 <label>Customer Name:</label>
                 <span>{selectedLicense.CustomerName || 'N/A'}</span>
               </div>
               <div className="license-info-item">
                 <label>Email:</label>
                 <span>{selectedLicense.Email || 'N/A'}</span>
               </div>
               <div className="license-info-item" data-field="hardwareId">
                <label>Hardware ID:</label>
                <span>{selectedLicense.HardwareID || 'N/A'}</span>
              </div>
              <div className="license-info-item">
                <label>Creation Date:</label>
                <span>{selectedLicense.CreationDate !== 'Invalid Date' ? selectedLicense.CreationDate : 'N/A'}</span>
              </div>
              <div className="license-info-item">
                <label>Expiration Date:</label>
                <span>{selectedLicense.ExpirationDate !== 'Invalid Date' ? selectedLicense.ExpirationDate : 'N/A'}</span>
              </div>
              <div className="license-info-item">
                <label>Tier:</label>
                <span className={selectedLicense.Tier ? getTierBadgeClass(selectedLicense.Tier) : ''}>
                  {selectedLicense.Tier ? (String(selectedLicense.Tier).charAt(0).toUpperCase() + String(selectedLicense.Tier).slice(1)) : 'N/A'}
                </span>
              </div>
              <div className="license-info-item">
                <label>Status:</label>
                <span className={selectedLicense.Status ? getStatusBadgeClass(selectedLicense.Status) : ''}>
                  {selectedLicense.Status ? (String(selectedLicense.Status).charAt(0).toUpperCase() + String(selectedLicense.Status).slice(1)) : 'N/A'}
                </span>
              </div>
              <div className="license-info-item">
                <label>Features:</label>
                <span>{selectedLicense.Features || 'N/A'}</span>
              </div>
              {selectedLicense.Notes && (
                <div className="license-info-item">
                  <label>Notes:</label>
                  <span>{selectedLicense.Notes}</span>
                </div>
              )}
            </div>

            {selectedLicense.Status && String(selectedLicense.Status).toLowerCase() === 'active' && selectedLicense.LicenseKey && (
              <div className="license-key-section" style={{ marginTop: '20px' }}>
                <label>License Key:</label>
                <div className="license-key-display">
                  <code>{selectedLicense.LicenseKey}</code>
                  <button
                    className="copy-button"
                    onClick={() => copyToClipboard(selectedLicense.LicenseKey)}
                    title="Copy to clipboard"
                  >
                    <i className="copy-icon"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="primary-button" onClick={closeModal}>Close</button>
          </div>
        </div>
      </div>
    )}

    {/* Coming Soon Modal */}
    {showComingSoonModal && (
      <div className="modal-backdrop" onClick={() => setShowComingSoonModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Coming Soon</h3>
            <button className="modal-close" onClick={() => setShowComingSoonModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <p>Extended license durations will be available soon when payment gateway integration is complete.</p>
            <p>Currently, only 15-day trial licenses are available.</p>
          </div>
          <div className="modal-footer">
            <button 
              className="primary-button" 
              onClick={() => {
                setShowComingSoonModal(false);
                setFormData(prev => ({
                  ...prev,
                  duration: '15d'
                }));
              }}
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default LicenseManager;