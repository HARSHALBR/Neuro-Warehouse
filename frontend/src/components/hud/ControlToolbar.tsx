"use client";

import React from "react";
import { RotateCcw, AlertTriangle, GitBranch, Smartphone, ExternalLink, RefreshCw } from "lucide-react";

interface ControlToolbarProps {
  onReset: () => void;
  onFailR04: () => void;
  onOpenWhatIf: () => void;
  isProcessing: boolean;
}

export default function ControlToolbar({
  onReset,
  onFailR04,
  onOpenWhatIf,
  isProcessing,
}: ControlToolbarProps) {
  return (
    <div className="bg-surface-card border border-border-subtle rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
      {/* Primary Golden Demo Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 1. Safe Reset Action */}
        <button
          onClick={onReset}
          disabled={isProcessing}
          className="px-4 py-2.5 rounded-xl border border-border-subtle bg-surface-sub hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold font-mono flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4 text-slate-400" />
          <span>RESET DEMO</span>
        </button>

        {/* 2. Consequence-Weighted Destructive Trigger */}
        <button
          onClick={onFailR04}
          disabled={isProcessing}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg hover:shadow-rose-500/25 border border-rose-500/50 disabled:opacity-50"
        >
          {isProcessing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
          )}
          <span>BREAK R04 (GOLDEN DEMO)</span>
        </button>

        {/* 3. What-If Simulation Button */}
        <button
          onClick={onOpenWhatIf}
          disabled={isProcessing}
          className="px-4 py-2.5 rounded-xl bg-surface-sub hover:bg-fuchsia-950/40 border border-fuchsia-500/40 text-fuchsia-300 hover:text-fuchsia-200 text-xs font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
        >
          <GitBranch className="w-4 h-4 text-fuchsia-400" />
          <span>WHAT-IF R07</span>
        </button>
      </div>

      {/* iQOO Mobile Client Link */}
      <div className="flex items-center gap-2">
        <a
          href="/mobile/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/40 text-sky-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all"
        >
          <Smartphone className="w-4 h-4 text-sky-400" />
          <span>iQOO Mobile Operator Client</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
      </div>
    </div>
  );
}
