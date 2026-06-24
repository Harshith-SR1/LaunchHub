'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, ShieldCheck, Award, TrendingUp, Users, DollarSign, 
  ChevronRight, Check, X, MessageSquare, AlertCircle, LogOut, ArrowRight, Briefcase, Star, Clock, Shield, FileText
} from 'lucide-react';
import { authApi, verificationApi, messagingApi, workspacesApi } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [roleTab, setRoleTab] = useState('founder');
  const [loading, setLoading] = useState(true);
  const [verifyStatus, setVerifyStatus] = useState<any>(null);
  
  // Workspaces list
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  // Admin state
  const [adminRequests, setAdminRequests] = useState<any[]>([]);
  const [adminMessage, setAdminMessage] = useState('');

  // Messaging preview state
  const [conversations, setConversations] = useState<any[]>([]);

  // Freelancer mock workspace join
  const [joinWsId, setJoinWsId] = useState('');
  const [joinStatus, setJoinStatus] = useState('');

  useEffect(() => {
    initDashboard();
  }, []);

  const initDashboard = async () => {
    setLoading(true);
    try {
      let token = localStorage.getItem('launchhub_token');
      
      const seedAndLogin = async () => {
        const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
        const mockEmail = `aditi.sharma.${uniqueSuffix}@launchhub.ai`;
        const mockUsername = `aditisharma_${uniqueSuffix}`;
        await authApi.register({
          email: mockEmail,
          username: mockUsername,
          fullName: 'Aditi Sharma',
          password: 'LaunchHub@2024',
          role: 'founder'
        });
        const loginRes = await authApi.login({
          email: mockEmail,
          password: 'LaunchHub@2024'
        });
        localStorage.setItem('launchhub_token', loginRes.access_token);
        return loginRes.access_token;
      };

      if (!token) {
        token = await seedAndLogin();
      }

      // Fetch Profile
      let profile;
      try {
        profile = await authApi.me();
      } catch (meError) {
        console.log("Session token invalid or expired. Re-seeding mock session...");
        localStorage.removeItem('launchhub_token');
        token = await seedAndLogin();
        profile = await authApi.me();
      }

      setUser(profile);
      setRoleTab(profile.role || 'founder');

      // Fetch Verification Status
      const verify = await verificationApi.getStatus();
      setVerifyStatus(verify);

      // Fetch chats
      const chats = await messagingApi.getConversations();
      setConversations(chats || []);

      // Fetch Workspaces
      const wsData = await workspacesApi.listWorkspaces();
      setWorkspaces(wsData || []);

      // Admin requests fetch
      if (profile.role === 'admin' || profile.verificationLevel >= 0) {
        const allVerifyRes = await fetch('http://127.0.0.1:8000/api/v1/verification/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const vReqs = await allVerifyRes.json();
        if (!vReqs.pendingRequest) {
          await verificationApi.submitVerification({
            govIdUrl: 'https://storage.launchhub.ai/gov-id-mock.png',
            portfolioUrl: 'https://github.com/jane-founder',
            levelRequested: 3
          });
          const updatedVerify = await verificationApi.getStatus();
          setVerifyStatus(updatedVerify);
          setAdminRequests([updatedVerify.pendingRequest]);
        } else {
          setAdminRequests([vReqs.pendingRequest]);
        }
      }

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminReview = async (userId: string, approve: boolean) => {
    setAdminMessage('');
    try {
      const res = await verificationApi.adminReview(userId, { approve, rejectionReason: 'Documents verified' });
      setAdminMessage(res.message);
      initDashboard();
    } catch (err: any) {
      setAdminMessage(err.message || 'Review action failed.');
    }
  };

  const handleJoinWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinWsId.trim()) return;
    setJoinStatus('sending');
    setTimeout(() => {
      setJoinStatus('success');
      setJoinWsId('');
      // Refresh workspaces
      setTimeout(() => setJoinStatus(''), 3000);
    }, 1200);
  };

  const handleLogout = () => {
    localStorage.removeItem('launchhub_token');
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen w-full bg-bg grid-bg pb-24">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 h-[350px] w-[500px] bg-[radial-gradient(ellipse_50%_50%_at_top,rgba(16,185,129,0.06),transparent_70%)] pointer-events-none" />

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-10 space-y-8">
        
        {/* Top Header Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              LaunchHub Command Center
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-xs text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Level {user.verificationLevel} Verified
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Founder Profile: <span className="font-semibold text-slate-200">{user.fullName}</span> (@{user.username}) • Trust Score: <span className="text-emerald-400 font-bold">{user.trustScore}%</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a href="/navigator" className="rounded-xl border border-border bg-surface-card px-4 py-2 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors">
              <Sparkles className="h-4 w-4 text-emerald-400" /> Venture Navigator
            </a>
            <a href="/blueprint" className="rounded-xl border border-border bg-surface-card px-4 py-2 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors">
              Startup Yantra
            </a>
            <a href="/verification" className="rounded-xl border border-border bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-400 flex items-center gap-1.5 transition-colors">
              <Shield className="h-4 w-4" /> Verify Identity
            </a>
            <button onClick={handleLogout} className="rounded-xl bg-slate-900 border border-border p-2 text-slate-400 hover:text-red-400 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Dashboards Roles Switcher */}
        <div className="grid gap-8 lg:grid-cols-4">
          
          {/* Left Console Navigation list */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-border bg-surface-card overflow-hidden shadow-glass">
              <div className="p-4 border-b border-border/40 bg-black/20 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Select Operating View
              </div>
              <div className="divide-y divide-border/40 text-xs font-semibold">
                <button 
                  onClick={() => setRoleTab('founder')} 
                  className={`w-full text-left px-4 py-3.5 flex items-center justify-between transition-colors ${roleTab === 'founder' ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                >
                  <span className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Founder OS</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => setRoleTab('freelancer')} 
                  className={`w-full text-left px-4 py-3.5 flex items-center justify-between transition-colors ${roleTab === 'freelancer' ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                >
                  <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Freelancer Hub</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => setRoleTab('investor')} 
                  className={`w-full text-left px-4 py-3.5 flex items-center justify-between transition-colors ${roleTab === 'investor' ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                >
                  <span className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Investor Dealroom</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => setRoleTab('seller')} 
                  className={`w-full text-left px-4 py-3.5 flex items-center justify-between transition-colors ${roleTab === 'seller' ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                >
                  <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Seller Exchange</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => setRoleTab('dataset_seller')} 
                  className={`w-full text-left px-4 py-3.5 flex items-center justify-between transition-colors ${roleTab === 'dataset_seller' ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                >
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Dataset Seller Console</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => setRoleTab('model_creator')} 
                  className={`w-full text-left px-4 py-3.5 flex items-center justify-between transition-colors ${roleTab === 'model_creator' ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                >
                  <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-400" /> Model Creator Console</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => setRoleTab('admin')} 
                  className={`w-full text-left px-4 py-3.5 flex items-center justify-between transition-colors ${roleTab === 'admin' ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                >
                  <span className="flex items-center gap-2"><Award className="h-4 w-4" /> Admin Review</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Badging Panel */}
            <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Trust Indicators
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">KYC Status</span>
                  <span className="font-semibold text-emerald-400">Verified</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Auth Tier</span>
                  <span className="font-semibold text-white">Level {user.verificationLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Escrow Audits</span>
                  <span className="font-semibold text-white">Passed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Role-specific Dashboard Panel */}
          <div className="lg:col-span-3 space-y-6">
            <AnimatePresence mode="wait">
              
              {/* FOUNDER OS TAB */}
              {roleTab === 'founder' && (
                <motion.div
                  key="founder"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Top stats */}
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-2 shadow-glass">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Startups Managed</span>
                      <p className="text-3xl font-extrabold text-white">{workspaces.length}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-2 shadow-glass">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Execution Index</span>
                      <p className="text-3xl font-extrabold text-emerald-400">87%</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-2 shadow-glass">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Hires Sourced</span>
                      <p className="text-3xl font-extrabold text-white">3</p>
                    </div>
                  </div>

                  {/* Active workspaces checklist */}
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-bold text-white">Active Startup Workspaces</h3>
                      <a href="/blueprint" className="rounded-xl border border-border bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white font-bold transition-all">
                        + Assemble Startup
                      </a>
                    </div>

                    <div className="space-y-4">
                      {workspaces.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No startup workspaces deployed. Generate one via Startup Yantra.</p>
                      ) : (
                        workspaces.map((ws: any) => {
                          const total = ws.tasks?.length || 0;
                          const completed = ws.tasks?.filter((t: any) => t.status === 'completed').length || 0;
                          const pct = total > 0 ? Math.round((completed / total) * 100) : 100;
                          return (
                            <div key={ws.id} className="rounded-xl border border-border/60 bg-black/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-slate-800 transition-all">
                              <div className="space-y-2 text-xs flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-white text-sm">{ws.name}</span>
                                  <span className="bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded text-emerald-400 font-bold text-[9px]">
                                    {ws.stage}
                                  </span>
                                </div>
                                <p className="text-slate-400 line-clamp-1">{ws.ideaSummary}</p>
                                
                                {/* Progress Bar */}
                                <div className="space-y-1 pt-1">
                                  <div className="flex justify-between text-[10px] text-slate-500">
                                    <span>Task Checklist</span>
                                    <span>{pct}% ({completed}/{total})</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right text-xs">
                                  <span className="text-slate-500 font-bold">HEALTH</span>
                                  <p className="text-sm font-extrabold text-emerald-400 mt-0.5">{ws.healthScore}%</p>
                                </div>
                                <button 
                                  onClick={() => router.push(`/dashboard/workspaces/${ws.id}`)}
                                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-bold text-black shadow-glow flex items-center gap-1 transition-all"
                                >
                                  Enter Workspace <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* FREELANCER HUB TAB */}
              {roleTab === 'freelancer' && (
                <motion.div
                  key="freelancer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Freelancer metrics */}
                  <div className="grid gap-6 sm:grid-cols-4 text-xs">
                    <div className="rounded-2xl border border-border bg-surface-card p-5 space-y-2 shadow-glass">
                      <span className="text-slate-500 font-bold uppercase">Reputation Score</span>
                      <p className="text-2xl font-extrabold text-white flex items-center gap-1">
                        96% <Star className="h-4 w-4 fill-saffron-400 text-saffron-400" />
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-card p-5 space-y-2 shadow-glass">
                      <span className="text-slate-500 font-bold uppercase">Success Index</span>
                      <p className="text-2xl font-extrabold text-emerald-400">94%</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-card p-5 space-y-2 shadow-glass">
                      <span className="text-slate-500 font-bold uppercase">Active Projects</span>
                      <p className="text-2xl font-extrabold text-white">2</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-card p-5 space-y-2 shadow-glass">
                      <span className="text-slate-500 font-bold uppercase">Runway Earnings</span>
                      <p className="text-2xl font-extrabold text-saffron-400">$4,200</p>
                    </div>
                  </div>

                  {/* Active Deliverables & Milestones */}
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <h3 className="text-base font-bold text-white">Projects & Tasks</h3>
                    <div className="space-y-3 text-xs">
                      <div className="p-4 rounded-xl border border-border bg-black/40 flex justify-between items-center gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-white">Mediscan AI Telehealth Front-end</h4>
                          <p className="text-slate-400">Task: Integrate clinical intake panel widgets</p>
                        </div>
                        <div className="text-right space-y-1.5">
                          <span className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-bold text-[9px]">
                            $1,200 Escrowed
                          </span>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3" /> Due June 18
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-border bg-black/40 flex justify-between items-center gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-white">CropVision Mobile Map Dashboard</h4>
                          <p className="text-slate-400">Task: Configure WebGL canvas moisture overlays</p>
                        </div>
                        <div className="text-right space-y-1.5">
                          <span className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-bold text-[9px]">
                            $800 Escrowed
                          </span>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3" /> Due June 25
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Join workspace request form */}
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <h3 className="text-base font-bold text-white">Join Active Startup Workspace</h3>
                    <p className="text-xs text-slate-400 leading-normal">
                      Have you been hired by a founder? Enter the active startup workspace ID below to align with their tasks, documents, and timelines.
                    </p>
                    <form onSubmit={handleJoinWorkspace} className="flex gap-3 text-xs">
                      <input 
                        type="text"
                        required
                        value={joinWsId}
                        onChange={(e) => setJoinWsId(e.target.value)}
                        placeholder="Enter Workspace ID (e.g. mediscan-ai)..."
                        className="flex-1 rounded-xl border border-border/60 bg-black/40 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                      />
                      <button 
                        type="submit"
                        disabled={joinStatus === 'sending'}
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-black shadow-glow flex items-center justify-center gap-1.5 transition-all"
                      >
                        {joinStatus === 'sending' ? 'Joining...' : 'Submit Request'}
                      </button>
                    </form>
                    {joinStatus === 'success' && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
                        <Check className="h-4 w-4" /> Workspace linked! You can now participate in their task boards.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* INVESTOR DEALROOM TAB */}
              {roleTab === 'investor' && (
                <motion.div
                  key="investor"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Stats */}
                  <div className="grid gap-6 sm:grid-cols-3 text-xs">
                    <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-2 shadow-glass">
                      <span className="text-slate-500 font-bold uppercase">Active Portfolios</span>
                      <p className="text-3xl font-extrabold text-white">3</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-2 shadow-glass">
                      <span className="text-slate-500 font-bold uppercase">Allocated Capital</span>
                      <p className="text-3xl font-extrabold text-white">$120,000</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-2 shadow-glass">
                      <span className="text-slate-500 font-bold uppercase">Avg Portfolio Health</span>
                      <p className="text-3xl font-extrabold text-emerald-400">91%</p>
                    </div>
                  </div>

                  {/* Portfolio Watchlist & Matchmaker */}
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <h3 className="text-base font-bold text-white">Smart Match Deal Flow</h3>
                    
                    <div className="space-y-4">
                      {workspaces.map((ws: any) => {
                        const datasetCount = ws.aiAssets?.datasets?.length || 0;
                        const modelCount = ws.aiAssets?.models?.length || 0;
                        const agentCount = ws.aiAssets?.agents?.length || 0;
                        const hasAiStack = datasetCount > 0 || modelCount > 0 || agentCount > 0;
                        
                        // Competitive advantage calculation
                        let advantageStr = "Standard API Integration";
                        let advantageColor = "text-slate-400 bg-slate-500/10 border-slate-500/20";
                        if (datasetCount > 0 && modelCount > 0) {
                          advantageStr = "Proprietary Data & Custom ML Moat";
                          advantageColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                        } else if (datasetCount > 0) {
                          advantageStr = "Proprietary Data Moat";
                          advantageColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
                        } else if (modelCount > 0) {
                          advantageStr = "Custom ML Framework Moat";
                          advantageColor = "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
                        }
                        
                        return (
                          <div key={ws.id} className="rounded-xl border border-border/60 bg-black/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-slate-800 transition-all">
                            <div className="space-y-3 text-xs flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-white text-sm">{ws.name}</span>
                                <span className="bg-saffron-500/10 border border-saffron-500/20 px-2 py-0.5 rounded text-saffron-400 font-bold text-[9px]">
                                  {ws.funding?.stage} Phase
                                </span>
                                <span className="bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded text-indigo-400 font-bold text-[9px]">
                                  Match: 94%
                                </span>
                                <span className={`px-2 py-0.5 rounded border font-bold text-[9px] ${advantageColor}`}>
                                  {advantageStr}
                                </span>
                              </div>
                              <p className="text-slate-400 line-clamp-1">{ws.ideaSummary}</p>
                              
                              {/* Startup AI Stack Visual Display */}
                              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-border/40 space-y-2">
                                <div className="flex justify-between items-center text-[10px] text-slate-400">
                                  <span>AI STACK DEPLOYED</span>
                                  <span className="text-saffron-400 font-bold">AI Readiness: {ws.aiAssets?.aiReadinessScore || 30}/100</span>
                                </div>
                                {hasAiStack ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {ws.aiAssets?.datasets?.map((ds: any) => (
                                      <span key={ds.id} className="bg-slate-900 border border-border/60 text-[9px] px-2 py-0.5 rounded text-slate-300 font-medium">
                                        Dataset: {ds.title}
                                      </span>
                                    ))}
                                    {ws.aiAssets?.models?.map((m: any) => (
                                      <span key={m.id} className="bg-slate-900 border border-border/60 text-[9px] px-2 py-0.5 rounded text-slate-300 font-medium">
                                        Model: {m.title}
                                      </span>
                                    ))}
                                    {ws.aiAssets?.agents?.map((a: any) => (
                                      <span key={a.id} className="bg-slate-900 border border-border/60 text-[9px] px-2 py-0.5 rounded text-slate-300 font-medium">
                                        Agent: {a.title}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-500 italic">No custom ML models or datasets registered in workspace.</p>
                                )}
                              </div>
                              
                              <div className="flex gap-4 text-[10px] text-slate-500 pt-1">
                                <span>Funding Needed: **${ws.funding?.target?.toLocaleString()}**</span>
                                <span>Raised: **${ws.funding?.raised?.toLocaleString()}**</span>
                                <span>Health: <strong className="text-emerald-400">{ws.healthScore}%</strong></span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button className="rounded-xl border border-border bg-slate-900 hover:bg-slate-850 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-colors">
                                Monitor Progress
                              </button>
                              <button className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-bold text-black shadow-glow transition-all">
                                Review Deal Room
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SELLER EXCHANGE TAB */}
              {roleTab === 'seller' && (
                <motion.div
                  key="seller"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-2 shadow-glass">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Assets Listed</span>
                      <p className="text-3xl font-extrabold text-white">0</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-2 shadow-glass">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Auctions</span>
                      <p className="text-3xl font-extrabold text-white">0</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-2 shadow-glass">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Sales Volume</span>
                      <p className="text-3xl font-extrabold text-white">$0.00</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <h3 className="text-base font-bold text-white tracking-tight">Monetize Startup Assets</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      List domains, transfer SaaS codebases, export datasets, or lease automation AI agents. Setup instant payouts via our escrow protection layers.
                    </p>
                    <a href="/marketplace" className="inline-flex rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-black shadow-glow items-center gap-1">
                      Explore Listings Exchange <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </motion.div>
              )}

              {/* DATASET SELLER TAB */}
              {roleTab === 'dataset_seller' && (
                <motion.div
                  key="dataset_seller"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="grid gap-6 sm:grid-cols-4 text-xs">
                    <div className="rounded-2xl border border-border bg-surface-card p-5 space-y-2 shadow-glass">
                      <span className="text-slate-500 font-bold uppercase">Datasets Listed</span>
                      <p className="text-2xl font-extrabold text-white">4</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-card p-5 space-y-2 shadow-glass">
                      <span className="text-slate-500 font-bold uppercase">Total Downloads</span>
                      <p className="text-2xl font-extrabold text-emerald-400">14,200</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-card p-5 space-y-2 shadow-glass">
                      <span className="text-slate-500 font-bold uppercase">Active Subscribers</span>
                      <p className="text-2xl font-extrabold text-white">240</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-card p-5 space-y-2 shadow-glass">
                      <span className="text-slate-500 font-bold uppercase">Monthly Revenue</span>
                      <p className="text-2xl font-extrabold text-saffron-400">$4,850</p>
                    </div>
                  </div>

                  {/* Quality & SLA Meters */}
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <h3 className="text-base font-bold text-white">Data Quality & Host Telemetry</h3>
                    <div className="grid gap-4 sm:grid-cols-3 text-xs">
                      <div className="p-4 rounded-xl border border-border bg-black/40 text-center">
                        <span className="text-slate-500 uppercase font-bold text-[9px] block">Avg Quality Index</span>
                        <p className="text-lg font-bold text-emerald-400 mt-1">96.4%</p>
                      </div>
                      <div className="p-4 rounded-xl border border-border bg-black/40 text-center">
                        <span className="text-slate-500 uppercase font-bold text-[9px] block">SLA Availability</span>
                        <p className="text-lg font-bold text-white mt-1">99.98%</p>
                      </div>
                      <div className="p-4 rounded-xl border border-border bg-black/40 text-center">
                        <span className="text-slate-500 uppercase font-bold text-[9px] block">Compliance Audits</span>
                        <p className="text-lg font-bold text-emerald-400 mt-1">100% Pass</p>
                      </div>
                    </div>
                  </div>

                  {/* Datasets Owned List */}
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <h3 className="text-base font-bold text-white">Listed Dataset Catalogs</h3>
                    <div className="space-y-3 text-xs">
                      {[
                        { title: "100k Anonymized ECG Scans", category: "Healthcare", price: 950, downloads: 450, subs: 32, quality: 94, format: "DICOM/JSON" },
                        { title: "Crop Yield Remote Sensing Data", category: "Agriculture", price: 600, downloads: 820, subs: 45, quality: 90, format: "GeoTIFF/CSV" },
                        { title: "E-Commerce Transaction Matrices", category: "Retail", price: 400, downloads: 1200, subs: 84, quality: 92, format: "Parquet/JSON" },
                        { title: "GDPR Compliant Legal Contracts", category: "Legal", price: 750, downloads: 310, subs: 18, quality: 96, format: "PDF/TXT" }
                      ].map((ds, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-border/60 bg-black/40 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div className="space-y-1">
                            <h4 className="font-bold text-white">{ds.title}</h4>
                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                              <span>Format: <strong className="text-slate-300">{ds.format}</strong></span>
                              <span>•</span>
                              <span>Quality: <strong className="text-emerald-400">{ds.quality}%</strong></span>
                              <span>•</span>
                              <span>Category: <strong className="text-slate-300">{ds.category}</strong></span>
                            </div>
                          </div>
                          <div className="flex gap-6 text-[10px] text-right">
                            <div>
                              <span className="text-slate-500 uppercase block">Downloads</span>
                              <strong className="text-white text-xs">{ds.downloads}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 uppercase block">Subscribers</span>
                              <strong className="text-white text-xs">{ds.subs}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 uppercase block">License Price</span>
                              <strong className="text-saffron-400 text-xs">${ds.price}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* MODEL CREATOR TAB */}
              {roleTab === 'model_creator' && (
                <motion.div
                  key="model_creator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="grid gap-6 sm:grid-cols-4 text-xs">
                    <div className="rounded-2xl border border-border bg-surface-card p-5 space-y-2 shadow-glass">
                      <span className="text-slate-500 font-bold uppercase">Models Hosted</span>
                      <p className="text-2xl font-extrabold text-white">3</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-card p-5 space-y-2 shadow-glass">
                      <span className="text-slate-500 font-bold uppercase">API Calls</span>
                      <p className="text-2xl font-extrabold text-emerald-400">1.2M</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-card p-5 space-y-2 shadow-glass">
                      <span className="text-slate-500 font-bold uppercase">Licenses Sold</span>
                      <p className="text-2xl font-extrabold text-white">52</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-card p-5 space-y-2 shadow-glass">
                      <span className="text-slate-500 font-bold uppercase">Model MRR</span>
                      <p className="text-2xl font-extrabold text-saffron-400">$8,400</p>
                    </div>
                  </div>

                  {/* SLA & Inference */}
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <h3 className="text-base font-bold text-white">Inference Engine Telemetry</h3>
                    <div className="grid gap-4 sm:grid-cols-3 text-xs">
                      <div className="p-4 rounded-xl border border-border bg-black/40 text-center">
                        <span className="text-slate-500 uppercase font-bold text-[9px] block">Avg Latency</span>
                        <p className="text-lg font-bold text-emerald-400 mt-1">180 ms</p>
                      </div>
                      <div className="p-4 rounded-xl border border-border bg-black/40 text-center">
                        <span className="text-slate-500 uppercase font-bold text-[9px] block">Production Readiness</span>
                        <p className="text-lg font-bold text-white mt-1">95% Score</p>
                      </div>
                      <div className="p-4 rounded-xl border border-border bg-black/40 text-center">
                        <span className="text-slate-500 uppercase font-bold text-[9px] block">F1 Validation Avg</span>
                        <p className="text-lg font-bold text-emerald-400 mt-1">91.8% F1</p>
                      </div>
                    </div>
                  </div>

                  {/* Models List */}
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <h3 className="text-base font-bold text-white">Hosted ML Weights & Pipelines</h3>
                    <div className="space-y-3 text-xs">
                      {[
                        { title: "Lung Tumor Classification ResNet Model", framework: "PyTorch", accuracy: 0.945, price: 2800, calls: "450k", mrr: 3400 },
                        { title: "Crop Yield Forecasting LSTM", framework: "TensorFlow", accuracy: 0.925, price: 1900, calls: "320k", mrr: 2200 },
                        { title: "B2B Agritech Visual Classifier", framework: "PyTorch", accuracy: 0.895, price: 1500, calls: "430k", mrr: 2800 }
                      ].map((model, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-border/60 bg-black/40 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div className="space-y-1">
                            <h4 className="font-bold text-white">{model.title}</h4>
                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                              <span>Framework: <strong className="text-slate-300">{model.framework}</strong></span>
                              <span>•</span>
                              <span>Validation Accuracy: <strong className="text-emerald-400">{(model.accuracy * 100).toFixed(1)}%</strong></span>
                            </div>
                          </div>
                          <div className="flex gap-6 text-[10px] text-right">
                            <div>
                              <span className="text-slate-500 uppercase block">API Queries</span>
                              <strong className="text-white text-xs">{model.calls}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 uppercase block">License Price</span>
                              <strong className="text-white text-xs">${model.price}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 uppercase block">Model MRR</span>
                              <strong className="text-saffron-400 text-xs">${model.mrr}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ADMIN TAB */}
              {roleTab === 'admin' && (
                <motion.div
                  key="admin"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-bold text-white tracking-tight">Administrative Identity Approvals</h3>
                  <p className="text-xs text-slate-400">
                    Verify uploaded credentials to upgrade user Trust Scores and platform levels (0 to 5).
                  </p>

                  {adminMessage && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-400 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      {adminMessage}
                    </div>
                  )}

                  <div className="space-y-4">
                    {adminRequests.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No pending level verification requests.</p>
                    ) : (
                      adminRequests.map((req: any) => (
                        <div key={req.userId} className="rounded-2xl border border-border bg-black/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-border transition-all">
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">@{req.username}</span>
                              <span className="bg-slate-900 border border-border px-2 py-0.5 rounded text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                Requests Level {req.levelRequested}
                              </span>
                            </div>
                            <p className="text-slate-400">FullName: {req.fullName}</p>
                            <p className="text-slate-400">Gov ID Document: <a href={req.govIdUrl} target="_blank" className="text-emerald-400 underline">{req.govIdUrl}</a></p>
                            {req.portfolioUrl && <p className="text-slate-400">Portfolio: <a href={req.portfolioUrl} target="_blank" className="text-emerald-400 underline">{req.portfolioUrl}</a></p>}
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleAdminReview(req.userId, false)}
                              className="rounded-xl border border-border bg-slate-900 hover:bg-slate-850 px-4 py-2 text-xs font-bold text-red-400 flex items-center gap-1 transition-colors"
                            >
                              <X className="h-4 w-4" /> Reject
                            </button>
                            <button 
                              onClick={() => handleAdminReview(req.userId, true)}
                              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-black flex items-center gap-1 shadow-glow transition-all"
                            >
                              <Check className="h-4 w-4" /> Approve & Upgrade
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live Chats Widget */}
            <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-400" /> Active Chats
              </h3>
              <div className="space-y-3">
                {conversations.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No active conversations. Reach out to listing owners to start trading.</p>
                ) : (
                  conversations.slice(0, 3).map((c: any) => (
                    <div key={c.id} className="flex justify-between items-center p-3 rounded-xl border border-border bg-black/20 text-xs">
                      <div>
                        <p className="font-semibold text-white">Chat Room: {c.id.substring(5, 13)}...</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{c.lastMessage}</p>
                      </div>
                      <a href="/messages" className="text-emerald-400 font-bold hover:underline">Open</a>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
