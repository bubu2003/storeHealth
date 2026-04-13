'use client';

import React, { useState } from 'react';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export default function Hero({ onAnalyze, isLoading }: HeroProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && !isLoading) {
      onAnalyze(url);
    }
  };

  return (
    <div className="relative pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto text-center">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Store Analysis</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            Instantly grade your <br />
            <span className="text-gradient">store health.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Stop guessing and start optimizing. Get actionable recommendations to improve your SEO, conversion rate, and user experience in seconds.
          </p>

          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mt-8 sm:mt-12 px-2 sm:px-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-emerald-500 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000" />
              <div className="relative flex flex-col sm:flex-row items-stretch gap-3 p-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex-1 flex items-center gap-3 px-4 sm:px-6 py-4 sm:py-0">
                  <Search className="w-5 h-5 text-slate-500 shrink-0" />
                  <input
                    type="url"
                    placeholder="Paste your store or product URL here..."
                    className="w-full bg-transparent border-none text-white placeholder-slate-500 focus:ring-0 text-base sm:text-lg"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 py-4 sm:px-8 sm:py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-indigo-500/40 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Scanning...' : (
                    <>
                      <span className="whitespace-nowrap">Analyze Now</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Shopify
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              WooCommerce
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              BuildMyStore
            </div>
          </div>
        </motion.div>
      </div>
    </div>


  );
}
