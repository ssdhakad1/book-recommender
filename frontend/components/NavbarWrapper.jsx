'use client';

import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

export default function NavbarWrapper() {
  const { user, loading } = useAuth();

  // Only show navbar when user is authenticated
  if (loading || !user) return null;

  return <Navbar />;
}
