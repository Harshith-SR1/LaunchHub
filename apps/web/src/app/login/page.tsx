'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../lib/api';

// ─── Validation helpers ────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

interface FieldErrors {
  email?: string;
  password?: string;
}

function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required.';
  if (trimmed.length > 254) return 'Email is too long.';
  if (!EMAIL_REGEX.test(trimmed)) return 'Please enter a valid email address.';
  return undefined;
}

function validateLoginPassword(password: string): string | undefined {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return undefined;
}

// ─── Inline error component ───────────────────────────────
function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 mt-1.5"
        >
          <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />
          <span className="text-[11px] text-red-400">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main login component ─────────────────────────────────
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirect, setRedirect] = useState('/dashboard');

  useEffect(() => {
    const r = searchParams.get('redirect') || '/dashboard';
    setRedirect(r);
  }, [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Per-field errors
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // Track which fields the user has interacted with (blurred)
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate a single field and update errors
  const validateField = useCallback((field: keyof FieldErrors, value: string) => {
    let error: string | undefined;
    switch (field) {
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validateLoginPassword(value);
        break;
    }
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
    return error;
  }, []);

  // Blur handler — mark as touched and validate
  const handleBlur = useCallback((field: keyof FieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = field === 'email' ? email : password;
    validateField(field, value);
  }, [email, password, validateField]);

  // Validate all on submit
  const validateAll = (): boolean => {
    const emailErr = validateEmail(email);
    const passwordErr = validateLoginPassword(password);
    const errors: FieldErrors = { email: emailErr, password: passwordErr };
    setFieldErrors(errors);
    setTouched({ email: true, password: true });
    return !emailErr && !passwordErr;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validateAll()) return;

    setLoading(true);
    try {
      const data = await authApi.login({ email: email.trim(), password });
      if (data.access_token) {
        localStorage.setItem('launchhub_token', data.access_token);
        router.push(redirect as any);
      } else {
        setServerError('Failed to retrieve authentication token.');
      }
    } catch (err: any) {
      setServerError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic border color based on validation state
  const borderClass = (field: keyof FieldErrors) => {
    if (!touched[field]) return 'border-border/60 focus-within:border-emerald-500/50';
    if (fieldErrors[field]) return 'border-red-500/50 focus-within:border-red-500/70';
    return 'border-emerald-500/40 focus-within:border-emerald-500/60';
  };

  return (
    <main className="relative min-h-screen w-full bg-bg grid-bg flex items-center justify-center p-6">
      {/* Glow */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[400px] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border bg-surface-card p-8 space-y-6 shadow-glass"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-black font-extrabold shadow-glow text-lg mx-auto">
            L
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome to LaunchHub</h2>
          <p className="text-xs text-slate-400">
            Access your startup operating system and asset exchange console.
          </p>
        </div>

        {/* Server / global error banner */}
        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold">Email address</label>
            <div className={`relative rounded-xl border ${borderClass('email')} transition-colors duration-200`}>
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                suppressHydrationWarning={true}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) validateField('email', e.target.value);
                }}
                onBlur={() => handleBlur('email')}
                placeholder="you@launchhub.ai"
                className="w-full rounded-xl bg-black/40 pl-11 pr-4 py-3 text-xs text-white focus:outline-none border-none bg-transparent"
                autoComplete="email"
              />
              {touched.email && !fieldErrors.email && email.trim() && (
                <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
              )}
            </div>
            <FieldError message={touched.email ? fieldErrors.email : undefined} />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold flex justify-between">
              Password
              <Link href="/forgot-password" className="text-emerald-400 hover:underline">Forgot?</Link>
            </label>
            <div className={`relative rounded-xl border ${borderClass('password')} transition-colors duration-200`}>
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                suppressHydrationWarning={true}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) validateField('password', e.target.value);
                }}
                onBlur={() => handleBlur('password')}
                placeholder="••••••••"
                className="w-full rounded-xl bg-black/40 pl-11 pr-12 py-3 text-xs text-white focus:outline-none border-none bg-transparent"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FieldError message={touched.password ? fieldErrors.password : undefined} />
          </div>

          <button
            suppressHydrationWarning={true}
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed py-3 text-xs font-bold text-black shadow-glow flex items-center justify-center gap-1.5 transition-all mt-6"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2">
          Don't have an account?{' '}
          <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-emerald-400 font-semibold hover:underline">
            Register one free
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
