// src/components/Notification.jsx
import React from 'react';

export default function Notification({ message, type = 'info' }) {
  if (typeof window !== 'undefined') {
    // Dispatch a custom event that will be caught by the NotificationContainer
    window.dispatchEvent(
      new CustomEvent('showNotification', {
        detail: { message, type }
      })
    );
  }
}