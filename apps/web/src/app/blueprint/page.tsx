'use client';

import { useState } from 'react';
import { Sparkles, ArrowRight, AlertCircle, ListChecks, DollarSign, Wallet, Hammer, UserCheck, Briefcase, Network, Globe, Cpu, Database, TrendingUp, Layers } from 'lucide-react';
import { aiApi } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function BlueprintPage() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blueprint, setBlueprint] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;
    setError('');
    setLoading(true);
    try {
      const data = await aiApi.generateBlueprint(idea);
      setBlueprint(data);
    } catch (err: any) {
      setError(err.message || 'Yantra synthesis failed. Check backend connectivity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-bg grid-bg pb-24">
      {/* Sacred geometry background */}
      <div className="sacred-overlay" />

      {/* Background aurora spots */}
      <div className="absolute top-0 left-1/4 h-[350px] w-[500px] bg-[radial-gradient(ellipse_50%_50%_at_top,rgba(205,127,50,0.06),transparent_70%)] pointer-events-none" />

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-8 lg:px-10 space-y-10">
        {/* Navigation Bar */}
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

        {/* Intro */}
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-400 animate-pulse" strokeWidth={1.5} />
              Startup Blueprint Engine
            </h1>
            <p className="text-sm text-slate-400">
              Submit your raw startup idea to synthesize the 8 core pillars of venture architecture: domain, SaaS, app, datasets, models, agents, talent, and capital.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="relative mt-6">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-black/60 p-4 shadow-glass backdrop-blur-md">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Describe your startup idea (e.g. 'I want to build an AI agricultural yield forecasting software...')"
                rows={4}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none resize-none"
              />
              <div className="flex justify-between items-center border-t border-border/60 pt-3">
                <span className="text-xs text-slate-500 font-medium tracking-wider">Venture Assembly Engine</span>
                <button
                  type="submit"
                  disabled={loading || !idea.trim()}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-2.5 text-xs font-bold text-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.25)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Synthesizing...' : 'Generate Blueprint'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 flex items-center gap-2 max-w-lg mx-auto">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Blueprint display */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-4"
            >
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500/20 border-t-amber-500" />
              <p className="text-sm text-slate-400 animate-pulse">Running architectural analysis, mapping tech dependencies, and structuring budget logs...</p>
            </motion.div>
          ) : blueprint ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-10"
            >
              {/* Executive Metrics Dashboard */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-2 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent)] pointer-events-none" />
                  <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Estimated Cost</span>
                  <p className="text-3xl font-extrabold text-white">
                    ${blueprint.costEstimate || blueprint.estimatedCostBreakdown?.total || '4,200'}
                  </p>
                </div>
                
                <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-2 relative overflow-hidden">
                  <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Launch Timeline</span>
                  <p className="text-3xl font-extrabold text-white">
                    {blueprint.launchTimeline || blueprint.estimatedLaunchTime || '28 Days'}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-2 relative overflow-hidden">
                  <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Funding Potential</span>
                  <p className="text-3xl font-extrabold text-amber-400">
                    {blueprint.fundingPotential || '82%'}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-2 relative overflow-hidden">
                  <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Startup Readiness</span>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-3xl font-extrabold text-emerald-400">
                      {blueprint.startupReadinessScore || '91'}%
                    </p>
                    <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${blueprint.startupReadinessScore || 91}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Column Layout: Venture Pillars on Left, Executive/Roadmap on Right */}
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Columns - The 8 Core Pillars */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-6 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-border/40 pb-4">
                      <Layers className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
                      <h2 className="text-lg font-bold text-white tracking-tight">The 8 Pillars of Venture Architecture</h2>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      {/* Pillar 1: Domains */}
                      <div className="p-4 rounded-xl border border-border bg-black/40 space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Globe className="h-4 w-4 text-emerald-400" /> 1. Domain
                        </h4>
                        <p className="text-xs text-slate-300 font-semibold">{blueprint.requiredAssets?.domains?.[0] || 'cropvision.ai'}</p>
                      </div>

                      {/* Pillar 2: Websites & SaaS */}
                      <div className="p-4 rounded-xl border border-border bg-black/40 space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4 text-cyan-400" /> 2. SaaS/Website
                        </h4>
                        <p className="text-xs text-slate-300 font-semibold">{blueprint.requiredAssets?.websites?.[0] || 'Agriculture yield predictive storefront'}</p>
                      </div>

                      {/* Pillar 3: Apps */}
                      <div className="p-4 rounded-xl border border-border bg-black/40 space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4 text-amber-500" /> 3. App Listing
                        </h4>
                        <p className="text-xs text-slate-300 font-semibold">{blueprint.requiredAssets?.apps?.[0] || 'Mobile yield assistant iOS & Android'}</p>
                      </div>

                      {/* Pillar 4: Datasets */}
                      <div className="p-4 rounded-xl border border-border bg-black/40 space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Database className="h-4 w-4 text-purple-400" /> 4. Dataset
                        </h4>
                        <p className="text-xs text-slate-300 font-semibold">
                          {blueprint.recommendedDataset?.title || blueprint.requiredAssets?.datasets?.[0] || 'Agriculture yield dataset (100k records)'}
                        </p>
                        {blueprint.recommendedDataset?.datasetSize && (
                          <span className="text-[10px] text-slate-500 font-medium block">
                            Size: {blueprint.recommendedDataset.datasetSize} • Quality Score: {blueprint.recommendedDataset.dataQualityScore}%
                          </span>
                        )}
                      </div>

                      {/* Pillar 5: ML Models */}
                      <div className="p-4 rounded-xl border border-border bg-black/40 space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Hammer className="h-4 w-4 text-yellow-400" /> 5. ML Model
                        </h4>
                        <p className="text-xs text-slate-300 font-semibold">
                          {blueprint.recommendedModel?.title || blueprint.requiredAssets?.models?.[0] || 'Crop Prediction ResNet Model'}
                        </p>
                        {blueprint.recommendedModel?.accuracy && (
                          <span className="text-[10px] text-slate-500 font-medium block">
                            Acc: {(blueprint.recommendedModel.accuracy * 100).toFixed(1)}% • Framework: {blueprint.recommendedModel.framework}
                          </span>
                        )}
                      </div>

                      {/* Pillar 6: AI Agents */}
                      <div className="p-4 rounded-xl border border-border bg-black/40 space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Cpu className="h-4 w-4 text-pink-400" /> 6. AI Agent
                        </h4>
                        <p className="text-xs text-slate-300 font-semibold">{blueprint.requiredAssets?.agents?.[0] || 'AgriBot field assistant agent'}</p>
                      </div>

                      {/* Pillar 7: Freelancers (Guild) */}
                      <div className="p-4 rounded-xl border border-border bg-black/40 space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <UserCheck className="h-4 w-4 text-blue-400" /> 7. Guild Talent
                        </h4>
                        <p className="text-xs text-slate-300 font-semibold">{blueprint.requiredAssets?.freelancers?.join(', ') || 'AI Engineer, Fullstack React Developer'}</p>
                      </div>

                      {/* Pillar 8: Investors (Capital Connect) */}
                      <div className="p-4 rounded-xl border border-border bg-black/40 space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Network className="h-4 w-4 text-red-400" /> 8. Capital Connect
                        </h4>
                        <p className="text-xs text-slate-300 font-semibold">{blueprint.requiredAssets?.investors?.join(', ') || 'AgriTech Capital Partners'}</p>
                      </div>
                    </div>
                  </div>

                  {/* 4-Phase Roadmap */}
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-sm">
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-emerald-400" /> Implementation Roadmap
                    </h2>
                    <div className="relative border-l border-border pl-6 ml-3 space-y-6 py-2">
                      {blueprint.roadmap?.map((r: any) => (
                        <div key={r.step} className="relative">
                          <span className="absolute -left-[37px] top-0.5 grid h-6 w-6 place-items-center rounded-full bg-slate-950 border border-emerald-500/50 text-[10px] font-bold text-emerald-400">
                            {r.step}
                          </span>
                          <div className="space-y-1">
                            <h4 className="font-bold text-white text-sm">{r.title}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">{r.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column - Executive Core */}
                <div className="space-y-6">
                  {/* Executive Summary */}
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-sm">
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-400" /> Executive Analysis
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Idea Synthesis</p>
                        <p className="text-xs text-slate-300 mt-1">{blueprint.ideaSummary}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Value Proposition</p>
                        <p className="text-xs text-slate-300 mt-1">{blueprint.valueProposition}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Revenue model</p>
                        <p className="text-xs text-slate-300 mt-1">{blueprint.businessModel}</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Cost Breakdown */}
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-sm">
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-saffron-400" /> AI Tech Stack Estimates
                    </h2>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Model Licensing Cost:</span>
                        <span className="font-bold text-white">${blueprint.estimatedModelCost !== undefined ? blueprint.estimatedModelCost.toLocaleString() : '2,800'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Dataset Procurement Cost:</span>
                        <span className="font-bold text-white">${blueprint.estimatedDatasetCost !== undefined ? blueprint.estimatedDatasetCost.toLocaleString() : '950'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">AI Infrastructure Cost:</span>
                        <span className="font-bold text-emerald-400">${blueprint.estimatedAiInfraCost !== undefined ? blueprint.estimatedAiInfraCost.toLocaleString() : '450'}/mo</span>
                      </div>
                      <div className="border-t border-border/40 pt-2 flex justify-between items-center font-bold text-white text-xs">
                        <span>Total AI Setup Budget:</span>
                        <span className="text-amber-500">
                          ${((blueprint.estimatedModelCost || 2800) + (blueprint.estimatedDatasetCost || 950)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Acquisition CTA */}
                  <div className="rounded-2xl border border-border bg-surface-card p-6 space-y-4 shadow-sm text-center">
                    <h3 className="text-sm font-bold text-white">Acquire Venture Pillars</h3>
                    <p className="text-xs text-slate-400">
                      Instantly purchase the domain name, SaaS codebase, AI models, and matching dataset compiled above.
                    </p>
                    <a 
                      href={`/marketplace?tab=domains`}
                      className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-3 text-xs font-bold text-black shadow-glow flex items-center justify-center gap-1.5 transition-all mt-4"
                    >
                      Browse matching exchange catalog
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 border border-border/40 rounded-2xl bg-surface-card/30 max-w-2xl mx-auto space-y-2"
            >
              <Sparkles className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-base text-slate-400 font-semibold">Engine Ready</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Input your startup concept in the console above and trigger synthesis to generate your custom Startup Blueprint.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}
