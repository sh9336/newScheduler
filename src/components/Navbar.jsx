"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from '../styles/Navbar.module.css';
// Material Design Icons
import { MdOutlineAssessment, MdEventNote, MdLibraryMusic, MdReportProblem, MdAssignment, MdAccessTime, MdRestartAlt, MdContactPhone } from 'react-icons/md';

const isDev = process.env.NODE_ENV === 'development';

const logoSrc = isDev 
  ? "/images/grove_logo_black.png" 
  : "/static/images/grove_logo_black.png";

const href = isDev ? "/status" : "/status.html";

export default function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Add scroll effect to navbar
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => {
    if (!mounted) return false;
    return pathname === path;
  };

  const navItems = [
    { href: isDev ?'/status' : "/status.html", label: 'Status', icon: <MdOutlineAssessment size={15} color="#b0b0b0" /> },
    { href: isDev ?'/schedules':'/schedules.html', label: 'Schedules', icon: <MdEventNote size={15} color="#b0b0b0" /> },
    { href: isDev ?'/tracks':'/tracks.html', label: 'Tracks', icon: <MdLibraryMusic size={15} color="#b0b0b0" /> },
    { href: isDev ?'/emergency-tracks':'/emergency-tracks.html', label: 'Emergency', icon: <MdReportProblem size={15} color="#b0b0b0" /> },
    { href: isDev ?'/logs':'/logs.html', label: 'Logs', icon: <MdAssignment size={15} color="#b0b0b0" /> },
    { href: isDev ?'/time':'/time.html', label: 'Time', icon: <MdAccessTime size={15} color="#b0b0b0" /> },
    { href: isDev ?'/restart':'/restart.html', label: 'Restart', icon: <MdRestartAlt size={15} color="#b0b0b0" /> },
    { href: isDev ?'/contact':'/contact.html', label: 'Contact', icon: <MdContactPhone size={15} color="#b0b0b0" /> }
  ];

  return (
    <nav className="navbar navbar-expand-lg" style={{ background: 'linear-gradient(90deg, #232526 0%, #414345 100%)', borderBottom: '2px solid #27ae60', borderRadius: '0 0 12px 12px', boxShadow: '0 2px 12px rgba(39,174,96,0.07)' }}>
      <div className="container-fluid d-flex justify-content-between align-items-center">
        {/* Logo on the left */}
        <Link href={href} className="navbar-brand d-flex align-items-center" style={{ marginRight: 'auto' }}>
          <img
            src={logoSrc}
            alt="Grove Scheduler Logo"
            width={80}
            height={40}
            style={{ objectFit: 'contain', background: '#fff', borderRadius: 8, padding: 2, boxShadow: '0 2px 8px #27ae6033', border: '2px solid #27ae60' }}
          />
          <span style={{ fontFamily: 'Dancing Script, Pacifico, cursive', fontWeight: 700, fontSize: 24, color: '#fff', letterSpacing: 1, whiteSpace: 'nowrap', textShadow: '0 1px 2px #232526', marginLeft: 8 }}>
            Scheduler
          </span>
        </Link>
        <button
          className={`navbar-toggler`}
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={navOpen}
          aria-controls="navbarNav"
          style={{ border: '1px solid #27ae60', background: '#232526', borderRadius: 6 }}
          onClick={() => setNavOpen((open) => !open)}
        >
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1) brightness(2)' }}></span>
        </button>
        <div className={`collapse navbar-collapse${navOpen ? ' show' : ''}`} id="navbarNav" style={{ flexGrow: 0 }}>
          <ul className="navbar-nav ms-auto d-flex align-items-center flex-wrap flex-md-nowrap w-100" style={{ gap: 4 }}>
            {navItems.map((item) => (
              <li key={item.href} className="nav-item w-100">
                <Link
                  href={item.href}
                  className={`nav-link navbar-btn ${isActive(item.href) ? 'active' : ''}`}
                  style={{
                    borderRadius: 8,
                    margin: '2px 0',
                    color: isActive(item.href) ? '#fff' : '#e0e0e0',
                    background: isActive(item.href) ? '#4c5255' : '#232526',
                    fontWeight: 600,
                    fontSize: 12,
                    padding: '6px 8px',
                    width: '100%',
                    boxShadow: isActive(item.href) ? '0 2px 8px #27ae6033' : 'none',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: isActive(item.href) ? '2px solid #27ae60' : '2px solid #414345',
                    justifyContent: 'flex-start',
                  }}
                  title={item.label}
                  onClick={() => setNavOpen(false)}
                >
                  <span style={{ fontSize: 15, marginRight: 4 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}