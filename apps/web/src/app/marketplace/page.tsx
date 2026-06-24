'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { 
  Globe, TrendingUp, Briefcase, Cpu, Users, Sparkles, Search, Filter, 
  CheckCircle, ArrowUpRight, DollarSign, UserPlus, FolderOpen, Heart, Bookmark, Mail, X,
  Layers, Info, ShieldAlert, Award, Play, Check, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { 
  marketplaceApi, talentApi, startupsApi, investorsApi, authApi, workspacesApi
} from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('domains');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // AI category sub-tabs state
  const [aiSubTab, setAiSubTab] = useState('Datasets');
  const [userWorkspaces, setUserWorkspaces] = useState<any[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  // Custom states for operating system features
  const [txModal, setTxModal] = useState<any>(null); // Transaction modal state
  const [domainAcquisitionTab, setDomainAcquisitionTab] = useState<'buy' | 'rent' | 'lease-to-own' | 'offer' | 'exchange' | 'contact'>('buy');
  const [aiLicenseTab, setAiLicenseTab] = useState<'buy' | 'rent' | 'monthly' | 'annual' | 'lifetime' | 'api'>('buy');
  
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [comparedItems, setComparedItems] = useState<any[]>([]);
  const [isComparingOpen, setIsComparingOpen] = useState(false);
  
  const [authPromptModal, setAuthPromptModal] = useState(false);
  const [listModal, setListModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Proposal input fields
  const [proposalOffer, setProposalOffer] = useState('');
  const [proposalDuration, setProposalDuration] = useState('6');
  const [proposalExchangeItem, setProposalExchangeItem] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');

  // List form state
  const [listType, setListType] = useState('ai'); // ai, domains, websites, apps
  const [formTitle, setFormTitle] = useState('');
  const [formName, setFormName] = useState('');
  const [formExt, setFormExt] = useState('.ai');
  const [formDesc, setFormDesc] = useState('');
  const [formCat, setFormCat] = useState('Healthcare');
  const [formSub, setFormSub] = useState('Datasets'); // datasets, models, agents
  const [formPrice, setFormPrice] = useState('');
  const [formLeasePrice, setFormLeasePrice] = useState('');
  const [formAccess, setFormAccess] = useState('buy'); // buy, sell, monthly, annual, lifetime, rent, both
  const [formRevenue, setFormRevenue] = useState('');
  const [formMRR, setFormMRR] = useState('');
  const [formUsers, setFormUsers] = useState('');
  const [formTraffic, setFormTraffic] = useState('');
  const [formPlatform, setFormPlatform] = useState('iOS');
  const [formStack, setFormStack] = useState('');
  const [formDownloads, setFormDownloads] = useState('');

  // Tab renaming mapping
  const tabs = [
    { id: 'domains', label: 'Asset Exchange (Domains)', icon: Globe },
    { id: 'websites', label: 'Asset Exchange (Websites)', icon: TrendingUp },
    { id: 'apps', label: 'Asset Exchange (Apps)', icon: Briefcase },
    { id: 'ai', label: 'AI Assets', icon: Cpu },
    { id: 'talent', label: 'Guild Network (Talent)', icon: Users },
    { id: 'startups', label: 'Capital Connect (Pitch Board)', icon: FolderOpen },
    { id: 'investors', label: 'Capital Connect (Investors)', icon: Mail },
    { id: 'cofounders', label: 'Co-Founders', icon: UserPlus },
  ];

  useEffect(() => {
    setMounted(true);
    const tabParam = searchParams.get('tab');
    if (tabParam && tabs.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    setItems([]);
    try {
      let data: any[] = [];
      const params = selectedCategory ? { category: selectedCategory } : undefined;
      
      switch (activeTab) {
        case 'domains':
          data = await marketplaceApi.getDomains(params);
          break;
        case 'websites':
          data = await marketplaceApi.getWebsites(params);
          break;
        case 'apps':
          data = await marketplaceApi.getApps(params);
          break;
        case 'ai':
          data = await marketplaceApi.getAIAssets(params);
          break;
        case 'talent':
          data = await talentApi.getTalent(selectedCategory || undefined);
          break;
        case 'startups':
          data = await startupsApi.getStartups(selectedCategory || undefined);
          break;
        case 'investors':
          data = await investorsApi.getInvestors();
          break;
        case 'cofounders':
          data = await startupsApi.getCofounders();
          break;
      }
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching marketplace data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionTrigger = async (type: string, item: any, defaultActionTab: any = 'buy') => {
    const token = localStorage.getItem('launchhub_token');
    if (!token) {
      setAuthPromptModal(true);
      return;
    }
    try {
      // Verify token is active and valid with backend
      await authApi.me();
      
      setTxModal({ type, item });
      setDomainAcquisitionTab(defaultActionTab);
      setAiLicenseTab(defaultActionTab);
      setProposalOffer('');
      setProposalDuration('6');
      setProposalExchangeItem('');
      setProposalMessage('');

      // Fetch workspaces for dropdown selector on asset acquisition
      if (type === 'ai' || type === 'domain' || type === 'asset') {
        const wsList = await workspacesApi.listWorkspaces();
        setUserWorkspaces(wsList || []);
        if (wsList && wsList.length > 0) {
          setSelectedWorkspaceId(wsList[0].id);
        }
      }
    } catch (err) {
      console.error("Session verification failed on action:", err);
      localStorage.removeItem('launchhub_token');
      setAuthPromptModal(true);
    }
  };

  const handleListSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (listType === 'ai') {
        await marketplaceApi.createAIAsset({
          title: formTitle,
          description: formDesc,
          category: formCat,
          subCategory: formSub,
          price: Number(formPrice),
          accessType: formAccess,
          rentPrice: formAccess !== 'buy' && formAccess !== 'sell' ? Number(formPrice) : undefined
        });
      } else if (listType === 'domains') {
        await marketplaceApi.createDomain({
          name: formName,
          extension: formExt,
          category: formCat,
          price: formAccess === 'rent' ? 0 : Number(formPrice),
          leasePrice: formAccess === 'rent' || formAccess === 'both' ? Number(formLeasePrice) : undefined,
          description: formDesc
        });
      } else if (listType === 'websites') {
        await marketplaceApi.createWebsite({
          title: formTitle,
          category: formCat,
          description: formDesc,
          revenue: Number(formRevenue || 0),
          users: Number(formUsers || 0),
          mrr: Number(formMRR || 0),
          arr: Number(formMRR || 0) * 12,
          traffic: Number(formTraffic || 0),
          stack: formStack.split(',').map(s => s.trim()),
          askingPrice: Number(formPrice)
        });
      } else if (listType === 'apps') {
        await marketplaceApi.createApp({
          title: formTitle,
          category: formCat,
          description: formDesc,
          downloads: Number(formDownloads || 0),
          revenue: Number(formRevenue || 0),
          platform: formPlatform,
          price: Number(formPrice)
        });
      }
      
      alert('Listing created successfully!');
      setListModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to list asset.');
    }
  };

  const handleLikeStartup = async (id: string) => {
    const token = localStorage.getItem('launchhub_token');
    if (!token) {
      setAuthPromptModal(true);
      return;
    }
    try {
      const res = await startupsApi.interact(id, 'like');
      setItems(prev => prev.map(item => item.id === id ? { ...item, likes: res.likes } : item));
    } catch (err) {
      alert('Unable to process request.');
    }
  };

  // Side-by-Side Comparator Handlers
  const toggleCompare = (item: any) => {
    const type = activeTab; // domains, websites, apps, ai
    if (comparedItems.length > 0 && comparedItems[0].compareType !== type) {
      setComparedItems([{ ...item, compareType: type }]);
    } else {
      if (comparedItems.some(i => i.id === item.id)) {
        setComparedItems(comparedItems.filter(i => i.id !== item.id));
      } else {
        if (comparedItems.length >= 3) {
          alert('You can compare up to 3 assets at a time.');
          return;
        }
        setComparedItems([...comparedItems, { ...item, compareType: type }]);
      }
    }
  };

  const isCompared = (item: any) => comparedItems.some(i => i.id === item.id);

  const getFilteredItems = () => {
    let baseItems = items;
    if (activeTab === 'ai') {
      baseItems = items.filter(item => item.subCategory === aiSubTab);
    }
    if (!searchQuery.trim()) return baseItems;
    const q = searchQuery.toLowerCase();
    return baseItems.filter(item => {
      const nameText = (item.name || item.title || item.fullName || '').toLowerCase();
      const descText = (item.description || item.bio || item.problem || '').toLowerCase();
      return nameText.includes(q) || descText.includes(q);
    });
  };

  const filteredItems = getFilteredItems();

  // Dynamic Guild match helpers
  const getGuildRecommendation = (name: string = '', role: string = '') => {
    const safeName = name || '';
    const safeRole = role || '';
    if (safeRole === 'AI Engineer' || safeName.includes('Priya')) {
      return 'Smart Recommendation: Pair Priya with Aarav Patel (Developer) to build end-to-end LLM orchestration nodes.';
    } else if (safeRole === 'Developer' || safeName.includes('Aarav')) {
      return 'Smart Recommendation: Pair Aarav with Neha Iyer (Designer) to implement state-of-the-art landing conversions.';
    } else if (safeRole === 'Designer' || safeName.includes('Neha')) {
      return 'Smart Recommendation: Pair Neha with Priya Sharma (AI Engineer) to design layouts for generative diagnostic suites.';
    }
    return 'Smart Recommendation: Pair with an expert AI developer to integrate LLM endpoints into this workflow.';
  };

  // Dynamic Pitch Board mock scores
  const getStartupReadinessScore = (stage: string) => {
    if (stage === 'Idea') return 62;
    if (stage === 'MVP') return 78;
    if (stage === 'Early Revenue') return 88;
    return 95;
  };

  const getStartupDueDiligence = (name: string, stage: string) => {
    return `AI Due Diligence: ${name} is an active project demonstrating scalable React/FastAPI nodes. ${
      stage === 'MVP' ? 'MVP shows functional Stripe and Auth workflows.' : 'Early traction logs show 15%+ MoM subscriber expansion.'
    } Codebase audited: zero critical flaws. Market demand fits startupoperating indexes.`;
  };

  const getInvestorThesis = (org: string, focus: string[]) => {
    return `AI Investment Thesis: ${org} has high syndicate matching. Tends to co-invest alongside major agritech or financial seed syndicates. Prefers high-moat developer libraries or proprietary data engines.`;
  };

  return (
    <main className="relative min-h-screen w-full bg-bg grid-bg pb-24">
      {/* Sacred geometry background overlay */}
      <div className="sacred-overlay" />

      {/* Cosmic background radial spot */}
      <div className="absolute top-0 left-1/2 h-[400px] w-full max-w-7xl -translate-x-1/2 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(205,127,50,0.08),transparent_80%)] pointer-events-none" />

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-8 lg:px-10 space-y-8">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-border/40 pb-6">
          <div className="flex items-center gap-3">
            <a href="/" className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 text-black font-extrabold shadow-glow text-sm">
              L
            </a>
            <span className="text-xl font-bold text-white tracking-wider">
              LaunchHub<span className="text-emerald-500">.AI</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/navigator" className="text-sm font-medium text-slate-400 hover:text-amber-500 transition-all flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" /> Venture Navigator
            </a>
            <span className="text-slate-800">|</span>
            <button 
              onClick={() => {
                const token = localStorage.getItem('launchhub_token');
                if (!token) setAuthPromptModal(true);
                else setListModal(true);
              }}
              className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500 hover:text-black transition-colors"
            >
              + List an Asset
            </button>
            <span className="text-slate-800">|</span>
            <a href="/dashboard" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Return to Console
            </a>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 border-b border-border/60 pb-3 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  setSearchQuery('');
                  setSelectedCategory('');
                  // Clear compare if we change main asset types to prevent mixed comparisons
                  if (t.id === 'talent' || t.id === 'investors' || t.id === 'cofounders' || t.id === 'startups') {
                    setComparedItems([]);
                  }
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold border transition-all duration-300 ${
                  active 
                    ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]' 
                    : 'bg-surface-card border-border/60 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* AI category sub-tabs selection */}
        {activeTab === 'ai' && (
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-border/40 max-w-2xl">
            {['Datasets', 'ML Models', 'AI Agents', 'AI Workflows', 'Prompt Libraries'].map((sub) => (
              <button
                key={sub}
                onClick={() => setAiSubTab(sub)}
                className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                  aiSubTab === sub
                    ? 'bg-amber-500 text-black border-amber-500 shadow-glow'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
              className="w-full bg-surface-card border border-border/60 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {activeTab !== 'investors' && activeTab !== 'cofounders' && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-surface-card border border-border/60 rounded-xl px-4 py-2.5 text-xs text-slate-400 focus:outline-none focus:border-amber-500/50"
              >
                <option value="">All Categories</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Education">Education</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Ecommerce">Ecommerce</option>
              </select>
            )}
            
            {comparedItems.length > 0 && (
              <button
                onClick={() => setIsComparingOpen(true)}
                className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500 hover:text-black flex items-center gap-1.5 transition-all"
              >
                <Layers className="h-4 w-4" />
                Compare Side-by-Side ({comparedItems.length})
              </button>
            )}
          </div>
        </div>

        {/* Listings Display Grid */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center items-center py-24"
              >
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500/20 border-t-amber-500" />
              </motion.div>
            ) : filteredItems.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20 border border-border/40 rounded-2xl bg-surface-card/20 max-w-md mx-auto space-y-2"
              >
                <p className="text-sm font-semibold text-slate-400">No Listings Found</p>
                <p className="text-xs text-slate-500">Be the first to list an asset on this exchange catalog.</p>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filteredItems.map((item: any, i) => {
                  const hasComparison = ['domains', 'websites', 'apps', 'ai'].includes(activeTab);
                  return (
                    <motion.div
                      key={item.id || item.userId || i}
                      className="rounded-2xl border border-border bg-surface-card p-6 flex flex-col justify-between hover:border-amber-500/25 transition-all duration-300 relative group"
                    >
                      {/* Upper content */}
                      <div className="space-y-4">
                        {/* Title / Header */}
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="font-bold text-white tracking-tight text-sm">
                              {item.name || item.title || item.fullName}
                            </h3>
                            <span className="inline-block bg-slate-900 border border-border/60 text-[10px] px-2 py-0.5 rounded text-slate-400 mt-1.5 font-medium">
                              {item.category || item.role || 'Exchange Listing'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {hasComparison && (
                              <button
                                onClick={() => toggleCompare(item)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  isCompared(item)
                                    ? 'bg-amber-500 border-amber-500 text-black'
                                    : 'bg-black/40 border-border text-slate-500 hover:text-white'
                                }`}
                                title="Compare Side-by-Side"
                              >
                                <Layers className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {item.verificationStatus === 'verified' && (
                              <span className="flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[9px] text-emerald-400 font-bold">
                                <CheckCircle className="h-2.5 w-2.5" /> Verified
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                          {item.description || item.bio || item.problem}
                        </p>

                        {/* Key value specs / evaluation scores based on Active Tab */}
                        <div className="pt-2">
                          {activeTab === 'domains' && (
                            <div className="space-y-3">
                              {/* 3 evaluations */}
                              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                                <div className="bg-slate-900/60 p-2 rounded-xl border border-border/40">
                                  <span className="text-slate-500 block uppercase font-bold tracking-wider">AI Valuation</span>
                                  <span className="font-extrabold text-white text-xs">${item.valuationScore ? Math.round(item.price * (item.valuationScore/80)) : 'N/A'}</span>
                                </div>
                                <div className="bg-slate-900/60 p-2 rounded-xl border border-border/40">
                                  <span className="text-slate-500 block uppercase font-bold tracking-wider">Startup Fit</span>
                                  <span className="font-extrabold text-emerald-400 text-xs">{item.fitScore || 85}%</span>
                                </div>
                                <div className="bg-slate-900/60 p-2 rounded-xl border border-border/40">
                                  <span className="text-slate-500 block uppercase font-bold tracking-wider">Demand Score</span>
                                  <span className="font-extrabold text-amber-500 text-xs">{item.demandScore || 80}%</span>
                                </div>
                              </div>
                              
                              {/* Industry Fit Analysis Toggle */}
                              <div className="border-t border-border/40 pt-2.5">
                                <button
                                  onClick={() => setExpandedCardId(expandedCardId === item.id ? null : item.id)}
                                  className="text-[10px] text-amber-500/80 hover:text-amber-400 font-bold flex items-center gap-1 focus:outline-none"
                                >
                                  {expandedCardId === item.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                  {expandedCardId === item.id ? 'Hide Fit Analysis' : 'View Fit Analysis'}
                                </button>
                                
                                {expandedCardId === item.id && (
                                  <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-2 p-3 rounded-xl bg-black/60 border border-border/60 text-[11px] text-slate-300 leading-normal"
                                  >
                                    <p className="font-bold text-amber-500 uppercase tracking-wider text-[9px] mb-1">AI Industry Fit Analysis:</p>
                                    <p className="italic">{item.industryFitAnalysis || 'Excellent match for tech MVPs and modern automation frameworks.'}</p>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          )}

                          {activeTab === 'websites' && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-2 text-center text-[10px] mb-2">
                                <div className="bg-slate-900/60 p-2 rounded-xl border border-border/40">
                                  <span className="text-slate-500 block uppercase font-bold">MRR</span>
                                  <span className="font-extrabold text-white text-xs">${item.mrr || 0}</span>
                                </div>
                                <div className="bg-slate-900/60 p-2 rounded-xl border border-border/40">
                                  <span className="text-slate-500 block uppercase font-bold">ARR</span>
                                  <span className="font-extrabold text-white text-xs">${item.arr || 0}</span>
                                </div>
                                <div className="bg-slate-900/60 p-2 rounded-xl border border-border/40">
                                  <span className="text-slate-500 block uppercase font-bold">Traffic</span>
                                  <span className="font-extrabold text-white text-xs">{item.traffic || 0}</span>
                                </div>
                              </div>

                              <div className="space-y-1.5 border-t border-border/40 pt-2.5 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500">Startup Health Score:</span>
                                  <span className="font-bold text-emerald-400">{item.healthScore || 85}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500">Acquisition Risk Score:</span>
                                  <span className="font-bold text-red-400">{item.riskScore || 15}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500">Growth Potential Score:</span>
                                  <span className="font-bold text-amber-500">{item.growthPotentialScore || 88}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500">Growth Trend:</span>
                                  <span className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1">
                                    {item.growthTrend === 'upward' ? (
                                      <span className="text-emerald-400 flex items-center">▲ Upward</span>
                                    ) : (
                                      <span className="text-slate-400 flex items-center">▶ Stable</span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === 'apps' && (
                            <div className="flex justify-between text-xs text-slate-500 border-t border-border/30 pt-2">
                              <div>Platform: <span className="text-slate-300 font-semibold">{item.platform}</span></div>
                              <div>Downloads: <span className="text-slate-300 font-semibold">{item.downloads?.toLocaleString() || 0}</span></div>
                            </div>
                          )}

                          {activeTab === 'ai' && (
                            <div className="space-y-3 border-t border-border/30 pt-3 text-xs text-slate-400">
                              {item.subCategory === 'Datasets' && (
                                <>
                                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
                                    <div className="bg-slate-900/60 p-2 rounded-xl border border-border/40">
                                      <span className="text-slate-500 block uppercase font-bold text-[9px]">Dataset Size</span>
                                      <span className="font-extrabold text-white text-xs">{item.datasetSize || 'N/A'}</span>
                                    </div>
                                    <div className="bg-slate-900/60 p-2 rounded-xl border border-border/40">
                                      <span className="text-slate-500 block uppercase font-bold text-[9px]">Records</span>
                                      <span className="font-extrabold text-white text-xs">{(item.numberOfRecords || 0).toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-1.5 border-t border-border/40 pt-2">
                                    <div className="flex justify-between">
                                      <span>Data Quality Score:</span>
                                      <span className="font-bold text-emerald-400">{item.dataQualityScore || 90}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Coverage Score:</span>
                                      <span className="font-bold text-blue-400">{item.coverageScore || 85}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Bias Risk Score:</span>
                                      <span className="font-bold text-red-400">{item.biasRiskScore ? `${item.biasRiskScore}%` : 'Low (10%)'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>License Type:</span>
                                      <span className="font-bold text-white text-[10px] uppercase">{item.licenseType || 'Commercial'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Format:</span>
                                      <span className="font-bold text-slate-300">{item.format || 'CSV'}</span>
                                    </div>
                                  </div>
                                  {item.biasAnalysis && (
                                    <p className="text-[10px] text-slate-400 italic bg-black/40 border border-border/40 p-2 rounded-lg leading-normal">
                                      <strong>Bias Analysis:</strong> {item.biasAnalysis}
                                    </p>
                                  )}
                                </>
                              )}

                              {item.subCategory === 'ML Models' && (
                                <>
                                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
                                    <div className="bg-slate-900/60 p-2 rounded-xl border border-border/40">
                                      <span className="text-slate-500 block uppercase font-bold text-[9px]">Framework</span>
                                      <span className="font-extrabold text-white text-xs">{item.framework || 'PyTorch'}</span>
                                    </div>
                                    <div className="bg-slate-900/60 p-2 rounded-xl border border-border/40">
                                      <span className="text-slate-500 block uppercase font-bold text-[9px]">Accuracy</span>
                                      <span className="font-extrabold text-emerald-400 text-xs">{item.accuracy ? `${(item.accuracy * 100).toFixed(1)}%` : '92.4%'}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-1.5 border-t border-border/40 pt-2">
                                    <div className="flex justify-between">
                                      <span>Precision / Recall:</span>
                                      <span className="font-bold text-slate-300">
                                        {item.precision ? `${(item.precision * 100).toFixed(0)}%` : '90%'} / {item.recall ? `${(item.recall * 100).toFixed(0)}%` : '88%'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Inference Cost:</span>
                                      <span className="font-bold text-amber-400">{item.inferenceCost || 'Low'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Production Readiness:</span>
                                      <span className="font-bold text-emerald-400">{item.productionReadinessScore || 90}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Cost Efficiency:</span>
                                      <span className="font-bold text-amber-500">{item.costEfficiencyScore || 85}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Scalability:</span>
                                      <span className="font-bold text-blue-400">{item.scalabilityScore || 90}%</span>
                                    </div>
                                  </div>
                                  {item.trainingDataset && (
                                    <div className="text-[10px] text-slate-400 bg-black/40 border border-border/40 p-2 rounded-lg leading-normal space-y-1">
                                      <div><strong>Training Dataset:</strong> {item.trainingDataset}</div>
                                      {item.demo && <div><a href={item.demo} target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline">Interactive Demo &rarr;</a></div>}
                                    </div>
                                  )}
                                </>
                              )}

                              {item.subCategory !== 'Datasets' && item.subCategory !== 'ML Models' && (
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Subcategory:</span>
                                    <span className="text-slate-300 font-bold">{item.subCategory}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Default License:</span>
                                    <span className="text-amber-500 font-bold uppercase">{item.accessType}</span>
                                  </div>
                                  {item.productionReadinessScore && (
                                    <div className="flex justify-between">
                                      <span>Production Readiness:</span>
                                      <span className="font-bold text-emerald-400">{item.productionReadinessScore}%</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {activeTab === 'talent' && (
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-1.5">
                                {item.skills?.slice(0, 4).map((s: string) => (
                                  <span key={s} className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-lg border border-border text-slate-400 font-medium">{s}</span>
                                ))}
                              </div>
                              <div className="border-t border-border/40 pt-2.5 space-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                                  <Check className="h-3.5 w-3.5" /> AI Match: {item.trustScore ? item.trustScore + 3 : 95}% Match
                                </div>
                                <p className="text-[10.5px] text-slate-400 italic leading-normal bg-black/40 border border-border/40 p-2.5 rounded-xl">
                                  {getGuildRecommendation(item.fullName, item.role)}
                                </p>
                              </div>
                            </div>
                          )}

                          {activeTab === 'startups' && (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Investment Readiness:</span>
                                <span className="font-extrabold text-amber-500">{getStartupReadinessScore(item.stage)}/100</span>
                              </div>
                              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${getStartupReadinessScore(item.stage)}%` }} />
                              </div>
                              
                              <p className="text-[10.5px] text-slate-400 bg-black/40 border border-border/40 p-2.5 rounded-xl leading-normal">
                                {getStartupDueDiligence(item.name, item.stage)}
                              </p>
                              
                              <div className="space-y-1 text-xs text-slate-500 border-t border-border/30 pt-2.5">
                                <div>Solution: <span className="text-slate-300 font-medium">{item.solution}</span></div>
                                <div>Vision: <span className="text-slate-300 font-medium italic">{item.vision}</span></div>
                              </div>
                            </div>
                          )}

                          {activeTab === 'investors' && (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Smart Syndicate Match:</span>
                                <span className="font-bold text-emerald-400">92% Match</span>
                              </div>
                              <p className="text-[10.5px] text-slate-400 bg-black/40 border border-border/40 p-2.5 rounded-xl leading-normal">
                                {getInvestorThesis(item.organization, item.industryFocus)}
                              </p>
                              <div className="space-y-1 text-xs text-slate-500 border-t border-border/30 pt-2">
                                <div>Target Stage: <span className="text-slate-300 font-medium">{item.stagePreference?.join(', ')}</span></div>
                                <div>Sector Focus: <span className="text-slate-300 font-medium">{item.industryFocus?.join(', ')}</span></div>
                              </div>
                            </div>
                          )}

                          {activeTab === 'cofounders' && (
                            <div className="space-y-2 border-t border-border/30 pt-2.5 text-xs text-slate-500">
                              <div>Roles Wanted: <span className="text-slate-300 font-medium">{item.preferredRoles?.join(', ')}</span></div>
                              <div>Desired Skills: <span className="text-slate-300 font-medium">{item.desiredCoFounderSkills?.join(', ')}</span></div>
                              <div>Commitment: <span className="text-emerald-400 font-bold">{item.commitmentLevel}</span></div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom CTA / Action */}
                      <div className="border-t border-border/40 pt-4 mt-6 flex justify-between items-center">
                        <div>
                          {activeTab === 'domains' ? (
                            <div className="space-y-0.5">
                              {item.price !== undefined && item.price > 0 && (
                                <p className="text-[11px] text-slate-500 font-semibold">
                                  Buy Now: <span className="font-extrabold text-white text-xs">${item.price}</span>
                                </p>
                              )}
                              {item.leasePrice !== undefined && item.leasePrice > 0 && (
                                <p className="text-[11px] text-slate-500 font-semibold">
                                  Rent: <span className="font-extrabold text-emerald-400 text-xs">${item.leasePrice}/mo</span>
                                </p>
                              )}
                            </div>
                          ) : activeTab === 'ai' ? (
                            <div className="space-y-0.5">
                              {item.accessType === 'buy' || item.accessType === 'sell' ? (
                                <p className="text-[11px] text-slate-500 font-semibold">
                                  License: <span className="font-extrabold text-white text-xs">${item.price}</span>
                                </p>
                              ) : (
                                <p className="text-[11px] text-slate-500 font-semibold">
                                  Access: <span className="font-extrabold text-emerald-400 text-xs">${item.price || item.rentPrice}/mo</span>
                                </p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase font-bold">Price</span>
                              <p className="text-sm font-extrabold text-white">
                                {item.price !== undefined ? (
                                  `$${item.price.toLocaleString()}`
                                ) : item.askingPrice !== undefined ? (
                                  `$${item.askingPrice.toLocaleString()}`
                                ) : item.ratePerHour !== undefined ? (
                                  `$${item.ratePerHour}/hr`
                                ) : item.ticketSize !== undefined ? (
                                  item.ticketSize
                                ) : item.fundingNeeded !== undefined ? (
                                  `$${item.fundingNeeded.toLocaleString()} target`
                                ) : 'No Price'}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {activeTab === 'startups' ? (
                            <>
                              <button 
                                onClick={() => handleLikeStartup(item.id)} 
                                className="p-2.5 rounded-xl border border-border bg-black/40 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-colors"
                              >
                                <Heart className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleActionTrigger('startup', item, 'contact')}
                                className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-black flex items-center gap-1 shadow-glow transition-all"
                              >
                                Pitch Backing
                              </button>
                            </>
                          ) : activeTab === 'investors' ? (
                            <button 
                              onClick={() => handleActionTrigger('investor', item, 'contact')}
                              className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-black flex items-center gap-1 shadow-glow transition-all"
                            >
                              Express Interest
                            </button>
                          ) : activeTab === 'cofounders' ? (
                            <button 
                              onClick={() => handleActionTrigger('cofounder', item, 'contact')}
                              className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-black flex items-center gap-1 shadow-glow transition-all"
                            >
                              Connect
                            </button>
                          ) : activeTab === 'domains' ? (
                            <button
                              onClick={() => handleActionTrigger('domain', item, 'buy')}
                              className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-black flex items-center gap-1 shadow-glow transition-all animate-pulse hover:animate-none"
                            >
                              Acquire Domain <ArrowUpRight className="h-3.5 w-3.5" />
                            </button>
                          ) : activeTab === 'ai' ? (
                            <button
                              onClick={() => handleActionTrigger('ai', item, 'buy')}
                              className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-black flex items-center gap-1 shadow-glow transition-all"
                            >
                              Acquire License <ArrowUpRight className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActionTrigger('asset', item, 'buy')}
                              className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-black flex items-center gap-1 shadow-glow transition-all"
                            >
                              Acquire <ArrowUpRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Domain Unified Transaction Modal */}
      {txModal && txModal.type === 'domain' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface-card p-6 space-y-6 shadow-2xl animate-float">
            <div className="flex justify-between items-start border-b border-border/40 pb-4">
              <div className="space-y-1">
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Venture Escrow Protected
                </span>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                  Acquisition Center: {txModal.item.name}
                </h3>
              </div>
              <button onClick={() => setTxModal(null)} className="text-slate-500 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 6 Path Buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 rounded-xl bg-slate-950 border border-border/40">
              {[
                { id: 'buy', label: 'Buy Now' },
                { id: 'rent', label: 'Rent Monthly' },
                { id: 'lease-to-own', label: 'Lease to Own' },
                { id: 'offer', label: 'Make Offer' },
                { id: 'exchange', label: 'Exchange Swap' },
                { id: 'contact', label: 'Contact Seller' }
              ].map((path) => (
                <button
                  key={path.id}
                  onClick={() => setDomainAcquisitionTab(path.id as any)}
                  className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                    domainAcquisitionTab === path.id
                      ? 'bg-amber-500 text-black border-amber-500'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {path.label}
                </button>
              ))}
            </div>

            {/* Path Forms */}
            <div className="space-y-4 min-h-[160px] p-4 rounded-xl bg-black/40 border border-border/40">
              {domainAcquisitionTab === 'buy' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Instantly purchase the domain name and begin automatic domain transfer to your registrar via our automated Escrow workflow.
                  </p>
                  <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Escrow Secure Purchase Price:</span>
                    <span className="font-extrabold text-emerald-400 text-sm">${txModal.item.price || 600}</span>
                  </div>
                </div>
              )}

              {domainAcquisitionTab === 'rent' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Lease this domain month-to-month. The DNS records will point to your server, while the seller retains registry ownership.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Rental Duration</label>
                      <select 
                        value={proposalDuration}
                        onChange={(e) => setProposalDuration(e.target.value)}
                        className="w-full bg-slate-900 border border-border text-xs rounded-lg p-2.5 text-white"
                      >
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">12 Months</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Price Per Month</label>
                      <div className="bg-slate-900 border border-border text-xs rounded-lg p-2.5 text-emerald-400 font-extrabold">
                        ${txModal.item.leasePrice || 50} /mo
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {domainAcquisitionTab === 'lease-to-own' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Pay monthly installments to lease the domain, with the guaranteed option to buyout/transfer full ownership upon final installment.
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-border">
                      <span className="text-slate-500 block text-[9px]">INSTALLMENT</span>
                      <span className="font-extrabold text-white">${Math.round((txModal.item.leasePrice || 50) * 1.2)} /mo</span>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-border">
                      <span className="text-slate-500 block text-[9px]">TERM</span>
                      <span className="font-extrabold text-white">12 Months</span>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-border">
                      <span className="text-slate-500 block text-[9px]">TERMINAL BUYOUT</span>
                      <span className="font-extrabold text-emerald-400">${Math.round((txModal.item.price || 600) * 0.5)}</span>
                    </div>
                  </div>
                </div>
              )}

              {domainAcquisitionTab === 'offer' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Negotiate a custom cash price. Your offer will be sent directly to the seller for approval or counter-offer.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Your Cash Offer (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                      <input 
                        type="number"
                        value={proposalOffer}
                        onChange={(e) => setProposalOffer(e.target.value)}
                        placeholder="E.g. 500"
                        className="w-full bg-slate-900 border border-border text-xs rounded-lg p-2.5 pl-8 text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {domainAcquisitionTab === 'exchange' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Propose exchanging this domain with another domain name you own. You can optionally add a cash adjustment.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Your Exchanging Domain</label>
                      <input 
                        type="text"
                        value={proposalExchangeItem}
                        onChange={(e) => setProposalExchangeItem(e.target.value)}
                        placeholder="E.g. alphacodes.com"
                        className="w-full bg-slate-900 border border-border text-xs rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Cash Adjustment (USD)</label>
                      <input 
                        type="number"
                        value={proposalOffer}
                        onChange={(e) => setProposalOffer(e.target.value)}
                        placeholder="E.g. +$150"
                        className="w-full bg-slate-900 border border-border text-xs rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {domainAcquisitionTab === 'contact' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Send a direct text inquiry regarding this domain listing. Negotiations will continue in your Direct Messages.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Proposal message or terms</label>
                <textarea
                  value={proposalMessage}
                  onChange={(e) => setProposalMessage(e.target.value)}
                  placeholder="Optional: Include additional notes, terms, or contact schedules..."
                  rows={2}
                  className="w-full rounded-xl border border-border bg-slate-900/60 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border/40 pt-4">
              <button 
                onClick={() => setTxModal(null)} 
                className="rounded-xl border border-border bg-transparent text-slate-400 hover:text-white px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert(`Acquisition path [${domainAcquisitionTab.toUpperCase()}] initialized successfully! The seller has been notified. Check messages.`);
                  setTxModal(null);
                }} 
                className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2 text-xs font-bold text-black shadow-glow"
              >
                Submit Proposal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Asset License Selection Modal */}
      {txModal && txModal.type === 'ai' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-surface-card p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-border/40 pb-4">
              <div>
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                  Multi-Licensing Matrix
                </span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-1">
                  License: {txModal.item.title}
                </h3>
              </div>
              <button onClick={() => setTxModal(null)} className="text-slate-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Select your preferred deployment scale. Multi-licensing secures usage limits or transfers neural assets entirely.
              </p>

              {/* Grid of 6 License Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'buy', title: 'Buy Outright', price: txModal.item.price * 2 || 1900, desc: 'Transfer repository ownership & weights entirely.' },
                  { id: 'rent', title: 'Rent Weights', price: Math.round(txModal.item.price * 0.15) || 150, desc: 'Rent weights for localized training & fine-tuning.' },
                  { id: 'monthly', title: 'Monthly Access', price: Math.round(txModal.item.price * 0.05) || 49, desc: 'Run instances in our cloud infrastructure, billed monthly.' },
                  { id: 'annual', title: 'Annual Access', price: Math.round(txModal.item.price * 0.45) || 399, desc: 'Run instances in our cloud, billed annually (save 30%).' },
                  { id: 'lifetime', title: 'Lifetime License', price: Math.round(txModal.item.price * 0.8) || 799, desc: 'One-time fee for lifetime cloud usage.' },
                  { id: 'api', title: 'API Integration', price: 0.001, desc: 'Pay-as-you-go key: $0.001 per 1,000 model tokens.' }
                ].map((lic) => (
                  <button
                    key={lic.id}
                    onClick={() => setAiLicenseTab(lic.id as any)}
                    className={`text-left p-3.5 rounded-xl border transition-all space-y-1.5 flex flex-col justify-between ${
                      aiLicenseTab === lic.id
                        ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                        : 'bg-slate-900/60 border-border/60 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold ${aiLicenseTab === lic.id ? 'text-amber-500' : 'text-white'}`}>
                          {lic.title}
                        </span>
                        <span className="font-extrabold text-emerald-400 text-xs">
                          {lic.id === 'api' ? '$0.001' : `$${lic.price}`}
                          {['rent', 'monthly'].includes(lic.id) && '/mo'}
                          {lic.id === 'annual' && '/yr'}
                          {lic.id === 'api' && '/1k'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1">{lic.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Select Startup Workspace</label>
                {userWorkspaces.length > 0 ? (
                  <select
                    value={selectedWorkspaceId}
                    onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-slate-900 px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
                  >
                    {userWorkspaces.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name} ({ws.stage})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No workspaces found. Acquire will save this to your account.</p>
                )}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Additional Notes</label>
                <textarea
                  value={proposalMessage}
                  onChange={(e) => setProposalMessage(e.target.value)}
                  placeholder="Optional: Enter custom SLA inquiries or integration guidelines..."
                  rows={2}
                  className="w-full rounded-xl border border-border bg-slate-900/60 p-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border/40 pt-4">
              <button 
                onClick={() => setTxModal(null)} 
                className="rounded-xl border border-border bg-transparent text-slate-400 px-4 py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (userWorkspaces.length > 0 && selectedWorkspaceId) {
                    try {
                      await workspacesApi.addAiAsset(selectedWorkspaceId, {
                        assetId: txModal.item.id,
                        assetTitle: txModal.item.title,
                        assetPrice: txModal.item.price,
                        assetType: txModal.item.subCategory === 'Datasets' ? 'dataset' : txModal.item.subCategory === 'ML Models' ? 'model' : 'agent',
                        format: txModal.item.format,
                        framework: txModal.item.framework,
                        accuracy: txModal.item.accuracy,
                        qualityScore: txModal.item.dataQualityScore
                      });
                      alert(`Asset [${txModal.item.title}] added to workspace successfully! Check Workspace Console.`);
                    } catch (err: any) {
                      alert(`Error adding to workspace: ${err.message}`);
                    }
                  } else {
                    alert(`License [${aiLicenseTab.toUpperCase()}] requested successfully! Check messages for next setup stages.`);
                  }
                  setTxModal(null);
                }} 
                className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-black shadow-glow"
              >
                Acquire License
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simplified Transaction Modal for other asset classes */}
      {txModal && txModal.type !== 'domain' && txModal.type !== 'ai' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface-card p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start border-b border-border/40 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                {txModal.type === 'startup' && 'Join Team Proposal'}
                {txModal.type === 'investor' && 'Express Interest'}
                {txModal.type === 'cofounder' && 'Co-Founder Request'}
                {txModal.type === 'asset' && 'Acquisition Request'}
              </h3>
              <button onClick={() => setTxModal(null)} className="text-slate-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Contacting <span className="font-semibold text-white">{txModal.item.name || txModal.item.title || txModal.item.fullName}</span>.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Proposal Message</label>
                <textarea
                  placeholder="Detail your goals, proposal terms, or contact schedules..."
                  rows={4}
                  value={proposalMessage}
                  onChange={(e) => setProposalMessage(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-900/60 p-3 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {txModal.type === 'asset' && (
                <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Asking Price:</span>
                  <span className="font-bold text-amber-500">${txModal.item.price || txModal.item.askingPrice || 0}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-border/40 pt-4">
              <button 
                onClick={() => setTxModal(null)} 
                className="rounded-xl border border-border bg-transparent text-slate-400 hover:text-white px-4 py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert('Proposal submitted successfully! Check DMs or email notifies.');
                  setTxModal(null);
                }} 
                className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-black shadow-glow"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Asset Comparator Modal */}
      {isComparingOpen && comparedItems.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-5xl rounded-2xl border border-amber-500/30 bg-surface-card p-6 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-border/40 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-amber-500" />
                Asset Comparator: Side-by-Side Analysis
              </h3>
              <button onClick={() => setIsComparingOpen(false)} className="text-slate-500 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="p-3 text-slate-500 font-bold uppercase tracking-wider w-1/4">Specs Matrix</th>
                    {comparedItems.map((item, idx) => (
                      <th key={item.id} className="p-3 font-extrabold text-white text-sm w-1/4">
                        <div className="flex justify-between items-center">
                          <span>{item.name || item.title}</span>
                          <button
                            onClick={() => setComparedItems(comparedItems.filter(i => i.id !== item.id))}
                            className="text-red-400 hover:text-red-300 p-0.5"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <tr>
                    <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">Asking Price</td>
                    {comparedItems.map(item => (
                      <td key={item.id} className="p-3 font-bold text-white">
                        ${item.price || item.askingPrice || 'N/A'}
                        {item.leasePrice && <span className="text-emerald-400 font-semibold block text-[10px] mt-0.5">Lease: ${item.leasePrice}/mo</span>}
                      </td>
                    ))}
                  </tr>

                  {comparedItems[0].compareType === 'domains' && (
                    <>
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">AI Valuation Score</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3">
                            <span className="bg-slate-900 border border-border/60 px-2 py-1 rounded font-bold text-white">
                              {item.valuationScore ? `${item.valuationScore}/100` : 'N/A'}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">Startup Fit Score</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3">
                            <span className="font-bold text-emerald-400">{item.fitScore || 85}%</span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">Demand Score</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3">
                            <span className="font-bold text-amber-400">{item.demandScore || 80}%</span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">Industry Fit Analysis</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3 text-slate-400 italic leading-relaxed text-[11px]">
                            {item.industryFitAnalysis || 'High integration capability for web nodes.'}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">Traffic & Age</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3 text-slate-300">
                            {item.traffic || 0} visits • {item.age || 1} yrs old
                          </td>
                        ))}
                      </tr>
                    </>
                  )}

                  {comparedItems[0].compareType === 'websites' && (
                    <>
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">SaaS MRR / ARR</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3 text-slate-300 font-bold">
                            MRR: ${item.mrr || 0} <span className="text-[10px] text-slate-500 font-normal block">ARR: ${item.arr || 0}</span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">SaaS Health Score</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3">
                            <span className="font-bold text-emerald-400">{item.healthScore || 85}%</span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">Acquisition Risk Score</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3">
                            <span className="font-bold text-red-400">{item.riskScore || 15}%</span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">Growth Potential Score</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3">
                            <span className="font-bold text-amber-500">{item.growthPotentialScore || 88}%</span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">Tech Stack</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {item.stack?.map((s: string) => (
                                <span key={s} className="bg-slate-900 border border-border/40 text-[9px] px-1.5 py-0.5 rounded text-slate-400">{s}</span>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    </>
                  )}

                  {comparedItems[0].compareType === 'apps' && (
                    <>
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">Downloads</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3 font-bold text-slate-300">
                            {item.downloads?.toLocaleString() || 0} downloads
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">Platform</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3 font-bold text-white">
                            {item.platform}
                          </td>
                        ))}
                      </tr>
                    </>
                  )}

                  {comparedItems[0].compareType === 'ai' && (
                    <>
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">AI Subcategory</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3 text-slate-300 font-bold">
                            {item.subCategory}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">License Type</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3 text-amber-500 font-bold uppercase">
                            {item.accessType}
                          </td>
                        ))}
                      </tr>
                      {/* Records / Accuracy */}
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">Scale / Accuracy</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3 font-bold text-white">
                            {item.subCategory === 'Datasets' ? (
                              <span>{(item.numberOfRecords || 0).toLocaleString()} records</span>
                            ) : item.subCategory === 'ML Models' ? (
                              <span className="text-emerald-400">{item.accuracy ? `${(item.accuracy * 100).toFixed(1)}%` : '92%'} Acc</span>
                            ) : (
                              'N/A'
                            )}
                          </td>
                        ))}
                      </tr>
                      {/* Format / Framework */}
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">Format / Framework</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3 text-slate-300">
                            {item.subCategory === 'Datasets' ? (
                              <span>{item.format || 'CSV'}</span>
                            ) : item.subCategory === 'ML Models' ? (
                              <span>{item.framework || 'PyTorch'}</span>
                            ) : (
                              'N/A'
                            )}
                          </td>
                        ))}
                      </tr>
                      {/* Quality Score / Production Readiness */}
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">Quality / Production Readiness</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3">
                            {item.subCategory === 'Datasets' ? (
                              <span className="font-bold text-emerald-400">Quality: {item.dataQualityScore || 90}%</span>
                            ) : (
                              <span className="font-bold text-blue-400">Ready: {item.productionReadinessScore || 90}%</span>
                            )}
                          </td>
                        ))}
                      </tr>
                      {/* Bias Risk / Inference Cost */}
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">Bias Risk / Inference Cost</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3 text-slate-300">
                            {item.subCategory === 'Datasets' ? (
                              <span className="text-red-400">Bias: {item.biasRiskScore || 10}%</span>
                            ) : item.subCategory === 'ML Models' ? (
                              <span className="text-amber-500">Inference: {item.inferenceCost || 'Low'}</span>
                            ) : (
                              'N/A'
                            )}
                          </td>
                        ))}
                      </tr>
                      {/* Startup Compatibility */}
                      <tr>
                        <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">Startup Compatibility</td>
                        {comparedItems.map(item => (
                          <td key={item.id} className="p-3">
                            <span className="font-bold text-emerald-400">{item.startupCompatibilityScore || 85}%</span>
                          </td>
                        ))}
                      </tr>
                    </>
                  )}

                  <tr>
                    <td className="p-3 text-slate-500 font-bold uppercase tracking-wider">Action</td>
                    {comparedItems.map(item => (
                      <td key={item.id} className="p-3">
                        <button
                          onClick={() => {
                            setIsComparingOpen(false);
                            handleActionTrigger(item.compareType === 'domains' ? 'domain' : item.compareType === 'ai' ? 'ai' : 'asset', item, 'buy');
                          }}
                          className="rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 font-bold text-xs shadow-glow transition-all"
                        >
                          Acquire
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/40">
              <button
                onClick={() => setComparedItems([])}
                className="rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-black px-4 py-2 font-bold text-xs transition-all mr-auto"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsComparingOpen(false)}
                className="rounded-xl bg-slate-900 border border-border text-slate-300 hover:text-white px-5 py-2 font-bold text-xs transition-all"
              >
                Close Comparator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Authentication Intercept Modal */}
      {authPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface-card p-6 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 mx-auto">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white">Sign Up to Proceed</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                You must create a LaunchHub account first to acquire, lease, list, or negotiate startup assets.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <a 
                href={mounted ? `/register?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}` : '/register'} 
                className="rounded-xl bg-amber-500 hover:bg-amber-400 text-black py-3 text-center text-xs font-bold shadow-glow transition-all flex items-center justify-center"
              >
                Sign Up First
              </a>
              <a 
                href={mounted ? `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}` : '/login'} 
                className="rounded-xl border border-border bg-slate-900 text-slate-300 hover:text-white py-3 text-center text-xs font-bold flex items-center justify-center"
              >
                Have account? Sign In
              </a>
            </div>

            <div className="text-center pt-2">
              <button 
                onClick={() => setAuthPromptModal(false)}
                className="text-xs text-slate-500 hover:text-slate-400 underline decoration-dotted"
              >
                Cancel & Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List Asset Modal */}
      {listModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface-card p-6 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-border/40 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" /> List a Startup Asset
              </h3>
              <button onClick={() => setListModal(false)} className="text-slate-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleListSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Asset Type</label>
                <select 
                  value={listType} 
                  onChange={(e) => {
                    setListType(e.target.value);
                    setFormAccess('buy');
                  }}
                  className="w-full rounded-xl border border-border bg-black/40 px-3 py-2.5 text-xs text-slate-300"
                >
                  <option value="ai">AI Asset (Dataset, ML Model, Agent)</option>
                  <option value="domains">Domain Name</option>
                  <option value="websites">Website / SaaS Product</option>
                  <option value="apps">Mobile or Web App</option>
                </select>
              </div>

              {listType === 'domains' ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Domain Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formName} 
                      onChange={(e) => setFormName(e.target.value)} 
                      placeholder="my startup" 
                      className="w-full rounded-xl border border-border bg-black/40 px-3 py-2.5 text-xs text-white" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">TLD</label>
                    <select 
                      value={formExt} 
                      onChange={(e) => setFormExt(e.target.value)}
                      className="w-full rounded-xl border border-border bg-black/40 px-3 py-2.5 text-xs text-slate-300"
                    >
                      <option value=".ai">.ai</option>
                      <option value=".com">.com</option>
                      <option value=".io">.io</option>
                      <option value=".co">.co</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold">Title</label>
                  <input 
                    type="text" 
                    required 
                    value={formTitle} 
                    onChange={(e) => setFormTitle(e.target.value)} 
                    placeholder="E.g. AI Customer Service Bot" 
                    className="w-full rounded-xl border border-border bg-black/40 px-3 py-2.5 text-xs text-white" 
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Description</label>
                <textarea 
                  required 
                  value={formDesc} 
                  onChange={(e) => setFormDesc(e.target.value)} 
                  placeholder="Detail the metrics, features, and specs of this asset..." 
                  rows={3} 
                  className="w-full rounded-xl border border-border bg-black/40 p-3 text-xs text-white" 
                />
              </div>

              {listType !== 'ai' && (
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold">Listing Option</label>
                  <select 
                    value={formAccess} 
                    onChange={(e) => setFormAccess(e.target.value)}
                    className="w-full rounded-xl border border-border bg-black/40 px-3 py-2.5 text-xs text-slate-300"
                  >
                    <option value="buy">Sell Outright (Buy)</option>
                    {listType === 'domains' && <option value="rent">Lease / Rent out (Rent)</option>}
                    {listType === 'domains' && <option value="both">Both (Sell or Lease)</option>}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-semibold">Category</label>
                  <select 
                    value={formCat} 
                    onChange={(e) => setFormCat(e.target.value)}
                    className="w-full rounded-xl border border-border bg-black/40 px-3 py-2.5 text-xs text-slate-300"
                  >
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Education">Education</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Ecommerce">Ecommerce</option>
                  </select>
                </div>

                {(formAccess === 'buy' || formAccess === 'both' || listType === 'ai') && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Asking Price (USD)</label>
                    <input 
                      type="number" 
                      required 
                      value={formPrice} 
                      onChange={(e) => setFormPrice(e.target.value)} 
                      placeholder="500" 
                      className="w-full rounded-xl border border-border bg-black/40 px-3 py-2.5 text-xs text-white" 
                    />
                  </div>
                )}

                {(formAccess === 'rent' || formAccess === 'both') && listType === 'domains' && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Monthly Lease Price (USD)</label>
                    <input 
                      type="number" 
                      required 
                      value={formLeasePrice} 
                      onChange={(e) => setFormLeasePrice(e.target.value)} 
                      placeholder="50" 
                      className="w-full rounded-xl border border-border bg-black/40 px-3 py-2.5 text-xs text-white" 
                    />
                  </div>
                )}
              </div>

              {listType === 'ai' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">AI Sub-Category</label>
                    <select 
                      value={formSub} 
                      onChange={(e) => setFormSub(e.target.value)}
                      className="w-full rounded-xl border border-border bg-black/40 px-3 py-2.5 text-xs text-slate-300"
                    >
                      <option value="Datasets">Dataset</option>
                      <option value="ML Models">ML Model</option>
                      <option value="AI Agents">AI Agent</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Access License Model</label>
                    <select 
                      value={formAccess} 
                      onChange={(e) => setFormAccess(e.target.value)}
                      className="w-full rounded-xl border border-border bg-black/40 px-3 py-2.5 text-xs text-slate-300"
                    >
                      <option value="sell">Transfer Ownership (Sell)</option>
                      <option value="buy">Lifetime Access (Buy)</option>
                      <option value="monthly">Monthly Subscription (Rent)</option>
                      <option value="annual">Annual Subscription (Rent)</option>
                      <option value="lifetime">Lifetime License (Rent)</option>
                    </select>
                  </div>
                </div>
              )}

              {listType === 'websites' && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">MRR (USD)</label>
                    <input type="number" value={formMRR} onChange={(e) => setFormMRR(e.target.value)} placeholder="200" className="w-full rounded-xl border border-border bg-black/40 px-3 py-2.5 text-xs text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Users</label>
                    <input type="number" value={formUsers} onChange={(e) => setFormUsers(e.target.value)} placeholder="150" className="w-full rounded-xl border border-border bg-black/40 px-3 py-2.5 text-xs text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Traffic</label>
                    <input type="number" value={formTraffic} onChange={(e) => setFormTraffic(e.target.value)} placeholder="2000" className="w-full rounded-xl border border-border bg-black/40 px-3 py-2.5 text-xs text-white" />
                  </div>
                </div>
              )}

              {listType === 'apps' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Platform</label>
                    <select value={formPlatform} onChange={(e) => setFormPlatform(e.target.value)} className="w-full rounded-xl border border-border bg-black/40 px-3 py-2.5 text-xs text-slate-300">
                      <option value="iOS">iOS</option>
                      <option value="Android">Android</option>
                      <option value="Web">Web Application</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Downloads</label>
                    <input type="number" value={formDownloads} onChange={(e) => setFormDownloads(e.target.value)} placeholder="12000" className="w-full rounded-xl border border-border bg-black/40 px-3 py-2.5 text-xs text-white" />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-border/40 pt-4">
                <button 
                  type="button" 
                  onClick={() => setListModal(false)} 
                  className="rounded-xl border border-border bg-transparent text-slate-400 hover:text-white px-4 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-black shadow-glow"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

const MarketplaceContentNoSSR = dynamic(
  () => Promise.resolve(MarketplaceContent),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500/20 border-t-amber-500" />
      </div>
    )
  }
);

export default function MarketplacePage() {
  return <MarketplaceContentNoSSR />;
}
