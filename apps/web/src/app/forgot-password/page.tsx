'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSuccess(true);
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-bg grid-bg flex items-center justify-center p-6">
      <div className="absolute top-1/3 left-1/3 h-[250px] w-[350px] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06),transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border bg-surface-card p-8 space-y-6 shadow-glass"
      >
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Reset Password</h2>
          <p className="text-xs text-slate-400">
            We will email you a secure link to reset your account password.
          </p>
        </div>

        {success ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 space-y-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">Reset Link Dispatched</h4>
              <p className="text-xs text-slate-400">
                Check <span className="font-semibold text-slate-200">{email}</span> for instructions.
              </p>
            </div>
            <Link 
              href="/login" 
              className="inline-flex text-xs font-bold text-emerald-400 hover:underline pt-2"
            >
              Return to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@launchhub.ai"
                  className="w-full rounded-xl border border-border/60 bg-black/40 pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-xs font-bold text-black shadow-glow flex items-center justify-center gap-1.5 transition-all mt-6"
            >
              Send Reset Link
              <ArrowRight className="h-4 w-4" />
            </button>
            
            <div className="text-center text-xs text-slate-400 pt-2">
              <Link href="/login" className="hover:text-white transition-colors">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </main>
  );
}
