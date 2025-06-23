'use client';

import { Modal } from 'react-bootstrap';
import styles from '../../styles/ScheduleModals.module.css';

export default function ConfirmationModal({ 
  show, 
  onHide, 
  title = 'Confirmation', 
  message, 
  onConfirm,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  disabled = false
}) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className={styles.modalHeader}>
        <Modal.Title className={styles.modalTitle}>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.modalBody}>
        <div className="text-center mb-4">
          <div className="mb-3">
            <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '3rem' }}></i>
          </div>
          {/* Only render <p> if message is a string, otherwise render as a div */}
          {typeof message === 'string' ? (
            <p className="mb-0" style={{ fontSize: '0.95rem', color: '#4B5563' }}>{message}</p>
          ) : (
            <div style={{ fontSize: '0.95rem', color: '#4B5563' }}>{message}</div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className={styles.modalFooter}>
        <button 
          className={styles.buttonSecondary} 
          onClick={onHide}
          disabled={disabled}
        >
          Cancel
        </button>
        <button 
          className={confirmVariant === 'danger' ? styles.buttonDanger : styles.buttonPrimary}
          onClick={onConfirm}
          disabled={disabled}
        >
          {confirmLabel}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
