'use client';

import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

export default function NavbarWrapper() {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  return <Navbar />;
}
