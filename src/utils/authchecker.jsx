"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function useAuthChecker() {
  const pathname = usePathname();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const isLoginPage = pathname === '/login' || pathname === '/login.html';

    if (!isAuthenticated && !isLoginPage) {
      window.location.href = '/static/login.html';
    } else if (isAuthenticated && isLoginPage) {
      window.location.href = '/static/status.html'; // Redirect authenticated users to status page
    }
    // If authenticated and not on login, or unauthenticated and on login, do nothing
  }, [pathname]);
}