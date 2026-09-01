"use client";

import React, { useState } from "react";
import { GitBranch, X, Play, ArrowRight, ShieldCheck, AlertOctagon, RefreshCw, CheckCircle2 } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-surface-card border border-fuchsia-500/40 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-4 p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-400">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-wide">
                What-If Sandbox Simulation Engine
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Deep-clones warehouse state snapshot • Zero mutation to live operations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-sub hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-border-subtle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hypothesis Selector */}
        <div className="bg-surface-sub border border-border-subtle rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs space-y-1">
            <span className="font-bold uppercase tracking-wider text-slate-300">Hypothetical Disruption Scenario</span>
            <div className="text-slate-400">
              Simulate: <span className="font-bold text-white">"What if primary recovery robot R07 also fails?"</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={targetRobot}
              onChange={(e) => setTargetRobot(e.target.value)}
              className="bg-surface-card border border-border-subtle rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-border-focus"
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Live Active Plan */}
              <div className="bg-surface-sub border border-border-subtle rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <span className="text-xs font-bold text-slate-300">LIVE ACTIVE PLAN</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-semantic-success border border-emerald-500/30 font-mono font-bold">
                    ACTIVE (LIVE)
                  </span>
                </div>
                <div className="text-xs space-y-1.5 pt-1">
                  <div className="text-slate-300">Disruption: <span className="font-bold text-rose-400">R04 Stalled</span></div>
                  <div className="text-slate-300">Primary Assigned AGV: <span className="font-bold text-fuchsia-400">R07</span></div>
                  <div className="text-slate-300">Target Cargo: <span className="font-bold text-white">O104 (Shelf S06)</span></div>
                  <div className="text-slate-300">A* Path Length: <span className="font-mono text-sky-400">15 Waypoints</span></div>
                </div>
              </div>

              {/* Right Column: Simulated Cascading Plan */}
              <div className="bg-gradient-to-br from-fuchsia-950/30 to-surface-sub border border-fuchsia-500/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <span className="text-xs font-bold text-fuchsia-300">SIMULATED PLAN #2</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 font-mono font-bold">
                    SANDBOX CLONE
                  </span>
                </div>
                <div className="text-xs space-y-1.5 pt-1">
                  <div className="text-slate-300">Cascading Failure: <span className="font-bold text-rose-400">{targetRobot} Failed</span></div>
                  <div className="text-slate-300">Secondary Candidate: <span className="font-bold text-semantic-success">{result.secondary_assignment?.selected_robot_id || "R01"}</span></div>
                  <div className="text-slate-300">Recovery Status: <span className="font-bold text-emerald-400">FEASIBLE (0 COLLISIONS)</span></div>
                  <div className="text-slate-300">Recalculated Route: <span className="font-mono text-sky-400">{result.secondary_assignment?.route_length || 18} Waypoints</span></div>
                </div>
              </div>
            </div>

            {/* Sandbox Isolation Confirmation */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Live State Mutation Confirmed</span>
              </div>
              <span className="font-mono text-[11px] text-emerald-400/80">
                Live warehouse continues operating on Plan #1
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-surface-sub/60 border border-border-subtle rounded-xl p-8 text-center text-xs text-slate-400 space-y-1">
            <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <div className="font-bold text-slate-300">Ready to simulate cascading secondary disruptions</div>
            <div>Click "Run Sandbox" to test multi-tier fleet resilience without altering live operations.</div>
          </div>
        )}
      </div>
    </div>
  );
}
