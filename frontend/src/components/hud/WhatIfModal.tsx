"use client";

import React, { useState } from "react";
import { GitBranch, X, Play, ArrowRight, ShieldCheck, AlertOctagon } from "lucide-react";

interface WhatIfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunWhatIf: (targetRobotId: string) => Promise<any>;
}

export default function WhatIfModal({ isOpen, onClose, onRunWhatIf }: WhatIfModalProps) {
  const [targetRobot, setTargetRobot] = useState<string>("R07");
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExecute = async () => {
    setIsLoading(true);
    try {
      const data = await onRunWhatIf(targetRobot);
      setResult(data);
    } catch (e) {
      console.error("What-If execution failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#0f141f] border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#090c13]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">What-If Simulation Sandbox</h3>
              <p className="text-xs text-slate-400">Deep-clones warehouse state snapshot; zero mutation to live operations.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <div className="bg-[#07090e] border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-300">Hypothetical Scenario</div>
              <div className="text-sm font-mono text-purple-300 font-bold">
                "What if Robot {targetRobot} also fails during recovery?"
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={targetRobot}
                onChange={(e) => setTargetRobot(e.target.value)}
                className="bg-[#121824] border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono"
              >
                {["R07", "R05", "R09", "R01", "R02", "R10", "R12"].map((r) => (
                  <option key={r} value={r}>Fail {r}</option>
                ))}
              </select>
              <button
                onClick={handleExecute}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isLoading ? "Simulating..." : "Run Sandbox"}</span>
              </button>
            </div>
          </div>

          {/* Results Comparison */}
          {result ? (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-3">
                {/* Baseline Card */}
                <div className="bg-[#090c13] border border-slate-800 rounded-xl p-3.5">
                  <div className="text-xs text-slate-400 font-semibold mb-1">Baseline Recovery Plan</div>
                  <div className="text-base font-bold font-mono text-emerald-400">R04 $\rightarrow$ {result.baseline_selected_robot || "R07"}</div>
                  <div className="text-xs text-slate-400 mt-2 font-mono">Efficiency: {result.baseline_efficiency.toFixed(1)}%</div>
                </div>

                {/* Simulated Alternative Card */}
                <div className="bg-[#090c13] border border-purple-500/30 rounded-xl p-3.5">
                  <div className="text-xs text-purple-300 font-semibold mb-1">Simulated Cascading Plan</div>
                  <div className="text-base font-bold font-mono text-purple-400">
                    {result.hypothetical_failed_robot} $\rightarrow$ {result.simulated_selected_robot || "Next Optimal"}
                  </div>
                  <div className="text-xs text-slate-400 mt-2 font-mono">Predicted Efficiency: {result.simulated_efficiency.toFixed(1)}%</div>
                </div>
              </div>

              {/* Impact Analysis Narrative */}
              <div className="bg-[#090c13] border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed font-sans">
                <div className="font-bold text-purple-400 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sandbox Deliberation Analysis</span>
                </div>
                {result.impact_analysis}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Click <strong>"Run Sandbox"</strong> to execute the full LangGraph closed-loop recovery across the cloned state.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#090c13] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all"
          >
            Close Sandbox
          </button>
        </div>
      </div>
    </div>
  );
}
