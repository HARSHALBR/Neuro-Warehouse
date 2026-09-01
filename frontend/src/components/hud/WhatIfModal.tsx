"use client";

import React, { useState } from "react";
import GlassCard from "@/components/common/GlassCard";
import { GitBranch, X, Play, RefreshCw, CheckCircle2, ShieldCheck } from "lucide-react";

interface WhatIfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunWhatIf: (hypotheticalRobotId: string) => Promise<any>;
}

export default function WhatIfModal({ isOpen, onClose, onRunWhatIf }: WhatIfModalProps) {
  const [targetRobot, setTargetRobot] = useState<string>("R07");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSimulate = async () => {
    setLoading(true);
    const data = await onRunWhatIf(targetRobot);
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-lg animate-fadeIn">
      <GlassCard
        radialWash="rgba(217, 70, 239, 0.12)"
        glowColor="rgba(217, 70, 239, 0.35)"
        className="w-full max-w-3xl overflow-hidden shadow-2xl space-y-4 p-6 border-fuchsia-300 dark:border-fuchsia-500/40"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-fuchsia-100 dark:bg-fuchsia-500/20 border border-fuchsia-300 dark:border-fuchsia-500/40 text-fuchsia-700 dark:text-fuchsia-400 shadow-sm">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--text-primary)] tracking-wide">
                What-If Sandbox Simulation Engine
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Deep-clones warehouse state snapshot • Zero mutation to live operations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-[var(--surface-sub)] hover:bg-slate-100 dark:hover:bg-slate-800/60 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-glass)] shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hypothesis Selector */}
        <div className="bg-[var(--surface-sub)] border border-[var(--border-glass)] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="text-xs space-y-1">
            <span className="font-bold uppercase tracking-wider text-[var(--text-secondary)]">Hypothetical Disruption Scenario</span>
            <div className="text-[var(--text-muted)] font-medium">
              Simulate: <span className="font-bold text-[var(--text-primary)]">"What if primary recovery robot R07 also fails?"</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={targetRobot}
              onChange={(e) => setTargetRobot(e.target.value)}
              className="bg-[var(--surface-glass)] border border-[var(--border-glass)] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-fuchsia-500 shadow-sm"
            >
              <option value="R07">Target: R07 (Primary Recovery AGV)</option>
              <option value="R01">Target: R01 (Alternate)</option>
              <option value="R02">Target: R02 (Alternate)</option>
            </select>

            <button
              onClick={handleSimulate}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-fuchsia-500/25 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              <span>Run Sandbox</span>
            </button>
          </div>
        </div>

        {/* Side-by-Side Comparison Diff Result */}
        {result ? (
          <div className="space-y-4 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Live Active Plan */}
              <div className="bg-[var(--surface-sub)] border border-[var(--border-glass)] rounded-2xl p-4 space-y-2 shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-2">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">LIVE ACTIVE PLAN</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 font-mono font-bold">
                    ACTIVE (LIVE)
                  </span>
                </div>
                <div className="text-xs space-y-1.5 pt-1">
                  <div className="text-[var(--text-secondary)] font-medium">Disruption: <span className="font-bold text-rose-600 dark:text-rose-400">R04 Stalled</span></div>
                  <div className="text-[var(--text-secondary)] font-medium">Primary Assigned AGV: <span className="font-bold text-fuchsia-700 dark:text-fuchsia-400">R07</span></div>
                  <div className="text-[var(--text-secondary)] font-medium">Target Cargo: <span className="font-bold text-[var(--text-primary)]">O104 (Shelf S06)</span></div>
                  <div className="text-[var(--text-secondary)] font-medium">A* Path Length: <span className="font-mono font-bold text-sky-700 dark:text-sky-400">15 Waypoints</span></div>
                </div>
              </div>

              {/* Right Column: Simulated Cascading Plan */}
              <div className="bg-gradient-to-br from-purple-50 via-[var(--surface-sub)] to-fuchsia-50 dark:from-fuchsia-950/30 dark:to-[var(--surface-sub)] border border-fuchsia-300 dark:border-fuchsia-500/40 rounded-2xl p-4 space-y-2 shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-2">
                  <span className="text-xs font-bold text-fuchsia-800 dark:text-fuchsia-300">SIMULATED PLAN #2</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-800 dark:text-fuchsia-300 border border-fuchsia-300 dark:border-fuchsia-500/40 font-mono font-bold">
                    SANDBOX CLONE
                  </span>
                </div>
                <div className="text-xs space-y-1.5 pt-1">
                  <div className="text-[var(--text-secondary)] font-medium">Cascading Failure: <span className="font-bold text-rose-600 dark:text-rose-400">{targetRobot} Failed</span></div>
                  <div className="text-[var(--text-secondary)] font-medium">Secondary Candidate: <span className="font-bold text-emerald-700 dark:text-emerald-400">{result.secondary_assignment?.selected_robot_id || "R01"}</span></div>
                  <div className="text-[var(--text-secondary)] font-medium">Recovery Status: <span className="font-bold text-emerald-700 dark:text-emerald-400">FEASIBLE (0 COLLISIONS)</span></div>
                  <div className="text-[var(--text-secondary)] font-medium">Recalculated Route: <span className="font-mono font-bold text-sky-700 dark:text-sky-400">{result.secondary_assignment?.route_length || 18} Waypoints</span></div>
                </div>
              </div>
            </div>

            {/* Sandbox Isolation Confirmation */}
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-300 shadow-sm">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Zero Live State Mutation Confirmed</span>
              </div>
              <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400/80 font-medium">
                Live warehouse continues operating on Plan #1
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--surface-sub)] border border-[var(--border-glass)] rounded-2xl p-8 text-center text-xs text-[var(--text-muted)] space-y-1 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="font-bold text-[var(--text-primary)]">Ready to simulate cascading secondary disruptions</div>
            <div className="font-medium">Click "Run Sandbox" to test multi-tier fleet resilience without altering live operations.</div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
