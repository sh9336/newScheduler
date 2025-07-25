"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    const isBrowser = typeof window !== 'undefined';
    
    if (!isBrowser) return;

    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    const basePath = isDev ? '' : '/static';
    const targetPage = isAuthenticated ? 'status' : 'login';
    
    window.location.href = `${basePath}/${targetPage}${isDev ? '' : '.html'}`;
  }, []);

  return null;
}
