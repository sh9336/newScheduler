'use client';

import { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import styles from '../../styles/ScheduleModals.module.css';

const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? '/api/proxy' // Use proxy in development
  : ''; 

const RestoreSchedulesModal = ({ show, onHide, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

       const response = await fetch(`${API_BASE_URL}/restoreSchedules`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Send cookies
      });

      

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to restore schedules');
      }

      const result = await response.json();
      
      // Clear the form
      setFile(null);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result.message || 'Schedules restored successfully');
      }
      
      // Close the modal
      onHide();
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error.message || 'Error restoring schedules');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="md" className="fade" backdrop="static">
      <Modal.Header closeButton className="bg-light border-bottom-0 px-3 py-2">
        <Modal.Title className="d-flex align-items-center fs-5">
          <i className="fas fa-upload text-primary me-2"></i>
          <span className="fw-semibold">Restore Schedules</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-3">
        <div className="alert alert-info py-2 px-3 mb-3">
          <h6 className="fw-bold mb-1 fs-6">Restore Information:</h6>
          <ul className="mb-0 ps-3 small">
            <li>Only CSV files exported from the backup are supported</li>
            <li>File name should be <b>SchedulesBackup.csv</b></li>
            <li>Restoring will overwrite your current schedules</li>
          </ul>
        </div>
        <div className="text-center my-4">
          <i className="fas fa-upload text-primary" style={{ fontSize: '2.5rem' }}></i>
          <h5 className="fw-semibold mt-3 mb-2">Restore Your Schedules Backup</h5>
          <p className="text-muted mb-0 small">
            Select your backup file below to restore schedules.
          </p>
        </div>
        <div className="d-flex justify-content-center mb-3">
          <input
            type="file"
            className="form-control w-auto"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isUploading}
            style={{ borderRadius: 6, padding: 8, border: '1px solid #ddd', maxWidth: 320 }}
          />
        </div>
        {file && (
          <p className="text-muted text-center" style={{ color: '#666', fontSize: 15, marginBottom: 8 }}>
            Selected file: <b>{file.name}</b>
          </p>
        )}
        {error && (
          <p className="text-danger text-center" style={{ color: '#d32f2f', fontWeight: 500, marginBottom: 0 }}>
            {error}
          </p>
        )}
      </Modal.Body>
      <Modal.Footer className="border-top-0 px-3 pb-3 pt-0" style={{ justifyContent: 'center', gap: 12 }}>
        <Button variant="light" onClick={onHide} disabled={isUploading} className="rounded-2 px-3" size="sm">
          Cancel
        </Button>
        <Button variant="primary" onClick={handleUpload} disabled={!file || isUploading} className="rounded-2 px-3 ms-2 d-flex align-items-center justify-content-center" size="sm">
          <i className="fas fa-upload me-2"></i> {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RestoreSchedulesModal;
