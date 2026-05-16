import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import NavbarWrapper from '../components/NavbarWrapper';
import ScrollToTop from '../components/ScrollToTop';

export const metadata = {
  title: 'Folio',
  description: 'Get AI-powered book recommendations based on your taste, mood, and reading history.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ backgroundColor: '#0f1117' }}>
      <body className="min-h-screen bg-[#0f1117] text-[#f0f0f5] antialiased">
        <AuthProvider>
          <ToastProvider>
            <ScrollToTop />
            <NavbarWrapper />
            {/* Spacer so content is not hidden behind fixed navbar */}
            <div id="navbar-spacer" />
            <main>{children}</main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
