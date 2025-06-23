"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true';
    if (isAuthenticated) {
      window.location.href = "/status";
    } else {
      window.location.href = "/login";
    }
  }, []);
  return null;
}