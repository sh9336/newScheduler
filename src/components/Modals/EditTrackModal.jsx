'use client';

import { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import styles from '../../styles/Modals.module.css';
import Notification from '../Notification';

const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? '/api/proxy' // Use proxy in development
  : ''; 

export default function EditTrackModal({ show, onHide, assetId, onUpdate }) {
  const [formData, setFormData] = useState({
    Id: '',
    Name: '',
    AssetAction: '',
    DurationInSec: '',
    NewFileName: '',
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assetActions, setAssetActions] = useState([]);

  useEffect(() => {
    if (show && assetId) {
      const fetchAssetDetails = async () => {
        try {
          
            const response = await fetch(`${API_BASE_URL}/initWithTime`, {
            method: 'GET',
            credentials: 'include', // Send cookies
          });

          
          
          if (!response.ok) {
            throw new Error('Failed to fetch asset details');
          }
          
          const data = await response.json();
          
          // Set asset actions first
          if (data.scheduleActions) {
            const actions = Object.entries(data.scheduleActions).map(([key, action]) => ({
              Name: action.Name,
              OptionText: action.OptionText
            }));
            setAssetActions(actions);
          }
          
          // Then set form data if we have an asset
          const asset = (data.assets || []).find(a => a.Id === assetId);
          if (asset) {
            setFormData({
              Id: asset.Id,
              Name: asset.Name || '',
              AssetAction: asset.AssetAction || '',
              DurationInSec: asset.DurationInSec || '',
              NewFileName: asset.Name || '',
            });
          }
        } catch (error) {
          console.error('Error fetching asset details:', error);
          Notification({ message: 'Error loading asset details', type: 'danger' });
        }
      };

      fetchAssetDetails();
    }
  }, [show, assetId]);

  const isValidFileName = (fileName) => {
    if (!fileName || typeof fileName !== 'string') return { isValid: false, reason: 'File name is required.' };
    if (fileName.includes(' ')) {
      return {
        isValid: false,
        reason: 'File name contains spaces. Use underscores (_) or dashes (-) instead.'
      };
    }
    const specialCharsRegex = /[!@#$%^&*()+={}[\]|\\/:;"'<>,.?]/;
    if (specialCharsRegex.test(fileName.split('.')[0])) {
      return {
        isValid: false,
        reason: 'File name contains special characters. Only underscores (_) and dashes (-) are allowed.'
      };
    }
    const ALLOWED_EXTENSIONS = ['.mp3', '.mp4'];
    const extension = '.' + fileName.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        reason: `Invalid file extension. Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed.`
      };
    }
    return { isValid: true };
  };

  const validateFormData = (data) => {
    // Required fields validation
    const requiredFields = {
      Id: 'Invalid track ID.',
      Name: 'Track name is required.',
      AssetAction: 'Asset action is required.',
      NewFileName: 'New file name is required.'
    };

    for (const [field, message] of Object.entries(requiredFields)) {
      if (!data[field] || typeof data[field] !== 'string' || data[field].trim() === '') {
        throw new Error(message);
      }
    }

    // File name validation
    const nameValidation = isValidFileName(data.NewFileName);
    if (!nameValidation.isValid) {
      throw new Error(`Invalid file name: ${nameValidation.reason}`);
    }

    // Duration validation
    if (data.DurationInSec) {
      const duration = Number(data.DurationInSec);
      if (isNaN(duration)) {
        throw new Error('Duration must be a number.');
      }
      if (duration < 0) {
        throw new Error('Duration must be a positive number.');
      }
      if (duration > 86400) { // 24 hours in seconds
        throw new Error('Duration cannot exceed 24 hours.');
      }
    }

    // Asset action validation
    if (!assetActions.some(action => action.Name === data.AssetAction)) {
      throw new Error('Invalid asset action selected.');
    }

    return true;
  };

  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (isSubmitting) return;

    try {
      // Validate form data
      validateFormData(formData);
      
      setIsSubmitting(true);
      setLoading(true);
      
      // Create FormData object
      const submitData = new FormData();
      submitData.append('Id', formData.Id);
      submitData.append('Name', formData.Name);
      submitData.append('AssetAction', formData.AssetAction);
      submitData.append('DurationInSec', formData.DurationInSec);
      submitData.append('NewFileName', formData.NewFileName);

      const response = await fetch(`${API_BASE_URL}/updateAsset`, {
        method: 'POST',
        body: submitData,
        credentials: 'include', // Send cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update asset');
      }

      Notification({ message: 'Track updated successfully', type: 'success' });
      onUpdate(); // Refresh the assets list
      onHide(); // Close the modal
    } catch (error) {
      console.error('Error updating track:', error);
      Notification({ message: `Error updating track: ${error.message}`, type: 'danger' });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Track Details</Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.modalContent}>
        <div className="mb-3">
          <label className="form-label">Track Name</label>
          <input
            type="text"
            className="form-control"
            value={formData.Name}
            onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
            disabled={loading}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Track Duration (seconds)</label>
          <input
            type="number"
            className="form-control"
            value={formData.DurationInSec}
            onChange={(e) => setFormData({ ...formData, DurationInSec: e.target.value })}
            disabled={loading}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Track Type</label>
          <select
            className="form-control"
            value={formData.AssetAction}
            onChange={(e) => setFormData({ ...formData, AssetAction: e.target.value })}
            disabled={loading}
          >
            <option value="">Select a type</option>
            {assetActions.map((action) => (
              <option key={action.Name} value={action.Name}>
                {action.OptionText}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">File Name</label>
          <input
            type="text"
            className="form-control"
            value={formData.NewFileName}
            onChange={(e) => setFormData({ ...formData, NewFileName: e.target.value })}
            disabled={loading}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading || isSubmitting}>
          Close
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading || isSubmitting}>
          {loading || isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Updating...
            </>
          ) : (
            'Update'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
