'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LogOut, LayoutDashboard, Library, TrendingUp, Search, Sparkles, BarChart2, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { href: '/dashboard',        label: 'Dashboard', icon: LayoutDashboard },
  { href: '/recommendations',  label: 'Discover',  icon: Sparkles        },
  { href: '/library',          label: 'Library',   icon: Library         },
  { href: '/stats',            label: 'Stats',     icon: BarChart2       },
  { href: '/trending',         label: 'Trending',  icon: TrendingUp      },
  { href: '/search',           label: 'Search',    icon: Search          },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 h-16 border-b" style={{backgroundColor:'rgba(15,17,23,0.95)', backdropFilter:'blur(16px)', borderColor:'#2a2d3e'}}>
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor:'#6366f1'}}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base" style={{color:'#f0f0f5'}}>BookRecommender</span>
          </Link>

          {/* Desktop nav links */}
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

          {/* Desktop user area */}
          {user && (
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.35)'}}>
                  <span className="text-sm font-bold" style={{color:'#818cf8'}}>{user.name?.[0]?.toUpperCase() || 'U'}</span>
                </div>
                <span
                  className="text-sm font-medium max-w-[160px] truncate cursor-default"
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
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {/* Mobile: hamburger button */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-[#1a1d27]"
            style={{color:'#8b8fa8'}}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{backgroundColor:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)'}}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className="fixed top-16 left-0 right-0 z-30 md:hidden border-b transition-transform duration-200"
        style={{
          backgroundColor:'#1a1d27',
          borderColor:'#2a2d3e',
          transform: mobileOpen ? 'translateY(0)' : 'translateY(-110%)',
          pointerEvents: mobileOpen ? 'auto' : 'none',
        }}
      >
        <div className="px-4 py-4 space-y-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={
                  active
                    ? {backgroundColor:'rgba(99,102,241,0.12)', color:'#818cf8'}
                    : {color:'#8b8fa8'}
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
              </Link>
            );
          })}

          {/* Mobile sign out */}
          {user && (
            <div className="pt-3 mt-3 border-t" style={{borderColor:'#2a2d3e'}}>
              <div className="flex items-center gap-3 px-4 py-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.35)'}}>
                  <span className="text-sm font-bold" style={{color:'#818cf8'}}>{user.name?.[0]?.toUpperCase() || 'U'}</span>
                </div>
                <span className="text-sm font-medium truncate" style={{color:'#f0f0f5'}}>{user.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full hover:bg-[#0f1117]"
                style={{color:'#8b8fa8'}}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
