'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '../../lib/auth';

export default function AppLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login');
    }
  }, [router]);

  // Add top padding to account for the fixed navbar (h-16 = 64px)
  return <div className="pt-16">{children}</div>;
}
