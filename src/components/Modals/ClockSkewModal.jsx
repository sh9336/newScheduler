'use client';

import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import styles from '../../styles/TimeSettingsModal.module.css';

export default function ClockSkewModal({ show, onHide, onUpdate, currentValue }) {
  const [skewValue, setSkewValue] = useState(currentValue || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      await onUpdate(parseInt(skewValue, 10));
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
          <i className="fas fa-clock text-primary me-2"></i>
          <span className="fw-semibold">Set Clock Skew</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-3">
        <div className="alert alert-info py-2 px-3 mb-3">
          <h6 className="fw-bold mb-1 fs-6">What is Clock Skew?</h6>
          <ul className="mb-0 ps-3 small">
            <li>Adjusts the scheduler's clock by a fixed amount per day</li>
            <li>Helps compensate for systematic time drift</li>
            <li>Positive values speed up the clock, negative values slow it down</li>
          </ul>
        </div>
        <div className="text-center my-4">
          <i className="fas fa-clock text-primary" style={{ fontSize: '2.5rem' }}></i>
          <h5 className="fw-semibold mt-3 mb-2">Adjust Clock Skew</h5>
          <p className="text-muted mb-0 small">
            Set the clock skew adjustment in milliseconds per day.
          </p>
        </div>
        <div className="d-flex justify-content-center mb-3">
          <input
            type="number"
            className="form-control w-auto text-center"
            value={skewValue}
            onChange={(e) => setSkewValue(e.target.value)}
            placeholder="Enter milliseconds"
            style={{ borderRadius: 6, padding: 8, border: '1px solid #ddd', maxWidth: 180 }}
          />
          <span className="ms-2 align-self-center text-muted">ms/day</span>
        </div>
        <div className="text-center mb-2">
          <small className="text-muted">
            Positive values speed up the clock, negative values slow it down
          </small>
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
        <button className="btn btn-primary rounded-2 px-3 ms-2 d-flex align-items-center justify-content-center" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Updating...
            </>
          ) : (
            <>
              <i className="fas fa-clock me-2"></i> Set Clock Skew
            </>
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
}