"use client";
import useAuthChecker from '../utils/authchecker';

export default function AuthGuard({ children }) {
  useAuthChecker();
  return children;
}