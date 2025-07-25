import '../styles/globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import NotificationContainer from '../components/NotificationContainer';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import AuthGuard from '../components/AuthGuard';
import LayoutShell from '../components/LayoutShell';

const inter = Inter({ subsets: ['latin'] });

const isDev = process.env.NODE_ENV === 'development';

export const metadata = {
  title: 'Grove Scheduler',
  description: 'A scheduling application built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href={isDev ? "/assets/bootstrap/css/bootstrap.min.css" : "/static/assets/bootstrap/css/bootstrap.min.css"}
          rel="stylesheet"
        />
        <link
          href={isDev ? "/assets/fontawesome/css/all.min.css" : "/static/assets/fontawesome/css/all.min.css"}
          rel="stylesheet"
        />
        <link
          href={isDev ? "/assets/googleapis/css/css2.css" : "/static/assets/googleapis/css/css2.css"}
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <LayoutShell>{children}</LayoutShell>
        <Script
          src={isDev ? "/assets/bootstrap/js/bootstrap.bundle.min.js" : "/static/assets/bootstrap/js/bootstrap.bundle.min.js"}
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}