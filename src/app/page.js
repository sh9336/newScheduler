"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (isAuthenticated) {
      window.location.href = '/static/status.html';
    } else {
      window.location.href = '/static/login.html';
    }
  }, []);
  return null;
}