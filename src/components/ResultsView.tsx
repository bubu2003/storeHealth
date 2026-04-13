'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AnalysisResult } from '@/lib/ai-grader';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { generatePDF } from '@/lib/pdf-generator';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ResultsViewProps {
  data: AnalysisResult;
}

export default function ResultsView({ data }: ResultsViewProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 relative font-sans">
      {/* Refined Background - Subtle */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="flex flex-col gap-16 relative z-10 pt-10">
        {/* HERO SECTION */}
        <section className="bg-slate-900/40 border border-white/5 p-6 sm:p-10 md:p-14 rounded-3xl sm:rounded-[2.5rem] shadow-sm">
          <div className="md:flex gap-10 lg:gap-16 items-center">
            {/* Health Score */}
            <div className="shrink-0 mb-8 md:mb-0 flex justify-center">
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="50%" cy="50%" r="46%" className="stroke-slate-800 fill-none stroke-[4px]" />
                  <motion.circle
                    cx="50%" cy="50%" r="46%"
                    initial={{ strokeDashoffset: 100 }}
                    animate={{ strokeDashoffset: 100 - data.score }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={cn(
                      "fill-none stroke-[6px] stroke-linecap-round transition-all",
                      data.score >= 70 ? "stroke-emerald-500" : data.score >= 40 ? "stroke-yellow-500" : "stroke-rose-500"
                    )}
                    strokeDasharray="100 100"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl md:text-6xl font-black">{data.score}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Health</span>
                </div>
              </div>
            </div>

            <div className="grow space-y-6 sm:space-y-8 text-center md:text-left">
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black leading-[1.15] text-white">
                   {data.summary.includes('.') ? data.summary.split('.')[0] + '.' : data.summary}
                </h1>
                <p className="text-slate-400 text-base sm:text-lg md:text-xl font-medium max-w-2xl">
                  {data.summary.includes('.') ? (data.summary.split('.')[1] || "Unlock deep insights with AI-powered analysis.") : ""}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4 sm:gap-5 justify-center md:justify-start">
                <button 
                   onClick={() => generatePDF(data, 'Store')}
                   className="w-full sm:w-auto px-10 py-5 bg-white text-slate-950 rounded-2xl font-black hover:bg-slate-100 transition-all text-sm uppercase tracking-wide"
                >
                  Download Full Strategy
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* SIDEBAR */}
          <aside className="lg:col-span-1 space-y-10">
            {/* Growth Roadmap */}
            <div className="bg-slate-900/40 border border-white/5 p-8 rounded-4xl">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8">Priority Roadmap</h3>
              <div className="space-y-10 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                {data.growthScopes?.map((scope, idx) => (
                  <div key={idx} className="relative pl-12 group">
                    <div className={cn(
                      "absolute left-0 top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black",
                      idx === 0 ? "bg-indigo-500 border-indigo-500 text-white" : "bg-slate-900 border-slate-700 text-slate-500"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className={cn("font-bold text-base", idx === 0 ? "text-white" : "text-slate-400")}>{scope.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {scope.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Breakdown */}
            <div className="bg-slate-900/40 border border-white/5 p-8 rounded-4xl space-y-8">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Core Performance</h3>
              <div className="space-y-7">
                {Object.entries(data.categories).map(([key, score]) => (
                  <div key={key} className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                      <span className="text-slate-400">{key}</span>
                      <span className={cn(
                        score >= 80 ? "text-emerald-400" : score >= 50 ? "text-yellow-400" : "text-rose-400"
                      )}>
                        {score >= 80 ? 'Optimized' : score >= 50 ? 'Stable' : 'Weak'}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5 }}
                        className={cn(
                          "h-full rounded-full",
                          score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-yellow-500" : "bg-rose-500"
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Insights */}
            <div className="bg-slate-900/40 border border-white/5 p-8 rounded-4xl space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Strategic Insights</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/2 border border-white/5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Trust</span>
                  <p className="text-2xl font-black text-white">{data.sellerInsights.trustScore}%</p>
                </div>
                <div className="p-5 rounded-2xl bg-white/2 border border-white/5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Potential</span>
                  <p className="text-2xl font-black text-white">{data.sellerInsights.growthPotential}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">{data.sellerInsights.marketPositioning}</p>
            </div>
          </aside>

          {/* MAIN ACTIONS */}
          <main className="lg:col-span-2 space-y-10">
             {/* Catalog Optimization Section */}
             {data.specificProductFixes && data.specificProductFixes.length > 0 && (
               <div className="space-y-8">
                 <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white px-1">Catalog SEO Audit</h2>
                      <p className="text-slate-500 text-sm font-medium mt-1 px-1">One-by-one optimization for your top {data.specificProductFixes.length} products.</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 gap-6">
                   {data.specificProductFixes.map((fix, idx) => (
                     <motion.div
                       key={idx}
                       initial={{ opacity: 0, y: 20 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: 0.05 * idx }}
                       className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/5 relative overflow-hidden group"
                     >
                       {/* Subtle Index Number */}
                       <div className="absolute top-4 right-8 text-8xl font-black text-white/5 pointer-events-none group-hover:text-white/10 transition-colors">
                         {idx + 1}
                       </div>

                       <div className="flex flex-col gap-8 relative z-10">
                         {/* Name Comparison */}
                         <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                           <div className="flex-1 space-y-2">
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Name</span>
                             <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-slate-400 font-medium line-through decoration-rose-500/50">
                               {fix.originalName}
                             </div>
                           </div>
                           
                           <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 border border-white/5">
                             <ChevronRight className="w-5 h-5 text-slate-500" />
                           </div>
    
                           <div className="flex-2 w-full md:w-auto md:flex-1 space-y-2">
                             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">SEO Optimized Name</span>
                             <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-white font-black text-lg shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                               {fix.optimizedName}
                             </div>
                           </div>
                         </div>

                         {/* AI Logic Breakdown */}
                         <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-6 border-t border-white/5">
                           <div className="md:col-span-8 space-y-4">
                             <h4 className="text-xs font-black text-white uppercase tracking-wider">Optimization Reason</h4>
                             <p className="text-sm text-slate-400 leading-relaxed italic">
                               &quot;{fix.reason}&quot;
                             </p>
                             
                             {fix.details?.seoKeywords && (
                               <div className="flex flex-wrap gap-2 pt-2">
                                 {fix.details.seoKeywords.map((kw, i) => (
                                   <span key={i} className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-wider border border-indigo-500/20">
                                      #{kw}
                                   </span>
                                 ))}
                               </div>
                             )}
                           </div>

                           <div className="md:col-span-4 grid grid-cols-1 gap-4">
                             {fix.details?.materials && (
                               <div className="space-y-1">
                                 <span className="text-[9px] font-black text-slate-500 uppercase">Key Materials</span>
                                 <p className="text-xs text-white font-bold">{fix.details.materials}</p>
                               </div>
                             )}
                             {fix.details?.style && ( fix.details.style !== 'N/A' && (
                               <div className="space-y-1">
                                 <span className="text-[9px] font-black text-slate-500 uppercase">Suggested Style</span>
                                 <p className="text-xs text-white font-bold">{fix.details.style}</p>
                               </div>
                             ))}
                           </div>
                         </div>
                       </div>
                     </motion.div>
                   ))}
                 </div>
               </div>
             )}

             {/* Visual Store Snapshot Section */}
             {data.screenshot && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-black text-white px-1">Visual Store Snapshot</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1 px-1">This high-fidelity capture was used by our AI to audit your layout and trust signals.</p>
                  </div>
                  
                  <div className="relative group/screenshot p-1.5 bg-slate-800/30 border border-white/5 rounded-4xl overflow-hidden">
                    <div className="max-h-[600px] overflow-y-auto scrollbar-hide rounded-4xl bg-slate-950 p-2">
                      <img 
                        src={`data:image/jpeg;base64,${data.screenshot}`} 
                        alt="Store Screenshot"
                        className="w-full h-auto rounded-2xl grayscale-[0.2] contrast-[1.1]"
                      />
                    </div>
                    {/* Visual Overlay - Scanner Effect */}
                    <div className="absolute inset-x-2 top-2 h-0.5 bg-indigo-500/50 blur-sm animate-[scan_4s_ease-in-out_infinite] pointer-events-none" />
                    
                    <div className="absolute inset-x-8 bottom-8 flex justify-center">
                      <div className="px-6 py-3 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white/70 shadow-2xl">
                        AI Vision Analysis Active • Full Page Capture
                      </div>
                    </div>
                  </div>
                </div>
             )}

             <div className="flex items-center justify-between pb-4">
                <h2 className="text-3xl font-black text-white">Step-by-Step Strategy</h2>
             </div>

             <div className="space-y-6">
                {data.recommendations.map((rec, idx) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 * idx }}
                    className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem]"
                  >
                    <div className="space-y-8">
                       <div className="space-y-1">
                          <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">{rec.category} • {rec.effort}</span>
                          <h3 className="text-2xl font-bold text-white tracking-tight">{rec.title}</h3>
                       </div>
                       
                       <p className="text-slate-400 text-base leading-relaxed font-medium">{rec.description}</p>

                       <div className="flex flex-col md:flex-row items-center gap-6">
                          <div className="w-full md:w-1/2 p-6 rounded-2xl bg-white/2 border border-white/5">
                             <span className="text-[8px] font-black text-slate-600 uppercase block mb-2">Current</span>
                             <p className="text-sm text-slate-500 italic pr-8">{rec.currentValue || 'Needs setup'}</p>
                          </div>
                          
                          <div className="hidden md:block text-slate-700">
                             <ChevronRight className="w-6 h-6" />
                          </div>

                          <div className="w-full md:w-1/2 p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 shadow-sm">
                             <span className="text-[8px] font-black text-indigo-400 uppercase block mb-2">Suggestion</span>
                             <p className="text-sm text-white font-bold pr-8">{rec.suggestedValue}</p>
                          </div>
                       </div>

                       <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 uppercase tracking-widest font-black text-[10px]">
                          <div className="flex items-center gap-2 text-slate-500">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            {rec.whyItMatters}
                          </div>
                          <button className="text-white bg-slate-800 px-5 py-3 rounded-xl hover:bg-slate-700 transition-colors">
                            How to fix
                          </button>
                       </div>
                    </div>
                  </motion.div>
                ))}
             </div>
          </main>
        </div>
      </div>
    </div>
  );
}
