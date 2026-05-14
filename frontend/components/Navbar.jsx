'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LogOut, LayoutDashboard, Library, TrendingUp, Search, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/recommendations', label: 'Discover', icon: Sparkles },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/trending', label: 'Trending', icon: TrendingUp },
  { href: '/search', label: 'Search', icon: Search },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-16 border-b" style={{backgroundColor:'rgba(15,17,23,0.9)', backdropFilter:'blur(16px)', borderColor:'#2a2d3e'}}>
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor:'#6366f1'}}>
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base" style={{color:'#f0f0f5'}}>BookRecommender</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${active ? '' : 'hover:bg-[#1a1d27]'}`}
                style={{color: active ? '#818cf8' : '#8b8fa8'}}
              >
                <Icon className="w-4 h-4" />
                {label}
                {active && <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />}
              </Link>
            );
          })}
        </div>

        {/* User */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.35)'}}>
                <span className="text-sm font-bold" style={{color:'#818cf8'}}>{user.name?.[0]?.toUpperCase() || 'U'}</span>
              </div>
              <span
                className="hidden md:block text-sm font-medium max-w-[160px] truncate cursor-default"
                style={{color:'#f0f0f5'}}
                title={user.name}
              >
                {user.name}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-[#1a1d27]"
              style={{color:'#8b8fa8'}}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:block">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
