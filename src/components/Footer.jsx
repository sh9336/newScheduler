import styles from '../styles/Footer.module.css';

export default function Footer() {
  return (
    <footer className="bg-dark text-white py-4 mt-5 border-top">
      <div className="container">
        <div className="row align-items-center justify-content-between g-3">
          <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-2 mb-md-0">
            <img src="/static/images/grove_logo_black.png" alt="Grove Systems" width={40} height={40} style={{ objectFit: 'contain', background: '#fff', borderRadius: 8, padding: 2 }} />
            <span className="fw-bold fs-5">Grove Systems Pvt. Ltd.</span>
          </div>
          <div className="col-12 col-md-auto text-muted small text-center text-md-end">
            &copy; 2025 Grove Systems. All rights reserved.
          </div>
          <div className="col-12 col-md-auto d-flex justify-content-center justify-content-md-end gap-3">
            <a href="https://grovesystems.co/" target="_blank" rel="noopener noreferrer" className="text-white text-decoration-none" aria-label="Website">
              <i className="fas fa-globe fa-lg"></i>
            </a>
            <a href="mailto:info@grovesystems.com" className="text-white text-decoration-none" aria-label="Email">
              <i className="fas fa-envelope fa-lg"></i>
            </a>
            <a href="https://linkedin.com/company/grovesystems" target="_blank" rel="noopener noreferrer" className="text-white text-decoration-none" aria-label="LinkedIn">
              <i className="fab fa-linkedin fa-lg"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
