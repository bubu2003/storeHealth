'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import LoadingState from '@/components/LoadingState';
import ResultsView from '@/components/ResultsView';
import { AnalysisResult } from '@/lib/ai-grader';
import { AnimatePresence, motion } from 'framer-motion';

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (url: string) => {
      setError(null);
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed');
      return data.analysis as AnalysisResult;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      // Scroll to results
      setTimeout(() => {
        window.scrollTo({ top: 600, behavior: 'smooth' });
      }, 100);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleAnalyze = (url: string) => {
    mutation.mutate(url);
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen">
      <Navbar />
      
      <Hero 
        onAnalyze={handleAnalyze} 
        isLoading={mutation.isPending} 
      />

      <section className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {mutation.isPending && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20"
            >
              <LoadingState />
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto px-6 py-12"
            >
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center">
                <h3 className="text-xl font-bold text-rose-400 mb-2">Analysis Failed</h3>
                <p className="text-slate-400 mb-6">{error}</p>
                <button 
                  onClick={handleReset}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}

          {analysisResult && !mutation.isPending && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-10 transition-all"
            >
              <ResultsView data={analysisResult} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Footer / Social Proof */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm">
            &copy; 2026 StorePulse AI. Built for the Merchant Hub Hackathon.
          </p>
        </div>
      </footer>
    </main>

  );
}
