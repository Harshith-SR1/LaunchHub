'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Sparkles, AlertCircle, ArrowRight, DollarSign, Clock, CheckCircle2, Globe, Cpu, Database, Users, TrendingUp, ShieldAlert, ArrowUpRight, ShieldCheck, Check } from 'lucide-react';
import { aiApi } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

function NavigatorContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const queryParam = searchParams.get('query');
    if (queryParam) {
      setQuery(queryParam);
      runSearch(queryParam);
    }
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      runSearch(query.trim());
    }
  };

  const runSearch = async (searchQuery: string) => {
    setError('');
    setLoading(true);
    try {
      const data = await aiApi.searchNavigator(searchQuery);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Venture Navigator scan failed. Check backend connectivity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-bg grid-bg pb-24">
      {/* Sacred geometry background */}
      <div className="sacred-overlay" />

      {/* Glow Effects */}
      <div className="absolute top-0 right-1/4 h-[400px] w-[600px] bg-[radial-gradient(ellipse_50%_50%_at_top,rgba(205,127,50,0.06),transparent_70%)] pointer-events-none" />

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-8 lg:px-10 space-y-10">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-border/40 pb-6">
          <div className="flex items-center gap-3">
            <a href="/" className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 text-black font-extrabold shadow-glow text-sm">
              L
            </a>
            <span className="text-lg font-bold text-white tracking-wider">
              LaunchHub<span className="text-emerald-500">.AI</span>
            </span>
          </div>
          <a href="/dashboard" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Return to Console
          </a>
        </div>

        {/* Search Console */}
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-400 animate-pulse" strokeWidth={1.5} />
              Venture Navigator
            </h1>
            <p className="text-sm text-slate-400">
              Query our startup operating system in natural language. The engine extracts filters to discover matching assets.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative mt-6">
            <div className="flex items-center rounded-2xl border border-border bg-black/60 shadow-glass p-2 focus-within:border-amber-500/50 focus-within:shadow-[0_0_20px_rgba(245,158,11,0.12)] transition-all duration-300">
              <Search className="absolute left-5 h-5 w-5 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search venture pillars (e.g. 'I need a crop predicting model and a domain under $1000')"
                className="w-full bg-transparent pl-12 pr-32 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-3 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-2.5 text-xs font-bold text-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              >
                {loading ? 'Scanning...' : 'Scan Engine'}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 flex items-center gap-2 max-w-lg mx-auto">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Results Console */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-4"
            >
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500/20 border-t-amber-500" />
              <p className="text-sm text-slate-400 animate-pulse">Analyzing search intent and scanning database registries...</p>
            </motion.div>
          ) : results ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-10"
            >
              {/* Intent and Extracted Filters */}
              <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Intent Detected:</span>
                  <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-xl text-xs font-semibold">
                    {results.intentDetected || 'SaaS Discovery'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-slate-500 font-semibold self-center">Extracted Filters:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="bg-slate-900 border border-border text-slate-300 px-2 py-1 rounded">Category: General</span>
                    {results.estimatedCost && <span className="bg-slate-900 border border-border text-slate-300 px-2 py-1 rounded">Estimated Cost: ${results.estimatedCost}</span>}
                    {results.estimatedLaunchTime && <span className="bg-slate-900 border border-border text-slate-300 px-2 py-1 rounded">Launch: {results.estimatedLaunchTime}</span>}
                  </div>
                </div>
              </div>

              {/* Metrics Dashboard */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" /> Estimated Cost
                  </span>
                  <p className="text-3xl font-extrabold text-white">${results.estimatedCost}</p>
                </div>

                <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Estimated Launch
                  </span>
                  <p className="text-3xl font-extrabold text-white">{results.estimatedLaunchTime}</p>
                </div>

                <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Startup Readiness</span>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-extrabold text-white">{results.startupReadinessScore}%</p>
                    <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${results.startupReadinessScore}%` }} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Matches Found</span>
                  <p className="text-3xl font-extrabold text-amber-400">
                    {Object.values(results.recommendedAssets || {}).flat().length} items
                  </p>
                </div>
              </div>

              {/* Recommended Assets Categories */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white tracking-tight">Structured Discoveries</h2>

                <div className="grid gap-8 lg:grid-cols-2">
                  {/* Datasets */}
                  {results.recommendedAssets.datasets?.length > 0 && (
                    <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Database className="h-4 w-4 text-emerald-400" /> Recommended Datasets
                      </h3>
                      <div className="space-y-3">
                        {results.recommendedAssets.datasets.map((d: any) => (
                          <div key={d.id} className="p-4 rounded-xl border border-border bg-black/40 hover:border-amber-500/20 transition-all space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-white text-sm">{d.title}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Format: {d.format} • Size: {d.datasetSize || 'N/A'}</p>
                              </div>
                              <p className="font-bold text-emerald-400 text-sm">${d.price}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                              <div className="bg-slate-900/80 p-1.5 rounded border border-border/60">
                                <span className="text-slate-500 block">Quality Score</span>
                                <span className="font-bold text-white">{d.dataQualityScore || 90}%</span>
                              </div>
                              <div className="bg-slate-900/80 p-1.5 rounded border border-border/60">
                                <span className="text-slate-500 block">Bias Risk</span>
                                <span className="font-bold text-red-400">{d.biasRiskScore ? `${d.biasRiskScore}%` : 'Low (10%)'}</span>
                              </div>
                              <div className="bg-slate-900/80 p-1.5 rounded border border-border/60">
                                <span className="text-slate-500 block">Startup Fit</span>
                                <span className="font-bold text-emerald-400">{d.startupCompatibilityScore || 85}%</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center border-t border-border/40 pt-2.5">
                              <span className="text-[10px] text-slate-500 leading-normal italic line-clamp-1">License: {d.licenseType || 'Commercial'}</span>
                              <a href={`/marketplace?tab=ai`} className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 shrink-0">
                                Acquire Weights <ArrowUpRight className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ML Models */}
                  {results.recommendedAssets.models?.length > 0 && (
                    <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-amber-400 animate-pulse" /> Recommended ML Models
                      </h3>
                      <div className="space-y-3">
                        {results.recommendedAssets.models.map((m: any) => (
                          <div key={m.id} className="p-4 rounded-xl border border-border bg-black/40 hover:border-amber-500/20 transition-all space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-white text-sm">{m.title}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Framework: {m.framework} • Accuracy: {m.accuracy ? `${(m.accuracy * 100).toFixed(1)}%` : '92%'}</p>
                              </div>
                              <p className="font-bold text-emerald-400 text-sm">${m.price}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                              <div className="bg-slate-900/80 p-1.5 rounded border border-border/60">
                                <span className="text-slate-500 block">Precision</span>
                                <span className="font-bold text-white">{m.precision ? `${(m.precision * 100).toFixed(0)}%` : '90%'}</span>
                              </div>
                              <div className="bg-slate-900/80 p-1.5 rounded border border-border/60">
                                <span className="text-slate-500 block">Inference Cost</span>
                                <span className="font-bold text-amber-500">{m.inferenceCost || 'Low'}</span>
                              </div>
                              <div className="bg-slate-900/80 p-1.5 rounded border border-border/60">
                                <span className="text-slate-500 block">Readiness</span>
                                <span className="font-bold text-emerald-400">{m.productionReadinessScore || 90}%</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center border-t border-border/40 pt-2.5">
                              <span className="text-[10px] text-slate-500 leading-normal italic line-clamp-1">Training Set: {m.trainingDataset || 'Proprietary'}</span>
                              <a href={`/marketplace?tab=ai`} className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 shrink-0">
                                Deploy Model <ArrowUpRight className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Domains */}
                  {results.recommendedAssets.domains?.length > 0 && (
                    <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Globe className="h-4 w-4 text-emerald-400" /> Recommended Domain Assets
                      </h3>
                      <div className="space-y-3">
                        {results.recommendedAssets.domains.map((d: any) => (
                          <div key={d.id} className="p-4 rounded-xl border border-border bg-black/40 hover:border-amber-500/20 transition-all space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-white text-sm">{d.name}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Category: {d.category} • Age: {d.age} yr • Traffic: {d.traffic} visits</p>
                              </div>
                              <p className="font-bold text-emerald-400 text-sm">${d.price}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                              <div className="bg-slate-900/80 p-1.5 rounded border border-border/60">
                                <span className="text-slate-500 block">AI Valuation</span>
                                <span className="font-bold text-white">${d.price ? d.price * 1.5 : '1,200'}</span>
                              </div>
                              <div className="bg-slate-900/80 p-1.5 rounded border border-border/60">
                                <span className="text-slate-500 block">Startup Fit</span>
                                <span className="font-bold text-emerald-400">{d.fitScore || '90'}%</span>
                              </div>
                              <div className="bg-slate-900/80 p-1.5 rounded border border-border/60">
                                <span className="text-slate-500 block">Demand Score</span>
                                <span className="font-bold text-amber-400">{d.demandScore || '84'}%</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center border-t border-border/40 pt-2.5">
                              <span className="text-[10px] text-slate-500 leading-normal italic line-clamp-1">{d.industryFitAnalysis || 'Excellent matching recalling potential.'}</span>
                              <a href={`/marketplace?tab=domains`} className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 shrink-0">
                                Acquire Domain <ArrowUpRight className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Agents */}
                  {results.recommendedAssets.agents?.length > 0 && (
                    <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-pink-400" /> Recommended AI Agents
                      </h3>
                      <div className="space-y-3">
                        {results.recommendedAssets.agents.map((a: any) => (
                          <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-black/40 hover:border-emerald-500/20 transition-colors">
                            <div>
                              <p className="font-semibold text-white text-sm">{a.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-emerald-400 text-sm">${a.price}/{a.accessType === 'monthly' ? 'mo' : 'buy'}</p>
                              <a href={`/marketplace?tab=ai`} className="text-[10px] text-slate-400 hover:text-emerald-400 underline decoration-dotted flex items-center justify-end gap-0.5 mt-0.5">
                                Rent AI <ArrowUpRight className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Freelancers & Talent (Guild Network) */}
                  {results.recommendedAssets.freelancers?.length > 0 && (
                    <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-400" /> Suggested Guild Network Talent
                      </h3>
                      <div className="space-y-3">
                        {results.recommendedAssets.freelancers.map((f: any) => (
                          <div key={f.userId || f.fullName} className="p-3 rounded-xl border border-border bg-black/40 hover:border-emerald-500/20 transition-colors space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-white text-sm flex items-center gap-1">
                                  {f.fullName}
                                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 py-0.5 rounded font-bold">
                                    AI Match 95%
                                  </span>
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">Rate: ${f.ratePerHour}/hr • Availability: {f.availability || '20 hrs/week'}</p>
                              </div>
                              <a href={`/marketplace?tab=talent`} className="rounded bg-emerald-500 text-black text-[11px] font-bold px-3 py-1.5 hover:bg-emerald-400 transition-colors">
                                Hire
                              </a>
                            </div>
                            <div className="flex flex-wrap gap-1 border-t border-border/40 pt-2 text-[10px] text-slate-400">
                              <span className="text-amber-500 font-semibold mr-1">Smart Suggestion:</span> We recommend pairing Alex with React Developers for MVP launch pipelines.
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Investors */}
                  {results.recommendedAssets.investors?.length > 0 && (
                    <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-amber-400" /> Potential Venture Capital Connects
                      </h3>
                      <div className="space-y-3">
                        {results.recommendedAssets.investors.map((inv: any) => (
                          <div key={inv.userId} className="p-3 rounded-xl border border-border bg-black/40 hover:border-emerald-500/20 transition-colors space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-white text-sm">{inv.name}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{inv.organization} • Ticket: {inv.ticketSize}</p>
                              </div>
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded font-bold">
                                Readiness: {inv.readinessScore || '88'}/100
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-normal border-t border-border/30 pt-2"><span className="text-slate-500 font-semibold">AI Due Diligence:</span> General focus matches agritech and finance startup pipelines with strong MVP milestones.</p>
                            <div className="text-right">
                              <a href={`/marketplace?tab=investors`} className="text-[10px] text-slate-400 hover:text-emerald-400 underline decoration-dotted flex items-center justify-end gap-0.5">
                                Contact Fund <ArrowUpRight className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 border border-border/40 rounded-2xl bg-surface-card/30 max-w-2xl mx-auto space-y-2"
            >
              <ShieldAlert className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-base text-slate-400 font-semibold">Console Ready</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Please enter a search prompt in the input above. The engine will scan our assets and talent registers to output dynamic launch cards.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

export default function NavigatorPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
      </div>
    }>
      <NavigatorContent />
    </Suspense>
  );
}
