'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Bell, LogOut, ChevronDown, Menu, X, Sparkles,
  LayoutDashboard, Store, Compass, Layers, MessageSquare,
  ShieldCheck, User, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  /** If true, shows the full nav with auth links. If false, shows minimal branding only. */
  variant?: 'full' | 'minimal';
  /** Optional user object to show logged-in state */
  user?: any;
}

// Mock notifications for demo
const MOCK_NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'New investor match',
    body: 'Nexus Venture Partners matched your startup profile.',
    time: '2m ago',
    read: false,
    type: 'invest',
  },
  {
    id: 'n2',
    title: 'Blueprint generated',
    body: 'Your "AgriTech AI" startup blueprint is ready to review.',
    time: '14m ago',
    read: false,
    type: 'blueprint',
  },
  {
    id: 'n3',
    title: 'Message received',
    body: 'Priya Sharma sent you a workspace invite.',
    time: '1h ago',
    read: true,
    type: 'message',
  },
  {
    id: 'n4',
    title: 'Asset verified',
    body: 'Your domain cropvision.ai listing has been verified.',
    time: '3h ago',
    read: true,
    type: 'verify',
  },
];

const NAV_LINKS = [
  { href: '/marketplace', label: 'Asset Exchange', icon: Store },
  { href: '/navigator',   label: 'Venture Navigator', icon: Compass },
  { href: '/blueprint',   label: 'Startup Blueprint', icon: Layers },
  { href: '/messages',    label: 'Messages', icon: MessageSquare },
  { href: '/dashboard',   label: 'Console', icon: LayoutDashboard },
];

export default function Navbar({ variant = 'full', user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('launchhub_token');
    }
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-8">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 text-black font-extrabold shadow-glow text-sm">
            L
          </div>
          <span className="text-lg font-bold tracking-wider text-white">
            LaunchHub<span className="text-emerald-500">.AI</span>
          </span>
        </Link>

        {variant === 'full' && (
          <>
            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Right-side controls */}
            <div className="flex items-center gap-2">

              {/* Notification Bell */}
              <div ref={notifRef} className="relative">
                <button
                  id="notification-bell"
                  onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
                  className={`relative rounded-lg p-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors ${unreadCount > 0 ? 'notification-dot' : ''}`}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-black">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-10 w-80 rounded-2xl border border-border bg-surface-card shadow-glass overflow-hidden z-50"
                    >
                      <div className="flex items-center justify-between p-4 border-b border-border/40">
                        <span className="text-xs font-bold text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-[10px] text-emerald-400 hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-border/30">
                        {notifications.map(n => (
                          <div
                            key={n.id}
                            className={`p-3.5 flex gap-3 transition-colors hover:bg-white/[0.02] ${!n.read ? 'bg-emerald-500/5' : ''}`}
                          >
                            <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${!n.read ? 'bg-amber-500' : 'bg-slate-700'}`} />
                            <div className="space-y-0.5 flex-1">
                              <p className="text-xs font-semibold text-white">{n.title}</p>
                              <p className="text-[11px] text-slate-400 leading-snug">{n.body}</p>
                              <p className="text-[10px] text-slate-600">{n.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User is logged in */}
              {user ? (
                <div ref={profileRef} className="relative">
                  <button
                    id="profile-menu"
                    onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-surface-card hover:bg-slate-900 px-3 py-1.5 transition-colors"
                  >
                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-[10px] font-bold">
                      {user.fullName?.[0] || 'U'}
                    </div>
                    <span className="text-xs font-semibold text-slate-300 hidden sm:block max-w-[80px] truncate">
                      {user.fullName?.split(' ')[0] || 'User'}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-10 w-48 rounded-2xl border border-border bg-surface-card shadow-glass overflow-hidden z-50"
                      >
                        <div className="p-3.5 border-b border-border/40">
                          <p className="text-xs font-bold text-white">{user.fullName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/profile"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                            onClick={() => setProfileOpen(false)}
                          >
                            <User className="h-3.5 w-3.5" /> My Profile
                          </Link>
                          <Link
                            href="/verification"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                            onClick={() => setProfileOpen(false)}
                          >
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Verify Identity
                          </Link>
                          <hr className="border-border/40 mx-3 my-1" />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
                          >
                            <LogOut className="h-3.5 w-3.5" /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full bg-emerald-500 hover:bg-emerald-400 px-4 py-1.5 text-xs font-bold text-black shadow-glow transition-all"
                  >
                    Join Free
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="md:hidden rounded-lg p-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {menuOpen && variant === 'full' && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-border/40 bg-black/80 backdrop-blur-xl"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
              <hr className="border-border/40 my-2" />
              {user ? (
                <button
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              ) : (
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-black"
                >
                  <Sparkles className="h-4 w-4" /> Join Free
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
