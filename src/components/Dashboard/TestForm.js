import React, { useState } from 'react';
import { db } from '../../firebase'; // Updated path to match component location
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getCurrentUser } from '../../firebase'; // Updated path to match component location
import './TestForm.css';

const TestForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Prepare data to save
      const dataToSave = {
        ...formData,
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save to Firestore - removed unused variable warning
      await addDoc(collection(db, 'testSubmissions'), dataToSave);
      
      setSubmitMessage('Submission saved successfully!');
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium'
      });
      
    } catch (error) {
      console.error('Error saving submission:', error);
      setSubmitMessage(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="test-form-container">
      <h2>Test Submission Form</h2>
      <form onSubmit={handleSubmit} className="test-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Enter submission title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            placeholder="Enter description"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="submit-button"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>

        {submitMessage && (
          <div className={`submit-message ${submitMessage.includes('Error') ? 'error' : 'success'}`}>
            {submitMessage}
          </div>
        )}
      </form>
    </div>
  );
};

export default TestForm;