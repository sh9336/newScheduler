'use client';

import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import styles from '../../styles/ScheduleModals.module.css';

export default function TimeSettingsModal({ show, onHide, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSync = async () => {
    try {
      setLoading(true);
      setError('');
      const browserTime = Date.now().toString();
      await onUpdate(browserTime);
      onHide();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="md" className="fade" backdrop="static">
      <Modal.Header closeButton className="bg-light border-bottom-0 px-3 py-2">
        <Modal.Title className="d-flex align-items-center fs-5">
          <i className="fas fa-sync-alt text-primary me-2"></i>
          <span className="fw-semibold">Sync Scheduler Time</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-3">
        <div className="alert alert-info py-2 px-3 mb-3">
          <h6 className="fw-bold mb-1 fs-6">What does this do?</h6>
          <ul className="mb-0 ps-3 small">
            <li>Syncs the scheduler's system time with your device's current time</li>
            <li>Recommended if you notice time drift or schedule mismatches</li>
            <li>Requires browser permission to access current time</li>
          </ul>
        </div>
        <div className="text-center my-4">
          <i className="fas fa-clock text-primary" style={{ fontSize: '2.5rem' }}></i>
          <h5 className="fw-semibold mt-3 mb-2">Sync Scheduler Time with Browser Time?</h5>
          <p className="text-muted mb-0 small">
            This will update the scheduler's system time to match your device's current time.
          </p>
        </div>
        {error && (
          <div className="alert alert-danger mt-3 text-center" role="alert">
            {error}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-top-0 px-3 pb-3 pt-0" style={{ justifyContent: 'center', gap: 12 }}>
        <button className="btn btn-light rounded-2 px-3" onClick={onHide} disabled={loading}>
          Cancel
        </button>
        <button className="btn btn-primary rounded-2 px-3 ms-2 d-flex align-items-center justify-content-center" onClick={handleSync} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Syncing...
            </>
          ) : (
            <>
              <i className="fas fa-sync-alt me-2"></i> Sync Now
            </>
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
