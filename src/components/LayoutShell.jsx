"use client";
import Navbar from "./Navbar";
import Footer from "./Footer";
import NotificationContainer from "./NotificationContainer";
import AuthGuard from "./AuthGuard";
import { usePathname } from "next/navigation";

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  return (
    <>
      {!isLoginPage && <Navbar />}
      <main className="main-content">
        <AuthGuard>{children}</AuthGuard>
      </main>
      {!isLoginPage && <Footer />}
      {!isLoginPage && <NotificationContainer />}
    </>
  );
}
