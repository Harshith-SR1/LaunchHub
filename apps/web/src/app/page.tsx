'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, Sparkles, ShieldCheck, Globe, Cpu, Database, Users, TrendingUp, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/navigator?query=${encodeURIComponent(query)}`);
    }
  };

  const featureAssets = [
    { icon: Globe, title: "Asset Exchange", desc: "Buy, sell, rent, or lease-to-own premium brandable domain assets.", path: "/marketplace?tab=domains" },
    { icon: TrendingUp, title: "Website & SaaS", desc: "Acquire revenue-generating products, SaaS tools, and business models.", path: "/marketplace?tab=websites" },
    { icon: Briefcase, title: "App Exchange", desc: "Acquire production-grade iOS, Android, and web applications.", path: "/marketplace?tab=apps" },
    { icon: Database, title: "AI Datasets", desc: "Source verified data logs, parameters, and fine-tuning datasets.", path: "/marketplace?tab=ai" },
    { icon: Cpu, title: "ML Models & Agents", desc: "Acquire pre-trained parameters or rent customized autonomous AI agents.", path: "/marketplace?tab=ai" },
    { icon: Users, title: "Guild Network (Talent)", desc: "Assemble expert engineering squads, match co-founders, or hire agencies.", path: "/marketplace?tab=talent" }
  ];

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-bg grid-bg pb-20">
      {/* Sacred Geometry Mandala & Star Map overlay */}
      <div className="sacred-overlay" />

      {/* Background aurora glow spots */}
      <div className="absolute top-0 left-1/2 h-[500px] w-full max-w-7xl -translate-x-1/2 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(205,127,50,0.08),transparent_80%)] pointer-events-none" />

      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-6 py-6 lg:px-10">
        {/* Navigation Bar */}
        <header className="flex items-center justify-between rounded-full border border-border bg-black/40 px-6 py-3 shadow-glass backdrop-blur-md">
          <div className="flex items-center gap-3 font-semibold tracking-tight">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 text-black font-extrabold shadow-glow">
              L
            </div>
            <span className="text-xl font-bold tracking-wider text-white">
              LaunchHub<span className="text-emerald-500">.AI</span>
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex">
            <a href="/marketplace" className="hover:text-emerald-400 transition-colors">Asset Exchange</a>
            <a href="/navigator" className="hover:text-emerald-400 transition-colors">Venture Navigator</a>
            <a href="/blueprint" className="hover:text-emerald-400 transition-colors">Startup Blueprint</a>
            <a href="/dashboard" className="hover:text-emerald-400 transition-colors">Console</a>
          </nav>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Sign In</a>
            <a href="/register" className="rounded-full bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-sm font-semibold text-black shadow-glow hover:shadow-glow-strong transition-all">
              Join Operating System
            </a>
          </div>
        </header>

        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mt-20 lg:mt-28 space-y-8 max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.12)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            DECENTRALIZED OPERATING SYSTEM FOR FOUNDERS
          </motion.div>

          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl lg:text-8xl leading-none"
            >
              Buy. Build. Hire.<br />Fund. <span className="text-gradient-aurora">Launch.</span>
            </motion.h1>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed pt-2">
              Discover, acquire, rent, exchange, and monetize startup assets from one unified ecosystem. 
              The world's first decentralized Operating System for venture creation.
            </p>
          </div>

          {/* AI Search Interface (Venture Navigator Console) */}
          <motion.form
            onSubmit={handleSearchSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="w-full max-w-2xl relative mt-4"
          >
            <div className="relative flex items-center rounded-2xl border border-border bg-black/60 shadow-2xl backdrop-blur-lg p-2 group focus-within:border-amber-500/50 focus-within:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all duration-300">
              <Search className="absolute left-5 h-5 w-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
              <input
                suppressHydrationWarning={true}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you wish to build? (e.g. 'I want to build an AI healthcare startup')"
                className="w-full bg-transparent pl-12 pr-32 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                suppressHydrationWarning={true}
                type="submit"
                className="absolute right-3 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all"
              >
                Scan Engine
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-slate-500">
              <span className="font-semibold text-slate-400">Pillars:</span>
              <a href="/marketplace?tab=domains" className="text-slate-400 hover:text-emerald-400 underline decoration-dotted">Discover Assets</a>
              <span>•</span>
              <a href="/marketplace?tab=talent" className="text-slate-400 hover:text-emerald-400 underline decoration-dotted">Build Teams</a>
              <span>•</span>
              <a href="/marketplace?tab=investors" className="text-slate-400 hover:text-emerald-400 underline decoration-dotted">Raise Capital</a>
              <span>•</span>
              <a href="/blueprint" className="text-slate-400 hover:text-emerald-400 underline decoration-dotted">Launch Faster</a>
            </div>
          </motion.form>
        </div>

        {/* Global Statistics */}
        <div className="mt-20 border-t border-b border-border/60 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-extrabold text-white">14+</p>
              <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase mt-1">Premium Domains Live</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-white">$28,000</p>
              <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase mt-1">SaaS MRR Volume</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-white">45+</p>
              <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase mt-1">Pre-trained AI Models</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-white">92%</p>
              <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase mt-1">User Trust Score Average</p>
            </div>
          </div>
        </div>

        {/* Grid Platform Showcase */}
        <div className="mt-20 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">The LaunchHub Asset Exchange Surface</h2>
            <p className="text-sm text-slate-400">Everything needed to assemble and capitalize digital startups.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureAssets.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  onClick={() => router.push(f.path as any)}
                  className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm hover:border-emerald-500/20 hover:shadow-glow transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 border border-border group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 text-slate-400 group-hover:text-emerald-400 transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{f.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Instant Transfer</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <footer className="mt-24 text-center text-xs text-slate-600">
          <p>© 2026 LaunchHub AI. Built for the Hackathon. DynamoDB Powered.</p>
        </footer>
      </section>
    </main>
  );
}
