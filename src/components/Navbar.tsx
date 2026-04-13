'use client';

import React from 'react';
import { Activity, Globe } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-6">
      <div className="glass px-6 py-3 rounded-2xl flex items-center justify-between w-full max-w-7xl">
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="bg-indigo-500/20 p-2 rounded-lg group-hover:bg-indigo-500/30 transition-colors">
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Store<span className="text-gradient">Pulse</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">How it Works</Link>
          <div className="w-px h-4 bg-white/10" />
          <a 
            href="#" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Globe className="w-5 h-5" />
          </a>
        </div>
      </div>
    </nav>


  );
}
