'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, Award, FileText, ArrowLeft, ArrowRight, CheckCircle2, 
  AlertCircle, Sparkles, Github, Mail, Check, AlertTriangle, ShieldAlert, Globe
} from 'lucide-react';
import { verificationApi, authApi } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function VerificationPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // Connections mock state
  const [googleConnected, setGoogleConnected] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true);
  
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  // ID verification submission state
  const [govId, setGovId] = useState('https://storage.launchhub.ai/government-id-sample.png');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [level, setLevel] = useState(2);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Calculate dynamic trust score
  const baseScore = user ? user.trustScore : 60;
  const googleBonus = googleConnected ? 15 : 0;
  const githubBonus = githubConnected ? 15 : 0;
  const computedTrustScore = Math.min(100, baseScore + googleBonus + githubBonus);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await authApi.me();
      setUser(data);
      if (data.portfolio && data.portfolio.length > 0) {
        setPortfolioUrl(data.portfolio[0]);
      }
    } catch (err) {
      console.error(err);
      router.push('/dashboard');
    }
  };

  const handleConnectGoogle = () => {
    if (googleConnected) return;
    setGoogleLoading(true);
    setTimeout(() => {
      setGoogleConnected(true);
      setGoogleLoading(false);
    }, 1500);
  };

  const handleConnectGithub = () => {
    if (githubConnected) return;
    setGithubLoading(true);
    setTimeout(() => {
      setGithubConnected(true);
      setGithubLoading(false);
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verificationApi.submitVerification({
        govIdUrl: govId,
        portfolioUrl,
        levelRequested: Number(level)
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
      </div>
    );
  }

  // Verification Level badges config
  const levelsInfo = [
    { lvl: 1, title: 'Verified User', desc: 'Base level verification (+10 Trust Score)' },
    { lvl: 2, title: 'Verified Founder', desc: 'Allows launching startups & workspaces (+20 Trust)' },
    { lvl: 3, title: 'Verified Seller', desc: 'Enables listing domains & SaaS codebases (+30 Trust)' },
    { lvl: 4, title: 'Verified Investor', desc: 'Allows expressing investment interest & bidding (+40 Trust)' },
    { lvl: 5, title: 'Verified Agency', desc: 'Represents verified agency / development guild (+50 Trust)' }
  ];

  return (
    <main className="relative min-h-screen w-full bg-bg grid-bg flex items-center justify-center p-6 pb-20">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/3 h-[400px] w-[500px] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 h-[300px] w-[300px] bg-[radial-gradient(circle_at_center,rgba(255,153,51,0.03),transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl rounded-2xl border border-border bg-surface-card p-8 space-y-8 shadow-glass"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <button onClick={() => router.push('/dashboard')} className="group rounded-xl border border-border bg-slate-900 p-2 text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            LaunchHub Identity & Trust Verification
          </h2>
        </div>

        {/* Trust Score & Level Status Info */}
        <div className="grid gap-6 sm:grid-cols-2">
          
          {/* Trust Meter Box */}
          <div className="rounded-xl border border-border/60 bg-black/40 p-5 flex flex-col justify-center items-center text-center space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Computed Trust Score</span>
            <div className="relative flex items-center justify-center">
              {/* Circular Gauge Arc */}
              <div className="text-3xl font-extrabold text-emerald-400">{computedTrustScore}%</div>
            </div>
            <p className="text-[10px] text-slate-400">Higher trust score unlocks fast-track escrow approvals.</p>
          </div>

          {/* Level Badges Box */}
          <div className="rounded-xl border border-border/60 bg-black/40 p-5 space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Active Badge Tier</span>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Award className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-white text-xs">Level {user.verificationLevel} Badged</h4>
                <p className="text-[10px] text-slate-400">
                  {levelsInfo.find(l => l.lvl === user.verificationLevel)?.title || 'Unverified User'}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* OAuth & Social Connections Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Connected Credentials (Phase 10)
          </h3>
          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            
            {/* Email verification status */}
            <div className="rounded-xl border border-border/60 bg-slate-900/60 p-4 flex flex-col justify-between h-[100px]">
              <div className="flex justify-between items-start">
                <Mail className="h-5 w-5 text-slate-400" />
                <span className="bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] text-emerald-400 uppercase font-semibold">Verified</span>
              </div>
              <div>
                <p className="font-bold text-white text-[10px]">Email Address</p>
                <p className="text-[9px] text-slate-500 mt-0.5 truncate">{user.email}</p>
              </div>
            </div>

            {/* Google connection toggle */}
            <button 
              onClick={handleConnectGoogle}
              disabled={googleConnected || googleLoading}
              className={`rounded-xl border p-4 flex flex-col justify-between h-[100px] text-left transition-all ${googleConnected ? 'border-emerald-500/20 bg-emerald-500/5 cursor-default' : 'border-border/60 bg-slate-900/60 hover:border-slate-800'}`}
            >
              <div className="flex justify-between items-start w-full">
                <Globe className={`h-5 w-5 ${googleConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
                {googleConnected ? (
                  <span className="bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] text-emerald-400 uppercase font-semibold flex items-center gap-0.5">
                    <Check className="h-2 w-2" /> Linked
                  </span>
                ) : (
                  <span className="bg-slate-800 border border-border px-1.5 py-0.5 rounded text-[8px] text-slate-400 uppercase font-semibold">
                    {googleLoading ? 'Loading...' : '+15 Trust'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-bold text-white text-[10px]">Google Account</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{googleConnected ? 'Connected' : 'Bind Account'}</p>
              </div>
            </button>

            {/* GitHub connection toggle */}
            <button 
              onClick={handleConnectGithub}
              disabled={githubConnected || githubLoading}
              className={`rounded-xl border p-4 flex flex-col justify-between h-[100px] text-left transition-all ${githubConnected ? 'border-emerald-500/20 bg-emerald-500/5 cursor-default' : 'border-border/60 bg-slate-900/60 hover:border-slate-800'}`}
            >
              <div className="flex justify-between items-start w-full">
                <Github className={`h-5 w-5 ${githubConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
                {githubConnected ? (
                  <span className="bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] text-emerald-400 uppercase font-semibold flex items-center gap-0.5">
                    <Check className="h-2 w-2" /> Linked
                  </span>
                ) : (
                  <span className="bg-slate-800 border border-border px-1.5 py-0.5 rounded text-[8px] text-slate-400 uppercase font-semibold">
                    {githubLoading ? 'Loading...' : '+15 Trust'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-bold text-white text-[10px]">GitHub Account</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{githubConnected ? 'Connected' : 'Bind Account'}</p>
              </div>
            </button>

          </div>
        </div>

        {/* Main Verification Form */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Submit Identity Documents
          </h3>
          
          {success ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 space-y-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm">Submission Complete</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your identity verification request has been successfully filed. Return to the dashboard and switch to the **Admin Review** tab to approve/reject this request and level-up your account!
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-xs font-bold text-black shadow-glow"
              >
                Go to Dashboard Console
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Government ID URL / Path</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={govId}
                      onChange={(e) => setGovId(e.target.value)}
                      placeholder="Link to Gov ID picture..."
                      className="w-full rounded-xl border border-border/60 bg-black/40 pl-11 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold">Portfolio URL (GitHub/Website)</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full rounded-xl border border-border/60 bg-black/40 pl-11 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold">Requested Trust Level Upgrade</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                  className="w-full rounded-xl border border-border/60 bg-black/40 px-4 py-3 text-slate-400 focus:outline-none focus:border-emerald-500/50"
                >
                  {levelsInfo.map((info) => (
                    <option key={info.lvl} value={info.lvl}>
                      Level {info.lvl}: {info.title} — {info.desc}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-xs font-bold text-black shadow-glow flex items-center justify-center gap-1.5 transition-all mt-6"
              >
                {loading ? 'Submitting ID...' : 'Submit Verification'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </main>
  );
}
