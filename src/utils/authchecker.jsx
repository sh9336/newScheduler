"use client";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function useAuthChecker() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Use localStorage for client-side auth state
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const isLoginPage = pathname === '/login';

    if (!isAuthenticated && !isLoginPage) {
      router.replace('/login');
    } else if (isAuthenticated && isLoginPage) {
      router.replace('/');
    }
    // If authenticated and not on login, or unauthenticated and on login, do nothing
  }, [router, pathname]);
}