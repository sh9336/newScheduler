"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';


import styles from '../styles/LoginSection.module.css';
const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? '/api/proxy' // Use proxy in development
  : ''; // Direct backend in production
const isDev = process.env.NODE_ENV === 'development';

const logoSrc = isDev 
  ? "/images/grove_logo_black.png" 
  : "/static/images/grove_logo_black.png";

export default function LoginSection() {
  const [ipAddress, setIpAddress] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    
    try {
      const formData = new FormData();
     
      formData.append('loginName', loginName);
      formData.append('loginPassword', loginPassword);

      const response = await fetch(`${API_BASE_URL}/do_login`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Send cookies
      });

     

      const data = await response.json();
      console.log('Login API Response:', data);

      if (data.status === 1) {
        // Set localStorage flag for client-side auth
        localStorage.setItem('isAuthenticated', 'true');
        // Simple redirect - cookies will be automatically included in future requests
        if (isDev===true) {
          window.location.href = '/status';
        } else {
          window.location.href = '/static/status.html';
        } 
        
      } else {
        setError('Login Unsuccessful. Please login again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login Unsuccessful. Please login again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', position: 'relative', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Logo at top left with black border and Scheduler text */}
      <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 10, background: '#fff', border: '2px solid #000', borderRadius: 8, padding: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src= {logoSrc}
          alt="Grove Scheduler Logo"
          width={100}
          height={32}
          style={{ objectFit: 'contain', display: 'block' }}
        />
        
        <span style={{ fontFamily: 'Dancing Script, "Brush Script MT", "Comic Sans MS", cursive', fontWeight: 700, fontSize: 32, color: '#222', letterSpacing: 1, whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,0.07)' }}>
          Scheduler
        </span>
      </div>
      {/* Centered login card */}
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px' }}>
        <div className="card shadow-sm border-0 p-4" style={{ minWidth: 0, maxWidth: 400, width: '100%', background: 'rgba(255,255,255,0.97)', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1.5px solid #222', margin: '0 auto' }}>
          <div className="mb-4 text-center">
            <h2 className="fw-bold mt-3 mb-1" style={{ color: '#222', letterSpacing: 1 }}>Sign In</h2>
            <p className="text-muted mb-0" style={{ fontSize: '1.05rem' }}>Access your Scheduler Dashboard</p>
          </div>
          {error && (
            <div className="alert alert-danger text-center" role="alert" style={{ borderRadius: 8, fontWeight: 500 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
            <div className="mb-3">
              <label htmlFor="loginName" className="form-label" style={{ fontWeight: 600, color: '#333' }}>Username</label>
              <div className="input-group" style={{ borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(102,126,234,0.08)' }}>
                <span className="input-group-text bg-light" style={{ border: 'none', background: '#f3f4f6' }}><i className="fas fa-user"></i></span>
                <input
                  type="text"
                  className="form-control"
                  id="loginName"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  required
                  placeholder="Enter username"
                  style={{ border: 'none', background: '#f9fafb', fontSize: '1.05rem', padding: '0.75rem 1rem' }}
                />
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="loginPassword" className="form-label" style={{ fontWeight: 600, color: '#333' }}>Password</label>
              <div className="input-group" style={{ borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(102,126,234,0.08)' }}>
                <span className="input-group-text bg-light" style={{ border: 'none', background: '#f3f4f6' }}><i className="fas fa-lock"></i></span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  id="loginPassword"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  style={{ border: 'none', background: '#f9fafb', fontSize: '1.05rem', padding: '0.75rem 1rem' }}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0 rounded-end"
                  tabIndex="-1"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{ borderLeft: 0, background: '#f3f4f6', border: 'none' }}
                >
                  <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
              </div>
            </div>
            <div className="d-grid mt-4">
              <button type="submit" className="btn btn-primary btn-lg rounded-2 fw-semibold" style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)', border: 'none', fontSize: '1.1rem', letterSpacing: 1 }}>
                <i className="fas fa-sign-in-alt me-2"></i> Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}