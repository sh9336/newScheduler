"use client";
import React, { useEffect } from 'react';
import styles from '../styles/FloatingNotification.module.css';

const FloatingNotification = ({ notifications, onDismiss }) => {
  useEffect(() => {
    // Auto-dismiss notifications after 3 seconds
    const timer = notifications?.length > 0 ? 
      setTimeout(() => {
        onDismiss(notifications[0].id);
      }, 3000) : null;
      
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [notifications]);

  if (!notifications.length) return null;

  return (
    <div className={styles.notificationContainer}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${styles.notification} ${styles[notification.type]} alert alert-${notification.type} alert-dismissible fade show`}
          role="alert"
        >
          {notification.message}
          <button
            type="button"
            className="btn-close"
            onClick={() => onDismiss(notification.id)}
            aria-label="Close"
          />
        </div>
      ))}
    </div>
  );
};

export default FloatingNotification; 