"use client";
import Link from 'next/link';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from '../styles/Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
    { href: '/status', label: 'Status', icon: '📊' },
    { href: '/schedules', label: 'Schedules', icon: '📅' },
    { href: '/tracks', label: 'Tracks', icon: '🎵' },
    { href: '/emergency-tracks', label: 'Emergency', icon: '🚨' },
    { href: '/logs', label: 'Logs', icon: '📋' },
    { href: '/time', label: 'Time', icon: '⏰' },
    { href: '/restart', label: 'Restart', icon: '🔄' },
    { href: '/contact', label: 'Contact', icon: '📞' }
  ];

  return (
    <nav className={`navbar navbar-expand-lg ${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <div className="container-fluid">
        {/* Logo on the left */}
        <Link href="/" className="navbar-brand">
          <div className={styles.logoContainer}>
            <img
  src="/grove_logo_black.png"
  alt="Grove Scheduler Logo"
  width={100}
  height={30}
  style={{ objectFit: 'contain' }}
/>
        <span style={{ fontFamily: 'Dancing Script, "Brush Script MT", "Comic Sans MS", cursive', fontWeight: 700, fontSize: 32, color: '#278', letterSpacing: 1, whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,0.07)' }}>
          Scheduler
        </span>
          </div>
        </Link>
        
        <button
          className={`navbar-toggler ${styles.navbarToggler}`}
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {navItems.map((item) => (
              <li key={item.href} className="nav-item">
                <Link
                  href={item.href}
                  className={`nav-link ${styles.navLink} ${
                    isActive(item.href) ? styles.active : ''
                  }`}
                  title={item.label}
                >
                  <span className={styles.navIcon} role="img" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className={styles.navText}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}