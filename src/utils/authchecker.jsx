"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const isDev = process.env.NODE_ENV === 'development';

export default function useAuthChecker() {
  const pathname = usePathname();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const isLoginPage = pathname === '/login' || pathname === '/login.html';

    if (!isAuthenticated && !isLoginPage) {
      
        if (isDev===true) {
          window.location.href = '/login';
        } else {
          window.location.href = '/static/login.html';
        } 
      // Redirect unauthenticated users to login page
    } else if (isAuthenticated && isLoginPage) {
      
      if (isDev===true) {
          window.location.href = '/status';
        } else {
          window.location.href = '/static/status.html';
        } 
     // Redirect authenticated users to status page
    }
    // If authenticated and not on login, or unauthenticated and on login, do nothing
  }, [pathname]);
}