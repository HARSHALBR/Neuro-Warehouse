"use client";

import React from "react";
import { RotateCcw, AlertTriangle, GitBranch, Smartphone, ExternalLink } from "lucide-react";

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
    <div className="bg-[#0f141f] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
      {/* Left Demo Control Group */}
      <div className="flex items-center gap-2.5">
        {/* Reset Demo Button */}
        <button
          onClick={onReset}
          disabled={isProcessing}
          className="px-3.5 py-2 rounded-lg bg-[#161c28] hover:bg-[#20293a] border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>RESET DEMO</span>
        </button>

        {/* Golden Demo Trigger: FAIL R04 */}
        <button
          onClick={onFailR04}
          disabled={isProcessing}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>BREAK R04 (GOLDEN DEMO)</span>
        </button>

        {/* What-If Simulation Trigger */}
        <button
          onClick={onOpenWhatIf}
          disabled={isProcessing}
          className="px-3.5 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <GitBranch className="w-3.5 h-3.5 text-purple-400" />
          <span>WHAT-IF R07</span>
        </button>
      </div>

      {/* Right Action: Open Mobile Client */}
      <div className="flex items-center gap-2">
        <a
          href="http://localhost:8000/mobile/"
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-medium flex items-center gap-1.5 transition-all"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>iQOO Mobile Operator Client</span>
          <ExternalLink className="w-3 h-3 text-blue-400/70" />
        </a>
      </div>
    </div>
  );
}
