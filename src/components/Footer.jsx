import styles from '../styles/Footer.module.css';

const isDev = process.env.NODE_ENV === 'development';

const logoSrc = isDev 
  ? "/images/grove_logo_black.png" 
  : "/static/images/grove_logo_black.png";

export default function Footer() {
  return (
    <footer className="footer-section py-4 mt-5" style={{ background: 'linear-gradient(90deg, #232526 0%, #414345 100%)', borderTop: '2px solid #27ae60', borderRadius: '12px 12px 0 0', boxShadow: '0 -2px 12px rgba(39,174,96,0.07)' }}>
      <div className="container">
        <div className="row align-items-center justify-content-between g-3">
          <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-2 mb-md-0">
            <img src={logoSrc} alt="Grove Systems" width={80} height={40} style={{ objectFit: 'contain', background: '#fff', borderRadius: 8, padding: 2, boxShadow: '0 2px 8px #27ae6033', border: '2px solid #27ae60' }} />
            <span className="fw-bold fs-5" style={{ fontFamily: 'Dancing Script, Pacifico, cursive', fontWeight: 700, fontSize: 28, color: '#fff', letterSpacing: 1, whiteSpace: 'nowrap', textShadow: '0 1px 2px #232526' }}>Grove Systems Pvt. Ltd.</span>
          </div>
          <div className="col-12 col-md-auto small text-center text-md-end" style={{ color: '#e0e0e0', opacity: 0.98, textShadow: '0 1px 2px #232526' }}>
            &copy; 2025 Grove Systems Pvt. Ltd. All rights reserved.
          </div>
          <div className="col-12 col-md-auto d-flex justify-content-center justify-content-md-end gap-3">
            <a href="https://grovesystems.co/" target="_blank" rel="noopener noreferrer" style={{ background: '#232526', color: '#2980b9', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', border: '1.5px solid #414345' }} aria-label="Website">
              <i className="fas fa-globe"></i>
            </a>
            <a href="mailto:info@grovesystems.com" style={{ background: '#232526', color: '#f39c12', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', border: '1.5px solid #414345' }} aria-label="Email">
              <i className="fas fa-envelope"></i>
            </a>
            <a href="https://linkedin.com/company/grovesystems" target="_blank" rel="noopener noreferrer" style={{ background: '#232526', color: '#0077b5', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', border: '1.5px solid #414345' }} aria-label="LinkedIn">
              <i className="fab fa-linkedin"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
