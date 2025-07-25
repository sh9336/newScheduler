"use client";

import { useState } from 'react';
import styles from '../styles/RestartSection.module.css';
import ConfirmationModal from './Modals/ConfirmationModal';
import Notification from './Notification';

const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? '/api/proxy' // Use proxy in development
  : '';

const isDev = process.env.NODE_ENV === 'development';

  
export default function RestartSection() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRestart = async () => {
    try {
      setLoading(true);

      // Set a timeout to handle the case where server stops immediately
      const restartPromise = fetch(`${API_BASE_URL}/do_reset`, {
        method: 'POST',
        credentials: 'include',
      });

      // Race between the fetch and a timeout
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve({ 
            ok: true, 
            json: () => Promise.resolve({ 
              success: true, 
              message: 'Server restart initiated successfully' 
            })
          });
        }, 2000); // 2 second timeout
      });

      let response;
      let data;

      try {
        // Wait for either the response or timeout
        response = await Promise.race([restartPromise, timeoutPromise]);
        
        // Try to get JSON response
        try {
          data = await response.json();
        } catch (jsonError) {
          // If JSON parsing fails, assume restart was successful
          data = { success: true, message: 'Server restart initiated successfully' };
        }
      } catch (fetchError) {
        // Network errors (connection refused, etc.) indicate server is restarting
        if (fetchError.name === 'TypeError' || 
            fetchError.message.includes('Failed to fetch') ||
            fetchError.message.includes('NetworkError') ||
            fetchError.message.includes('fetch')) {
          data = { success: true, message: 'Server restart initiated successfully' };
          response = { ok: true };
        } else {
          throw fetchError;
        }
      }

      // Handle specific HTTP status codes that might indicate restart
      if (response && !response.ok && 
          response.status !== 502 && 
          response.status !== 504 && 
          response.status !== 0) { // status 0 can occur when connection is cut
        
        if (response.status === 401) {
          // Redirect to login if unauthorized
          if (isDev===true) {
            window.location.href = '/login';
          } else {
            window.location.href = '/static/login.html';
          }
          return;
        }
        throw new Error(data?.error || data?.details || 'Failed to restart server');
      }

      // Show success notification
      Notification({ 
        message: data.message || 'Server restart initiated successfully', 
        type: 'success' 
      });

      // Close modal after successful restart
      setShowConfirmModal(false);

      // Redirect to status page after restart with the existing routing logic
      setTimeout(() => {
        if (isDev===true) {
          window.location.href = '/status';
        } else {
          window.location.href = '/static/status.html';
        }
      }, 3000); // 3 seconds delay

    } catch (error) {
      console.error('Error restarting server:', error);
      
      // Only show error if it's not a network/connection error
      // (which would indicate successful restart)
      if (!error.message.includes('Failed to fetch') && 
          !error.message.includes('NetworkError') &&
          error.name !== 'TypeError') {
        Notification({ 
          message: error.message || 'Error restarting server', 
          type: 'danger' 
        });
      } else {
        // Connection errors likely mean restart was successful
        Notification({ 
          message: 'Server restart initiated successfully', 
          type: 'success' 
        });
        setShowConfirmModal(false);
        setTimeout(() => {
          if (isDev===true) {
            window.location.href = '/status';
          } else {
            window.location.href = '/static/status.html';
          }
        }, 3000);
      }
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
