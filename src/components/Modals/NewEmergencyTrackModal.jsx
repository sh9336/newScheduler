'use client';

import { useState, useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';
import styles from '../../styles/Modals.module.css';
import Notification from '../Notification';

export default function NewEmergencyTrackModal({ show, onHide, onCreate }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSubmit = async () => {
    if (!file || !name || !action) {
      Notification({ message: 'Please fill all fields', type: 'warning' });
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('File', file);
      formData.append('Name', name);
      formData.append('AssetAction', action);
      formData.append('Role', 'Emergency');
      const response = await fetch('/api/assets?action=create', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error(errorData.error || 'Failed to create emergency track');
      }
      Notification({ message: 'Emergency track created successfully', type: 'success' });
      onCreate();
      onHide();
      setFile(null);
      setName('');
      setAction('');
    } catch (error) {
      console.error('Error creating emergency track:', error);
      Notification({ message: error.message || 'Error creating emergency track', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="md" className="fade" backdrop="static">
      <Modal.Header closeButton className="bg-light border-bottom-0 px-3 py-2">
        <Modal.Title className="d-flex align-items-center fs-5">
          <i className="fas fa-exclamation-triangle text-danger me-2"></i>
          <span className="fw-semibold">Add Emergency Track</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-3">
        <div className="alert alert-info py-2 px-3 mb-3">
          <h6 className="fw-bold mb-1 fs-6">File Requirements:</h6>
          <ul className="mb-0 ps-3 small">
            <li>Audio and video files are supported</li>
            <li>File names must not contain spaces or special characters</li>
            <li>Use underscores (_) or dashes (-) instead of spaces</li>
            <li>Example: emergency_alert.mp3, alert-video.mp4</li>
          </ul>
        </div>
        <div
          className="border-2 border-dashed rounded-3 p-4 text-center mb-3 bg-light"
          style={{ cursor: 'pointer', borderStyle: 'dashed', borderWidth: '2px', borderColor: '#dee2e6' }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="d-none"
            onChange={handleFileChange}
            accept="audio/*,video/*"
            disabled={loading}
          />
          <div className="py-3">
            <div className="upload-icon-wrapper mb-2">
              <i className="fas fa-cloud-upload-alt text-danger" style={{ fontSize: '2.5rem' }}></i>
            </div>
            <p className="fw-semibold mb-1">Drop your file here</p>
            <p className="text-muted mb-0 small">
              or <span className="text-danger text-decoration-underline">browse</span> to choose a file
            </p>
            <small className="d-block text-muted mt-1 small">
              Supported formats: audio, video
            </small>
          </div>
        </div>
        {file && (
          <div className="mt-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="fw-semibold mb-0 fs-6">Selected File</h6>
              <small className="text-muted">{file.name ? '1 file' : 'No file'}</small>
            </div>
            <div className="list-group shadow-sm">
              <div className="list-group-item border-0 rounded-2 mb-1 bg-light-subtle py-2 px-3">
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <div className="d-flex align-items-center flex-grow-1 min-width-0">
                    <div className="file-icon rounded-circle bg-danger bg-opacity-10 p-1 me-2">
                      <i className="fas fa-file-audio text-danger small"></i>
                    </div>
                    <div className="flex-grow-1 min-width-0">
                      <p className="fw-medium mb-0 text-truncate small">{file.name}</p>
                      <div className="d-flex align-items-center">
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </small>
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-link text-danger p-0 ms-1"
                    onClick={() => setFile(null)}
                    disabled={loading}
                    title="Remove file"
                    style={{ fontSize: '0.875rem' }}
                  >
                    <i className="fas fa-times-circle"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="mb-3 mt-4">
          <label className="form-label">Track Name</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            placeholder="Enter track name"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Track Action</label>
          <select
            className="form-control"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            disabled={loading}
          >
            <option value="">Select an action</option>
            <option value="play">Play</option>
          </select>
        </div>
      </Modal.Body>
      <Modal.Footer className="border-top-0 px-3 pb-3 pt-0" style={{ justifyContent: 'center', gap: 12 }}>
        <Button variant="light" onClick={onHide} disabled={loading} className="rounded-2 px-3">
          Cancel
        </Button>
        <Button variant="danger" onClick={handleSubmit} disabled={loading || !file} className="rounded-2 px-3 ms-2 d-flex align-items-center justify-content-center">
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Creating...
            </>
          ) : (
            <>
              <i className="fas fa-plus me-2"></i> Create
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
