'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, ShieldCheck, Check, X, MessageSquare, AlertCircle, ArrowLeft, 
  Plus, Calendar, FileText, ExternalLink, Award, TrendingUp, DollarSign, Users, Briefcase, Activity
} from 'lucide-react';
import { workspacesApi } from '../../../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI Tabs: overview, team, assets, tasks, documents, timeline, collaboration, analytics
  const [activeTab, setActiveTab] = useState('overview');

  // Input forms
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Founder');
  
  const [newComment, setNewComment] = useState('');
  
  const [newDocName, setNewDocName] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchWorkspace();
  }, [id]);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const data = await workspacesApi.getWorkspace(id);
      setWorkspace(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load workspace.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task: any) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await workspacesApi.updateTask(id, task.id, { status: nextStatus });
      // Reload details to capture updated health scores & progress
      const updated = await workspacesApi.getWorkspace(id);
      setWorkspace(updated);
    } catch (err: any) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setActionLoading(true);
    try {
      await workspacesApi.addTask(id, { title: newTaskTitle, assignee: newTaskAssignee });
      setNewTaskTitle('');
      const updated = await workspacesApi.getWorkspace(id);
      setWorkspace(updated);
    } catch (err: any) {
      console.error('Failed to add task:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setActionLoading(true);
    try {
      await workspacesApi.addComment(id, { content: newComment });
      setNewComment('');
      const updated = await workspacesApi.getWorkspace(id);
      setWorkspace(updated);
    } catch (err: any) {
      console.error('Failed to post comment:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocUrl.trim()) return;
    setActionLoading(true);
    try {
      await workspacesApi.addDocument(id, { name: newDocName, url: newDocUrl });
      setNewDocName('');
      setNewDocUrl('');
      const updated = await workspacesApi.getWorkspace(id);
      setWorkspace(updated);
    } catch (err: any) {
      console.error('Failed to add document:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <main className="flex h-screen w-full flex-col items-center justify-center bg-bg p-6 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <h2 className="text-xl font-bold text-white">Workspace Not Found</h2>
        <p className="text-sm text-slate-400">{error || 'Could not load the requested startup operating space.'}</p>
        <button onClick={() => router.push('/dashboard')} className="rounded-xl bg-slate-900 border border-border px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors">
          Return to Console
        </button>
      </main>
    );
  }

  // Get completed percentage
  const totalTasks = workspace.tasks?.length || 0;
  const completedTasks = workspace.tasks?.filter((t: any) => t.status === 'completed').length || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  return (
    <main className="relative min-h-screen w-full bg-bg grid-bg pb-24">
      {/* Sacred geometry mandala backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.04),transparent_60%)] pointer-events-none" />
      <div className="absolute top-10 right-10 h-72 w-72 rounded-full bg-gradient-to-br from-emerald-500/5 to-saffron-500/5 blur-3xl pointer-events-none" />

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-10 space-y-8">
        
        {/* Breadcrumb Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')} 
              className="group rounded-xl border border-border bg-slate-900 p-2 text-slate-400 hover:text-white transition-all hover:scale-105"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-saffron-400 bg-saffron-500/10 border border-saffron-500/20 px-2 py-0.5 rounded-md">
                Active Workspace
              </span>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
                {workspace.name}
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-xs text-emerald-400 font-bold">
                  {workspace.stage}
                </span>
              </h1>
            </div>
          </div>
          
          {/* Quick Metrics Header Block */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-xl border border-border/60 bg-black/40 px-4 py-2 text-center min-w-[90px]">
              <span className="text-[9px] font-bold text-slate-500 uppercase">Health Score</span>
              <p className="text-sm font-extrabold text-emerald-400">{workspace.healthScore}%</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-black/40 px-4 py-2 text-center min-w-[90px]">
              <span className="text-[9px] font-bold text-slate-500 uppercase">Readiness</span>
              <p className="text-sm font-extrabold text-white">{workspace.readinessScore}%</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-black/40 px-4 py-2 text-center min-w-[90px]">
              <span className="text-[9px] font-bold text-slate-500 uppercase">Funding Ready</span>
              <p className="text-sm font-extrabold text-saffron-400">{workspace.fundingReadiness}%</p>
            </div>
          </div>
        </div>

        {/* Workspace Operations Grid */}
        <div className="grid gap-8 lg:grid-cols-4">
          
          {/* Left Navigation Tabs Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-border bg-surface-card overflow-hidden shadow-glass">
              <div className="p-4 border-b border-border/40 bg-black/20 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Workspace Modules
              </div>
              <div className="divide-y divide-border/40 text-xs font-semibold">
                {[
                  { id: 'overview', label: 'Overview', icon: Briefcase },
                  { id: 'tasks', label: `Checklist (${completedTasks}/${totalTasks})`, icon: Check },
                  { id: 'team', label: 'Guild Team', icon: Users },
                  { id: 'assets', label: 'Acquired Assets', icon: Award },
                  { id: 'ai-assets', label: 'AI Assets Stack', icon: Sparkles },
                  { id: 'documents', label: 'Knowledge Base', icon: FileText },
                  { id: 'timeline', label: 'Milestone Roadmap', icon: Calendar },
                  { id: 'collaboration', label: 'Collaboration Feed', icon: MessageSquare },
                  { id: 'analytics', label: 'Execution Analytics', icon: Activity }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)} 
                      className={`w-full text-left px-4 py-3.5 flex items-center gap-2.5 transition-colors ${activeTab === tab.id ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Health System Gauge widget */}
            <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Venture Radar
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Execution Score</span>
                    <span className="text-white font-bold">{workspace.executionScore}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${workspace.executionScore}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Growth Index</span>
                    <span className="text-white font-bold">{workspace.growthScore}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${workspace.growthScore}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Risk Quotient</span>
                    <span className="text-white font-bold">{workspace.riskScore}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${workspace.riskScore}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Team Alignment</span>
                    <span className="text-white font-bold">{workspace.teamStrength}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-saffron-500 transition-all duration-500" style={{ width: `${workspace.teamStrength}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Workspace Main Panel */}
          <div className="lg:col-span-3 space-y-6">
            <AnimatePresence mode="wait">
              
              {/* OVERVIEW PANEL */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <h3 className="text-base font-bold text-white">Venture Core Blueprint</h3>
                    <div className="grid gap-6 sm:grid-cols-2 text-xs">
                      <div className="space-y-1">
                        <span className="text-slate-500 uppercase font-bold">Idea Summary</span>
                        <p className="text-slate-300 leading-relaxed">{workspace.ideaSummary}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-500 uppercase font-bold">Business Model</span>
                        <p className="text-slate-300">B2B SaaS / Custom API Licensing Model</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-500 uppercase font-bold">Cost Estimate</span>
                        <p className="text-white font-semibold">${workspace.costEstimate?.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-500 uppercase font-bold">Launch Timeline</span>
                        <p className="text-white font-semibold">{workspace.launchTimeline}</p>
                      </div>
                    </div>
                  </div>

                  {/* Execution Progress Bar */}
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <h4 className="font-bold text-white">Workspace Execution Status</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Calculated by completed setup tasks</p>
                      </div>
                      <span className="text-emerald-400 font-extrabold text-sm">{progressPercent}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  {/* Financial Status Summary */}
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <h3 className="text-base font-bold text-white">Funding Status</h3>
                    <div className="grid gap-4 sm:grid-cols-4 text-xs">
                      <div className="bg-black/30 border border-border/40 p-4 rounded-xl">
                        <span className="text-slate-500 uppercase">Capital Raised</span>
                        <p className="text-lg font-bold text-emerald-400 mt-1">${workspace.funding?.raised?.toLocaleString()}</p>
                      </div>
                      <div className="bg-black/30 border border-border/40 p-4 rounded-xl">
                        <span className="text-slate-500 uppercase">Funding Goal</span>
                        <p className="text-lg font-bold text-white mt-1">${workspace.funding?.target?.toLocaleString()}</p>
                      </div>
                      <div className="bg-black/30 border border-border/40 p-4 rounded-xl">
                        <span className="text-slate-500 uppercase">Pre-Money Val</span>
                        <p className="text-lg font-bold text-saffron-400 mt-1">${workspace.funding?.valuation?.toLocaleString()}</p>
                      </div>
                      <div className="bg-black/30 border border-border/40 p-4 rounded-xl">
                        <span className="text-slate-500 uppercase">Cap Allocation</span>
                        <p className="text-lg font-bold text-indigo-400 mt-1">100% Equity</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TASKS CHECKLIST PANEL */}
              {activeTab === 'tasks' && (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-bold text-white">Startup Checklist</h3>
                      <span className="text-xs text-slate-400">{completedTasks} of {totalTasks} tasks complete</span>
                    </div>

                    {/* Todo List */}
                    <div className="space-y-3">
                      {workspace.tasks?.map((task: any) => (
                        <div 
                          key={task.id} 
                          onClick={() => handleToggleTask(task)}
                          className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${task.status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-400' : 'bg-slate-900/60 border-border/60 text-white hover:border-slate-800'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${task.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-slate-600'}`}>
                              {task.status === 'completed' && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                            </div>
                            <span className={`text-xs ${task.status === 'completed' ? 'line-through text-slate-500' : 'font-medium'}`}>
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="bg-slate-800 border border-border px-2 py-0.5 rounded text-slate-400 font-semibold uppercase">
                              {task.assignee}
                            </span>
                            {task.dueDate && (
                              <span className="text-slate-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {task.dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Task Form */}
                    <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3 border-t border-border/40 pt-4 mt-4">
                      <input 
                        type="text"
                        required
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Add new setup task (e.g. Setup payment routes)..."
                        className="flex-1 rounded-xl border border-border/60 bg-black/40 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                      />
                      <select
                        value={newTaskAssignee}
                        onChange={(e) => setNewTaskAssignee(e.target.value)}
                        className="rounded-xl border border-border/60 bg-black/40 px-3 py-2.5 text-xs text-slate-400 focus:outline-none focus:border-emerald-500/50"
                      >
                        <option value="Founder">Assign: Founder</option>
                        <option value="AI Engineer">Assign: AI Engineer</option>
                        <option value="Developer">Assign: Developer</option>
                      </select>
                      <button 
                        type="submit"
                        disabled={actionLoading}
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-black shadow-glow flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Plus className="h-4 w-4" /> Add Task
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* TEAM MEMBERS PANEL */}
              {activeTab === 'team' && (
                <motion.div
                  key="team"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid gap-6 sm:grid-cols-3"
                >
                  {workspace.team?.map((member: any, index: number) => (
                    <div key={index} className="rounded-2xl border border-border bg-surface-card p-6 text-center space-y-4 shadow-glass">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-saffron-500 mx-auto flex items-center justify-center font-bold text-black text-sm">
                        {member.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-xs">{member.name}</h4>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">{member.role}</p>
                      </div>
                    </div>
                  ))}

                  {/* Guild match recommendation slot */}
                  <div className="rounded-2xl border border-dashed border-border/60 bg-black/20 p-6 text-center flex flex-col justify-center items-center space-y-3">
                    <Sparkles className="h-6 w-6 text-saffron-400 animate-pulse" />
                    <div className="space-y-1">
                      <h5 className="text-[11px] font-bold text-slate-200">Guild Hiring Suggestions</h5>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Based on your checklist, we recommend hiring a **Product Designer** from the Guild Network.
                      </p>
                    </div>
                    <button onClick={() => router.push('/marketplace?tab=guild')} className="rounded-xl border border-border bg-slate-900 hover:bg-slate-800 px-4 py-2 text-[10px] font-bold text-white transition-all">
                      Browse Engineers
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ACQUIRED ASSETS PANEL */}
              {activeTab === 'assets' && (
                <motion.div
                  key="assets"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid gap-6 sm:grid-cols-2"
                >
                  {workspace.assets?.map((asset: any, index: number) => (
                    <div key={index} className="rounded-2xl border border-border bg-surface-card p-6 flex justify-between items-center shadow-glass">
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          {asset.type}
                        </span>
                        <h4 className="font-bold text-white text-sm mt-1.5">{asset.name}</h4>
                      </div>
                      <span className="rounded-full bg-black/40 border border-border p-2 text-slate-400">
                        <Award className="h-4 w-4 text-emerald-400" />
                      </span>
                    </div>
                  ))}

                  {/* Acquire asset button */}
                  <div className="rounded-2xl border border-dashed border-border/60 bg-black/20 p-6 flex flex-col justify-center items-center text-center space-y-3">
                    <h5 className="text-xs font-bold text-slate-200">Need more startup modules?</h5>
                    <p className="text-[10px] text-slate-400">Acquire additional SaaS codebases, AI models, datasets, or domains instantly.</p>
                    <button onClick={() => router.push('/marketplace')} className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-[10px] font-bold text-black shadow-glow transition-all">
                      Go to Asset Exchange
                    </button>
                  </div>
                 </motion.div>
              )}

              {/* AI ASSETS TAB PANEL */}
              {activeTab === 'ai-assets' && (
                <motion.div
                  key="ai-assets"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* KPI Metrics block for AI assets */}
                  <div className="grid gap-4 sm:grid-cols-3 text-xs">
                    <div className="bg-black/30 border border-border/40 p-4 rounded-xl text-center">
                      <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider block">AI Stack Cost</span>
                      <p className="text-xl font-bold text-emerald-400 mt-1">${(workspace.aiAssets?.aiAssetCost || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-black/30 border border-border/40 p-4 rounded-xl text-center">
                      <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider block">AI Infra Cost</span>
                      <p className="text-xl font-bold text-white mt-1">${(workspace.aiAssets?.aiInfrastructureCost || 450).toLocaleString()}/mo</p>
                    </div>
                    <div className="bg-black/30 border border-border/40 p-4 rounded-xl text-center">
                      <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider block">AI Readiness Score</span>
                      <p className="text-xl font-bold text-saffron-400 mt-1">{workspace.aiAssets?.aiReadinessScore || 30}/100</p>
                    </div>
                  </div>

                  {/* Datasets block */}
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-400" />
                      Acquired Datasets
                    </h3>
                    {workspace.aiAssets?.datasets?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No datasets acquired yet. You can find pre-evaluated startup datasets in the marketplace.</p>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {workspace.aiAssets?.datasets?.map((ds: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-xl border border-border/60 bg-black/40 text-xs space-y-2">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-white text-xs">{ds.title}</h4>
                              <span className="bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded text-[9px] text-emerald-400 font-bold uppercase">
                                {ds.format || 'CSV'}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-400 text-[10px]">
                              <span>License Cost: <strong className="text-white">${ds.price}</strong></span>
                              {ds.qualityScore && <span>Data Quality: <strong className="text-emerald-400">{ds.qualityScore}%</strong></span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ML Models block */}
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Acquired ML Models
                    </h3>
                    {workspace.aiAssets?.models?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No ML models acquired yet. Explore ready-to-deploy frameworks in the marketplace.</p>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {workspace.aiAssets?.models?.map((model: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-xl border border-border/60 bg-black/40 text-xs space-y-2">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-white text-xs">{model.title}</h4>
                              <span className="bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded text-[9px] text-amber-400 font-bold uppercase">
                                {model.framework || 'PyTorch'}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-400 text-[10px]">
                              <span>License Cost: <strong className="text-white">${model.price}</strong></span>
                              {model.accuracy && <span>Validation Acc: <strong className="text-emerald-400">{(model.accuracy * 100).toFixed(1)}%</strong></span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI Agents block */}
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      Acquired AI Agents
                    </h3>
                    {workspace.aiAssets?.agents?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No AI Agents active in this workspace.</p>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {workspace.aiAssets?.agents?.map((agent: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-xl border border-border/60 bg-black/40 text-xs space-y-2">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-white text-xs">{agent.title}</h4>
                              <span className="bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded text-[9px] text-blue-400 font-bold uppercase">
                                Active
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-400 text-[10px]">
                              <span>License Billed: <strong className="text-white">${agent.price}/mo</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* DOCUMENTS (KNOWLEDGE BASE) PANEL */}
              {activeTab === 'documents' && (
                <motion.div
                  key="documents"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <h3 className="text-base font-bold text-white">Startup Knowledge Base</h3>

                    {/* Docs List */}
                    <div className="space-y-3">
                      {workspace.documents?.map((doc: any) => (
                        <div key={doc.id} className="flex justify-between items-center p-3 rounded-xl border border-border bg-black/20 text-xs">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-emerald-400" />
                            <div>
                              <p className="font-semibold text-white">{doc.name}</p>
                              <p className="text-[9px] text-slate-500 mt-0.5">{doc.url}</p>
                            </div>
                          </div>
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="rounded-lg border border-border p-2 text-slate-400 hover:text-white transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      ))}
                    </div>

                    {/* Add Document Form */}
                    <form onSubmit={handleAddDocument} className="flex flex-col sm:flex-row gap-3 border-t border-border/40 pt-4 mt-4">
                      <input 
                        type="text"
                        required
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        placeholder="Document Name (e.g. API Docs)..."
                        className="flex-1 rounded-xl border border-border/60 bg-black/40 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                      />
                      <input 
                        type="url"
                        required
                        value={newDocUrl}
                        onChange={(e) => setNewDocUrl(e.target.value)}
                        placeholder="Document URL (https://...)..."
                        className="flex-1 rounded-xl border border-border/60 bg-black/40 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                      />
                      <button 
                        type="submit"
                        disabled={actionLoading}
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-black shadow-glow flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Plus className="h-4 w-4" /> Add Link
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* TIMELINE & MILESTONES PANEL */}
              {activeTab === 'timeline' && (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-border bg-surface-card p-6 space-y-6 shadow-glass"
                >
                  <h3 className="text-base font-bold text-white">Yantra Milestone Roadmap</h3>

                  {/* Vertical Timeline */}
                  <div className="relative pl-6 border-l border-border/60 space-y-8 ml-3 text-xs">
                    {workspace.milestones?.map((milestone: any, index: number) => (
                      <div key={index} className="relative">
                        {/* Bullet Icon */}
                        <div className={`absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center bg-bg transition-colors ${milestone.status === 'completed' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-900 text-slate-500'}`}>
                          {milestone.status === 'completed' && <Check className="h-2 w-2 stroke-[4]" />}
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className={`font-bold ${milestone.status === 'completed' ? 'text-white' : 'text-slate-400'}`}>
                            Step {milestone.step}: {milestone.title}
                          </h4>
                          <span className={`text-[10px] font-semibold uppercase ${milestone.status === 'completed' ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {milestone.status === 'completed' ? 'Verified Done' : 'In Backlog'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* COLLABORATION FEED PANEL */}
              {activeTab === 'collaboration' && (
                <motion.div
                  key="collaboration"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass">
                    <h3 className="text-base font-bold text-white">Startup Room Comments</h3>

                    {/* Feed List */}
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {workspace.comments?.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No activity logs posted. Start the conversation below!</p>
                      ) : (
                        workspace.comments?.map((comment: any) => (
                          <div key={comment.id} className="p-3 rounded-xl border border-border bg-black/20 text-xs space-y-1.5">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-saffron-400">{comment.author}</span>
                              <span className="text-slate-500">
                                {new Date(comment.createdAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-300">{comment.content}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment Form */}
                    <form onSubmit={handleAddComment} className="flex gap-3 border-t border-border/40 pt-4 mt-4">
                      <input 
                        type="text"
                        required
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Post a comment or update to the team..."
                        className="flex-1 rounded-xl border border-border/60 bg-black/40 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                      />
                      <button 
                        type="submit"
                        disabled={actionLoading}
                        className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-black shadow-glow flex items-center justify-center gap-1.5 transition-all"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* ANALYTICS PANEL */}
              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass text-center">
                      <TrendingUp className="h-8 w-8 text-emerald-400 mx-auto" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-sm">Startup Health Score</h4>
                        <p className="text-[10px] text-slate-400">Composite score based on tasks and milestones</p>
                      </div>
                      <p className="text-4xl font-extrabold text-white">{workspace.healthScore}%</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-glass text-center">
                      <DollarSign className="h-8 w-8 text-saffron-400 mx-auto" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-sm">Funding Readiness Score</h4>
                        <p className="text-[10px] text-slate-400">Score based on valuation metrics and pitch setup</p>
                      </div>
                      <p className="text-4xl font-extrabold text-white">{workspace.fundingReadiness}%</p>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </section>
    </main>
  );
}
