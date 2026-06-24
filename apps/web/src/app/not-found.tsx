'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Compass, ArrowLeft, Sparkles } from 'lucide-react';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);



  return (
    <main className="relative min-h-screen w-full bg-bg grid-bg flex items-center justify-center p-6 overflow-hidden">
      {/* Sacred overlay */}
      <div className="sacred-overlay" />

      {/* Glow spots */}
      <div className="absolute top-1/4 left-1/3 h-[400px] w-[500px] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.07),transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[400px] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05),transparent_70%)] pointer-events-none" />

      {/* Orbit rings */}
      {mounted && (
        <>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full border border-emerald-500/5 animate-orbit pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border border-amber-500/4 animate-orbit-reverse pointer-events-none" />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-lg mx-auto space-y-8"
      >
        {/* Brand */}
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500 text-black font-extrabold shadow-glow text-base">
            L
          </div>
          <span className="text-xl font-bold tracking-wider text-white">
            LaunchHub<span className="text-emerald-500">.AI</span>
          </span>
        </Link>

        {/* 404 number */}
        <div className="space-y-2">
          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 120 }}
            className="text-[8rem] font-extrabold leading-none text-gradient-aurora select-none"
          >
            404
          </motion.p>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Route Not Found
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            This launch path doesn't exist in our operating system. 
            It may have moved or been decommissioned.
          </p>
        </div>

        {/* Status codes panel */}
        <div className="rounded-2xl border border-border bg-surface-card p-5 space-y-3 text-left shadow-glass">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            Navigation Diagnostic
          </div>
          {[
            { label: 'Requested Route', value: 'Not mapped in OS', color: 'text-red-400' },
            { label: 'OS Status',       value: 'Online (100% uptime)', color: 'text-emerald-400' },
            { label: 'Suggested Action', value: 'Return to known route', color: 'text-amber-400' },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center text-xs">
              <span className="text-slate-500">{row.label}</span>
              <span className={`font-semibold ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary justify-center">
            <Home className="h-4 w-4" /> Return Home
          </Link>
          <Link href="/marketplace" className="btn-secondary justify-center">
            <Compass className="h-4 w-4" /> Browse Marketplace
          </Link>
          <Link href="/navigator" className="btn-secondary justify-center">
            <Sparkles className="h-4 w-4" /> Venture Navigator
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
