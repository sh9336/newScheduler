'use client';

import { Modal } from 'react-bootstrap';
import styles from '../../styles/Modals.module.css';

const LogsModal = ({ 
  show, 
  onHide, 
  logs, 
  searchTerm, 
  onSearch, 
  onStart, 
  onPrev, 
  onNext, 
  onEnd,
  onDownload 
}) => {
  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      dialogClassName={`modal-dialog-scrollable ${styles.modalLarge} ${styles.responsiveModal}`}
      centered
    >
      <Modal.Header closeButton className={styles.modalHeader}>
        <Modal.Title className={styles.modalTitle}>Logs</Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.modalBody}>
        <form>
          <div className={styles.modalControls}>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search logs..."
                value={searchTerm}
                onChange={onSearch}
              />
            </div>
            <div className={styles.buttonGroup}>
              <button type="button" className="btn btn-sm btn-primary" onClick={onStart}>
                <i className="fas fa-fast-backward me-1"></i>
                <span className={styles.buttonText}>Start</span>
              </button>
              <button type="button" className="btn btn-sm btn-primary" onClick={onPrev}>
                <i className="fas fa-step-backward me-1"></i>
                <span className={styles.buttonText}>Prev</span>
              </button>
              <button type="button" className="btn btn-sm btn-primary" onClick={onNext}>
                <i className="fas fa-step-forward me-1"></i>
                <span className={styles.buttonText}>Next</span>
              </button>
              <button type="button" className="btn btn-sm btn-primary" onClick={onEnd}>
                <i className="fas fa-fast-forward me-1"></i>
                <span className={styles.buttonText}>End</span>
              </button>
            </div>
            <div className={styles.downloadWrapper}>
              <button type="button" className="btn btn-sm btn-success" onClick={onDownload}>
                <i className="fas fa-download me-1"></i>
                <span className={styles.buttonText}>Download Latest</span>
              </button>
            </div>
          </div>
          <div className={styles.logsWrapper}>
            <textarea
              className={`form-control ${styles.logsTextarea}`}
              rows="15"
              readOnly
              value={logs.map(log => log.raw).join('\n')}
            />
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer className={styles.modalFooter}>
        <button className="btn btn-secondary" onClick={onHide}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default LogsModal;
