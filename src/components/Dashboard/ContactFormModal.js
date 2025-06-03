import React, { useState } from 'react';
import './ContactFormModal.css';

const ContactFormModal = ({ isOpen, onClose, planType }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
    requirements: '',
    planType: planType || 'premium' // Default to premium if not specified
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.company.trim()) newErrors.company = 'Company name is required';
    if (!formData.requirements.trim()) newErrors.requirements = 'Requirements are required';
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get any stored user data from localStorage
    const userRole = localStorage.getItem('userRole');
    const userPurpose = localStorage.getItem('userPurpose');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Validate form
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data for API
      const contactData = {
        ...formData,
        userRole,
        userPurpose,
        // Include user data if available
        ...user
      };
      
      // Make API call to send the form data using the full URL to the Flask backend
      const response = await fetch('http://localhost:5002/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify(contactData),
      });
      
      // Check if the response can be parsed as JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text);
        throw new Error('Received non-JSON response from server');
      }
      
      const responseData = await response.json();
      
      if (response.ok && responseData.success) {
        setSubmitSuccess(true);
        
        // Reset form after successful submission
        setTimeout(() => {
          onClose();
          setSubmitSuccess(false);
          setFormData({
            name: '',
            email: '',
            company: '',
            phone: '',
            message: '',
            requirements: '',
            planType: planType || 'premium'
          });
        }, 3000);
      } else {
        // Handle API error
        setErrors({ submit: responseData.error || 'Failed to submit contact request' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // More descriptive error message for debugging
      setErrors({ 
        submit: `An error occurred while submitting the form: ${error.message}. Please try again later or contact support.` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalTitle = () => {
    if (planType === 'premium') {
      return 'Contact Us for Premium Plan';
    } else if (planType === 'custom') {
      return 'Contact Us for Custom Plan';
    }
    return 'Contact Our Sales Team';
  };

  const getRequirementsPlaceholder = () => {
    switch (planType) {
      case 'premium':
        return "Tell us about your specific needs for the Premium plan...";
      case 'custom':
        return "Tell us about your customization requirements...";
      default:
        return "Tell us what you're looking for...";
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {submitSuccess ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Thank You!</h2>
            <p>Your message has been sent successfully. Our team will get back to you shortly.</p>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <h2>{getModalTitle()}</h2>
              <button className="close-button" onClick={onClose}>×</button>
            </div>
            <div className="modal-body">
              
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <div className="error-message">{errors.name}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Business Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <div className="error-message">{errors.email}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="company">Company Name *</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className={errors.company ? 'error' : ''}
                  />
                  {errors.company && <div className="error-message">{errors.company}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="requirements">Requirements *</label>
                  <textarea
                    id="requirements"
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    className={errors.requirements ? 'error' : ''}
                    placeholder={getRequirementsPlaceholder()}
                    rows="4"
                  ></textarea>
                  {errors.requirements && <div className="error-message">{errors.requirements}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Additional Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Any additional information you'd like to share..."
                    rows="3"
                  ></textarea>
                </div>
                
                {errors.submit && (
                  <div className="error-message submit-error">{errors.submit}</div>
                )}
                
                <div className="form-actions">
                  <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
                  <button type="submit" className="primary-button" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContactFormModal;