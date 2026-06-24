'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mail, Lock, User, UserPlus, AlertCircle, CheckCircle2, Eye, EyeOff, Info } from 'lucide-react';
import { authApi } from '../../lib/api';

// ─── Validation rules (aligned with backend Pydantic model) ──
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const NAME_REGEX = /^[a-zA-Z\s\-'.]+$/;

interface FieldErrors {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
}

function validateFullName(v: string): string | undefined {
  const trimmed = v.trim();
  if (!trimmed) return 'Full name is required.';
  if (trimmed.length < 2) return 'Full name must be at least 2 characters.';
  if (trimmed.length > 100) return 'Full name must be 100 characters or less.';
  if (!NAME_REGEX.test(trimmed)) return 'Only letters, spaces, hyphens, and apostrophes allowed.';
  return undefined;
}

function validateUsername(v: string): string | undefined {
  const trimmed = v.trim();
  if (!trimmed) return 'Username is required.';
  if (trimmed.length < 3) return 'Username must be at least 3 characters.';
  if (trimmed.length > 30) return 'Username must be 30 characters or less.';
  if (!USERNAME_REGEX.test(trimmed)) return 'Only letters, numbers, and underscores allowed.';
  if (trimmed.startsWith('_')) return 'Username cannot start with an underscore.';
  return undefined;
}

function validateEmail(v: string): string | undefined {
  const trimmed = v.trim();
  if (!trimmed) return 'Email is required.';
  if (trimmed.length > 254) return 'Email is too long.';
  if (!EMAIL_REGEX.test(trimmed)) return 'Please enter a valid email address.';
  return undefined;
}

function validatePassword(v: string): string | undefined {
  if (!v) return 'Password is required.';
  if (v.length < 8) return 'Password must be at least 8 characters.';
  if (v.length > 128) return 'Password must be 128 characters or less.';
  if (!/[A-Z]/.test(v)) return 'Must contain at least one uppercase letter.';
  if (!/[a-z]/.test(v)) return 'Must contain at least one lowercase letter.';
  if (!/\d/.test(v)) return 'Must contain at least one number.';
  if (!/[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;'/~`]/.test(v)) return 'Must contain at least one special character.';
  return undefined;
}

// ─── Password strength calculator ─────────────────────────
interface PasswordStrength {
  score: number; // 0-5
  label: string;
  color: string;
  checks: { label: string; passed: boolean }[];
}

function getPasswordStrength(password: string): PasswordStrength {
  const checks = [
    { label: '8+ characters', passed: password.length >= 8 },
    { label: 'Uppercase letter', passed: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', passed: /[a-z]/.test(password) },
    { label: 'Number', passed: /\d/.test(password) },
    { label: 'Special character', passed: /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;'/~`]/.test(password) },
  ];
  const score = checks.filter((c) => c.passed).length;

  const labels: Record<number, { label: string; color: string }> = {
    0: { label: 'Very weak', color: 'bg-red-500' },
    1: { label: 'Weak', color: 'bg-red-500' },
    2: { label: 'Fair', color: 'bg-orange-500' },
    3: { label: 'Good', color: 'bg-yellow-500' },
    4: { label: 'Strong', color: 'bg-emerald-400' },
    5: { label: 'Excellent', color: 'bg-emerald-500' },
  };

  const info = labels[score] || labels[0];
  return { score, label: info.label, color: info.color, checks };
}

// ─── Reusable inline error ────────────────────────────────
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

// ─── Password strength bar ────────────────────────────────
function PasswordStrengthBar({ password }: { password: string }) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2 space-y-2"
    >
      {/* Bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: i <= strength.score ? '100%' : '0%' }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`h-full rounded-full ${i <= strength.score ? strength.color : ''}`}
            />
          </div>
        ))}
      </div>
      <p className={`text-[10px] font-medium ${
        strength.score <= 1 ? 'text-red-400' :
        strength.score <= 2 ? 'text-orange-400' :
        strength.score <= 3 ? 'text-yellow-400' :
        'text-emerald-400'
      }`}>
        {strength.label}
      </p>

      {/* Checklist */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {strength.checks.map((check) => (
          <div key={check.label} className="flex items-center gap-1.5">
            {check.passed ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            ) : (
              <div className="h-3 w-3 rounded-full border border-slate-600" />
            )}
            <span className={`text-[10px] ${check.passed ? 'text-slate-300' : 'text-slate-500'}`}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main register component ──────────────────────────────
function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirect, setRedirect] = useState('/dashboard');

  useEffect(() => {
    const r = searchParams.get('redirect') || '/dashboard';
    setRedirect(r);
  }, [searchParams]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('founder');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const getFieldValue = useCallback((field: keyof FieldErrors) => {
    switch (field) {
      case 'fullName': return fullName;
      case 'username': return username;
      case 'email': return email;
      case 'password': return password;
    }
  }, [fullName, username, email, password]);

  const validateField = useCallback((field: keyof FieldErrors, value: string) => {
    let error: string | undefined;
    switch (field) {
      case 'fullName':  error = validateFullName(value); break;
      case 'username':  error = validateUsername(value); break;
      case 'email':     error = validateEmail(value); break;
      case 'password':  error = validatePassword(value); break;
    }
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
    return error;
  }, []);

  const handleBlur = useCallback((field: keyof FieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, getFieldValue(field));
  }, [getFieldValue, validateField]);

  const validateAll = (): boolean => {
    const errors: FieldErrors = {
      fullName: validateFullName(fullName),
      username: validateUsername(username),
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setFieldErrors(errors);
    setTouched({ fullName: true, username: true, email: true, password: true });
    return !errors.fullName && !errors.username && !errors.email && !errors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validateAll()) return;

    setLoading(true);
    try {
      await authApi.register({
        fullName: fullName.trim(),
        email: email.trim(),
        username: username.trim(),
        password,
        role,
      });

      const loginRes = await authApi.login({ email: email.trim(), password });
      if (loginRes.access_token) {
        localStorage.setItem('launchhub_token', loginRes.access_token);
        router.push(redirect as any);
      }
    } catch (err: any) {
      setServerError(err.message || 'Registration failed. Try a different username/email.');
    } finally {
      setLoading(false);
    }
  };

  const borderClass = (field: keyof FieldErrors) => {
    if (!touched[field]) return 'border-border/60 focus-within:border-emerald-500/50';
    if (fieldErrors[field]) return 'border-red-500/50 focus-within:border-red-500/70';
    return 'border-emerald-500/40 focus-within:border-emerald-500/60';
  };

  const showCheck = (field: keyof FieldErrors) =>
    touched[field] && !fieldErrors[field] && getFieldValue(field).trim();

  return (
    <main className="relative min-h-screen w-full bg-bg grid-bg flex items-center justify-center p-6">
      {/* Glow */}
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[400px] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border bg-surface-card p-8 space-y-6 shadow-glass"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-black font-extrabold shadow-glow text-lg mx-auto">
            L
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Create Account</h2>
          <p className="text-xs text-slate-400">
            Join the LaunchHub ecosystem and exchange startup assets.
          </p>
        </div>

        {/* Server error banner */}
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
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold">Full name</label>
            <div className={`relative rounded-xl border ${borderClass('fullName')} transition-colors duration-200`}>
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                suppressHydrationWarning={true}
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (touched.fullName) validateField('fullName', e.target.value);
                }}
                onBlur={() => handleBlur('fullName')}
                placeholder="Aditi Sharma"
                className="w-full rounded-xl bg-black/40 pl-11 pr-10 py-3 text-xs text-white focus:outline-none border-none bg-transparent"
                autoComplete="name"
              />
              {showCheck('fullName') && (
                <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
              )}
            </div>
            <FieldError message={touched.fullName ? fieldErrors.fullName : undefined} />
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold">Username</label>
            <div className={`relative rounded-xl border ${borderClass('username')} transition-colors duration-200`}>
              <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                suppressHydrationWarning={true}
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (touched.username) validateField('username', e.target.value);
                }}
                onBlur={() => handleBlur('username')}
                placeholder="aditisharma"
                className="w-full rounded-xl bg-black/40 pl-11 pr-10 py-3 text-xs text-white focus:outline-none border-none bg-transparent"
                autoComplete="username"
              />
              {showCheck('username') && (
                <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
              )}
            </div>
            <FieldError message={touched.username ? fieldErrors.username : undefined} />
            {!touched.username && (
              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                <Info className="h-3 w-3" /> Letters, numbers, underscores only. 3-30 characters.
              </p>
            )}
          </div>

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
                placeholder="aditi@launchhub.ai"
                className="w-full rounded-xl bg-black/40 pl-11 pr-10 py-3 text-xs text-white focus:outline-none border-none bg-transparent"
                autoComplete="email"
              />
              {showCheck('email') && (
                <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
              )}
            </div>
            <FieldError message={touched.email ? fieldErrors.email : undefined} />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold">Password</label>
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
                autoComplete="new-password"
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
            <PasswordStrengthBar password={password} />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold">Select Primary Role</label>
            <select
              suppressHydrationWarning={true}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-black/40 px-4 py-3 text-xs text-slate-400 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="founder">Founder (Build and Scale)</option>
              <option value="investor">Investor (Acquire Equity/Provide Funds)</option>
              <option value="seller">Seller (List Domains, SaaS, Apps)</option>
              <option value="agency">Agency / Freelancer (Deliver Services)</option>
            </select>
          </div>

          <button
            suppressHydrationWarning={true}
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed py-3 text-xs font-bold text-black shadow-glow flex items-center justify-center gap-1.5 transition-all mt-6"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2">
          Already have an account?{' '}
          <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-emerald-400 font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
