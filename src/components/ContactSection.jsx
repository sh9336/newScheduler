"use client";

import { useState } from 'react';
import Image from 'next/image';
import styles from '../styles/ContactSection.module.css';
import Notification from './Notification';
import emailjs from 'emailjs-com';

const isDev = process.env.NODE_ENV === 'development';

const logoSrc = isDev 
  ? "/images/grove_logo_black.png" 
  : "/static/images/grove_logo_black.png";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

const handleSubmit = async (e) => {
  e.preventDefault();

  const time = new Date().toLocaleString(); // Add this line

  try {
    await emailjs.send(
      'service_sgw4nuw',
      'template_5dicml9',
      {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
        time: time, // Include time
      },
      'iUBjGpPcpudCbFPCD'
    );

    Notification({ message: 'Message sent successfully!', type: 'success' });
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });

  } catch (error) {
    Notification({ message: 'Failed to send message. Please try again.', type: 'error' });
    console.error(error);
  }
};


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="contact-container d-flex flex-column" style={{ minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ padding: '24px', margin: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
        <div className="row g-4 align-items-stretch">
          {/* Contact Form Section */}
          <div className="col-lg-7 col-md-6">
            <div className="card shadow-sm h-100 border-0">
              <div className="card-body p-4">
                <h2 className="fw-bold mb-1 d-flex align-items-center">
                  <i className="fas fa-envelope me-2" style={{ color: '#f39c12', background: '#fff6e3', borderRadius: '50%', padding: '6px' }}></i> Get in Touch
                </h2>
                <p className="text-muted mb-4">We'd love to hear from you. Please fill out this form.</p>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="form-control"
                      placeholder="John Dev"
                    />
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="email" className="form-label">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="form-control"
                        placeholder="dev@example.com"
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="phone" className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="+91 93XXXXXXXX"
                      />
                    </div>
                  </div>
                  <div className="mb-3 mt-3">
                    <label htmlFor="subject" className="form-label">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="form-control"
                      placeholder="How can we help you?"
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="message" className="form-label">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="form-control"
                      placeholder="Tell us more about your needs..."
                      rows={5}
                    />
                  </div>
                  <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-lg rounded-2 fw-semibold" style={{ background: 'linear-gradient(90deg, #f39c12 0%, #27ae60 100%)', color: '#fff', border: 'none' }}>
                      <i className="fas fa-paper-plane me-2" style={{ color: '#fff', background: 'linear-gradient(90deg, #27ae60 0%, #f39c12 100%)', borderRadius: '50%', padding: '6px' }}></i> Send Message
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          {/* Company Information Section */}
          <div className="col-lg-5 col-md-6">
            <div className="card shadow-sm h-100 border-0 bg-light">
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-3">
                  <img
                    src={logoSrc}
                    alt="Grove Systems"
                    width={120}
                    height={40}
                    className="me-3"
                    style={{ objectFit: 'contain', border: '2px solid #222', borderRadius: '12px', background: '#fff', boxShadow: '0 2px 8px 0 #27ae60, 0 1px 8px 0 #f39c12' }}
                  />
                  <h3 className="fw-bold mb-0">Grove Systems Pvt. Ltd.</h3>
                </div>
                <div className="mb-3">
                  <i className="fas fa-map-marker-alt" style={{ color: '#e74c3c', background: '#fdecea', borderRadius: '50%', padding: '6px' }}></i>
                  <span className="fw-semibold">Address:</span>
                  <div className="text-muted small ms-4">
                    F-85, F-Block, Okhla Phase III<br />Okhla Industrial Estate, New Delhi,Delhi,110020<br />India
                  </div>
                </div>
                <div className="mb-3">
                  <i className="fas fa-phone-alt" style={{ color: '#27ae60', background: '#eafaf1', borderRadius: '50%', padding: '6px' }}></i>
                  <span className="fw-semibold">Phone:</span>
                  <div className="text-muted small ms-4">
                    +91 98XXXXXXXX<br />+91 92XXXXXXXX
                  </div>
                </div>
                <div className="mb-3">
                  <i className="fas fa-envelope" style={{ color: '#f39c12', background: '#fff6e3', borderRadius: '50%', padding: '6px' }}></i>
                  <span className="fw-semibold">Email:</span>
                  <div className="text-muted small ms-4">
                    info@grovesystems.co<br />support@grovesystems.co
                  </div>
                </div>
                <div className="mb-3">
                  <i className="fas fa-globe" style={{ color: '#2980b9', background: '#eaf4fb', borderRadius: '50%', padding: '6px' }}></i>
                  <span className="fw-semibold">Website:</span>
                  <a href="https://grovesystems.co/" target="_blank" rel="noopener noreferrer" className="ms-2 text-decoration-underline">
                    www.grovesystems.co
                  </a>
                </div>
                <div className="d-flex gap-3 mt-4">
                  <a href="https://facebook.com/grovesystems" target="_blank" rel="noopener noreferrer" style={{ background: '#1877f3', color: 'white', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fab fa-facebook"></i>
                  </a>
                  <a href="https://twitter.com/grovesystems" target="_blank" rel="noopener noreferrer" style={{ background: '#1da1f2', color: 'white', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a href="https://linkedin.com/company/grovesystems" target="_blank" rel="noopener noreferrer" style={{ background: '#0077b5', color: 'white', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fab fa-linkedin"></i>
                  </a>
                  <a href="https://instagram.com/grovesystems" target="_blank" rel="noopener noreferrer" style={{ background: 'radial-gradient(circle at 30% 110%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%)', color: 'white', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fab fa-instagram"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
