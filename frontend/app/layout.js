import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import NavbarWrapper from '../components/NavbarWrapper';

export const metadata = {
  title: 'Book Recommender — Your reading life, intelligently connected',
  description: 'Get AI-powered book recommendations based on your taste, mood, and reading history.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100">
        <AuthProvider>
          <NavbarWrapper />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
