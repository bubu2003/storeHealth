'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { id: 1, text: "Warming up virtual auditor...", duration: 3000 },
  { id: 2, text: "Launching browser snapshot engine...", duration: 5000 },
  { id: 3, text: "Capturing full-page layout & visuals...", duration: 8000 },
  { id: 4, text: "AI is analyzing conversion friction...", duration: 7000 },
  { id: 5, text: "Generating catalog SEO fixes...", duration: 6000 },
  { id: 6, text: "Finalizing your growth roadmap...", duration: 5000 },
  { id: 7, text: "Securing your audit report...", duration: 5000 },
];

export default function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const runSteps = (index: number) => {
      if (index >= STEPS.length) return;
      
      timer = setTimeout(() => {
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
        runSteps(index + 1);
      }, STEPS[index].duration);
    };

    runSteps(0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] text-center px-4 sm:px-6">
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-8 sm:mb-12">
        {/* Outer Glow */}
        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
        
        {/* Animated Rings */}
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-indigo-500/10 rounded-full"
        />
        <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-3 sm:inset-4 border-2 border-indigo-500/30 rounded-full border-t-indigo-500"
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-indigo-500 rounded-full animate-ping" />
        </div>
      </div>

      <div className="space-y-4 max-w-[280px] sm:max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="space-y-2"
          >
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {STEPS[currentStep].text}
            </h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
              Step {currentStep + 1} of {STEPS.length}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-8">
           <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
           />
        </div>
        
        <p className="text-[10px] text-slate-600 font-medium italic mt-4">
           Analyzing visual hierarchy, catalog SEO, and conversion markers.
        </p>
      </div>
    </div>
  );
}
