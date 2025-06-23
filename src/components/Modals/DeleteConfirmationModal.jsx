'use client';

import { Modal, Button } from 'react-bootstrap';

export default function DeleteConfirmationModal({ show, onHide, onConfirm, trackName }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Delete Track</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <div className="mb-3">
            <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '3rem' }}></i>
          </div>
          <h5>Are you sure you want to delete this track?</h5>
          {trackName && (
            <p className="text-muted">
              Track: <strong>{trackName}</strong>
            </p>
          )}
          <p className="text-danger mb-0">This action cannot be undone.</p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
} 