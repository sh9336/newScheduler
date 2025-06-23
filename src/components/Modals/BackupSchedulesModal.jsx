'use client';

import { Modal, Button } from 'react-bootstrap';
import styles from '../../styles/ScheduleModals.module.css';

const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? '/api/proxy' // Use proxy in development
  : ''; 

const BackupSchedulesModal = ({ show, onHide }) => {
  const handleDownload = async () => {
    try {
      
       const response = await fetch(`${API_BASE_URL}/backupSchedules`, {
        method: 'GET',
        credentials: 'include', // Send cookies
      });

      

      if (!response.ok) {
        throw new Error('Failed to download backup');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'SchedulesBackup.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Convert the response to a blob
      const blob = await response.blob();

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);

      onHide();
    } catch (error) {
      console.error('Error downloading backup:', error);
      // You might want to show a notification here
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="md" className="fade" backdrop="static">
      <Modal.Header closeButton className="bg-light border-bottom-0 px-3 py-2">
        <Modal.Title className="d-flex align-items-center fs-5">
          <i className="fas fa-database text-primary me-2"></i>
          <span className="fw-semibold">Backup Schedules</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-3">
        <div className="alert alert-info py-2 px-3 mb-3">
          <h6 className="fw-bold mb-1 fs-6">Backup Information:</h6>
          <ul className="mb-0 ps-3 small">
            <li>This will download your current schedules as a CSV file</li>
            <li>Keep the backup file safe for future restores</li>
            <li>File name: <b>SchedulesBackup.csv</b></li>
          </ul>
        </div>
        <div className="text-center my-4">
          <i className="fas fa-download text-primary" style={{ fontSize: '2.5rem' }}></i>
          <h5 className="fw-semibold mt-3 mb-2">Download Your Schedules Backup</h5>
          <p className="text-muted mb-0 small">
            Click the button below to securely download your backup file.
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer className="border-top-0 px-3 pb-3 pt-0" style={{ justifyContent: 'center', gap: 12 }}>
        <button className="btn btn-light rounded-2 px-3" onClick={onHide} style={{ minWidth: 110, fontWeight: 500, fontSize: 15 }}>
          Cancel
        </button>
        <button className="btn btn-primary rounded-2 px-3 ms-2 d-flex align-items-center justify-content-center" onClick={handleDownload} style={{ minWidth: 140, fontWeight: 600, fontSize: 15 }}>
          <i className="fas fa-download me-2"></i> Download
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default BackupSchedulesModal;
