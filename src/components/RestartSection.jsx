"use client";

import { useState } from 'react';
import styles from '../styles/RestartSection.module.css';
import ConfirmationModal from './Modals/ConfirmationModal';
import Notification from './Notification';

const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? '/api/proxy' // Use proxy in development
  : '';

export default function RestartSection() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRestart = async () => {
    try {
      setLoading(true);

      // Create empty form data as required by the server
      const formData = new FormData();


      
      const response = await fetch(`${API_BASE_URL}/do_reset`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });


      // Try to get the response data, but don't fail if we can't
      // (server might stop before sending response)
      let data;
      try {
        data = await response.json();
      } catch (error) {
        // If we can't get the response, but the request was sent, consider it successful
        if (error.name === 'TypeError') {
          data = { success: true, message: 'Server restart initiated successfully' };
        } else {
          throw error;
        }
      }

      if (!response.ok && response.status !== 502 && response.status !== 504) {
        if (response.status === 401) {
          // Redirect to login if unauthorized
          window.location.href = '/login';
          return;
        }
        throw new Error(data.error || data.details || 'Failed to restart server');
      }

      Notification({ 
        message: data.message || 'Server restart initiated successfully', 
        type: 'success' 
      });

      // Close modal after successful restart
      setShowConfirmModal(false);

      // Optional: Redirect to status page after restart
      // Wait a bit longer since the server needs time to stop and restart
      setTimeout(() => {
        window.location.href = '/status';
      }, 3000); // 3 seconds delay

    } catch (error) {
      console.error('Error restarting server:', error);
      Notification({ 
        message: error.message || 'Error restarting server', 
        type: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.restartSection} style={{ minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ padding: '24px', margin: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-3">
          <div className="d-flex align-items-center gap-2">
            <i className="fas fa-power-off text-danger fs-3 me-2"></i>
            <h2 className="fw-bold mb-0 fs-4">Server Restart</h2>
          </div>
        </div>
        <hr className="my-3" />
        <div className="row g-4">
          <div className="col-12">
            <div className="bg-light rounded-3 p-4 h-100 shadow-sm text-center">
              <div className="d-flex flex-column align-items-center mb-2">
                <i className="fas fa-exclamation-triangle text-danger fs-1 mb-2"></i>
                <h5 className="mb-2">Important Notice</h5>
              </div>
              <div className="fs-5 fw-semibold mb-2">
                Restarting the server will temporarily interrupt all running schedules and tracks.
              </div>
              <div className="text-muted small mb-3">
                The server will be unavailable for a few moments during the restart process.<br/>
                You will be automatically redirected to the status page once the restart is initiated.
              </div>
              <button
                className="btn btn-danger btn-lg d-flex align-items-center justify-content-center mx-auto"
                onClick={() => setShowConfirmModal(true)}
                disabled={loading}
                style={{ minWidth: 180 }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    Restarting Server...
                  </>
                ) : (
                  <>
                    <i className="fas fa-power-off me-2"></i>
                    Restart Server
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        title="Confirm Server Restart"
        message="Are you sure you want to restart the server? This will temporarily interrupt all running schedules and tracks."
        confirmLabel={loading ? 'Restarting...' : 'Yes, Restart Server'}
        confirmVariant="danger"
        onConfirm={handleRestart}
        disabled={loading}
      />
    </div>
  );
}
