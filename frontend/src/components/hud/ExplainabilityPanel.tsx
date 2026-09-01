"use client";

import React from "react";
import { Sparkles, Battery, Navigation, ShieldAlert, CheckCircle } from "lucide-react";

interface ExplainabilityPanelProps {
  explanation: any;
}

export default function ExplainabilityPanel({ explanation }: ExplainabilityPanelProps) {
  if (!explanation) {
    return (
      <div className="bg-[#0f141f] border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center h-full min-h-[220px]">
        <Sparkles className="w-8 h-8 text-slate-700 mb-2" />
        <h4 className="text-sm font-semibold text-slate-400 mb-1">Explainability Engine Idle</h4>
        <p className="text-xs text-slate-400 max-w-sm">
          Trigger a failure on R04 to generate structured decision factors and candidate scoring matrices.
        </p>
      </div>
    );
  }

  const factors = explanation.key_factors || [];
  const matrix = explanation.candidate_matrix || [];
  const selectedId = explanation.selected_robot_id || "R07";
  const failedId = explanation.failed_robot_id || "R04";

  return (
    <div className="bg-[#0f141f] border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
            Decision Factor Explainability
          </h3>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
          VALIDATED BY SYSTEM
        </span>
      </div>

      {/* Summary Sentence */}
      <div className="bg-[#090c13] border border-purple-500/20 rounded-lg p-3 text-xs text-slate-200 leading-relaxed font-sans">
        <span className="text-purple-400 font-bold">Why {selectedId}? </span>
        {explanation.summary_sentence}
      </div>

      {/* Factor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {factors.map((f: any, idx: number) => {
          let icon = <Battery className="w-4 h-4 text-cyan-400" />;
          if (f.name.includes("Distance")) icon = <Navigation className="w-4 h-4 text-blue-400" />;
          if (f.name.includes("Clearance")) icon = <ShieldAlert className="w-4 h-4 text-emerald-400" />;

          return (
            <div key={idx} className="bg-[#090c13] border border-slate-800/80 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  {icon}
                  <span>{f.name}</span>
                </div>
                <span className="text-xs font-bold font-mono text-slate-100">{f.value}</span>
              </div>
              <div className="text-[11px] text-slate-400 leading-tight">{f.description}</div>
            </div>
          );
        })}
      </div>

      {/* Candidate Ranking Matrix */}
      {matrix.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold uppercase text-slate-400 mb-2">Fleet Candidate Deliberation</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-1.5 font-medium">Candidate</th>
                  <th className="pb-1.5 font-medium">Battery</th>
                  <th className="pb-1.5 font-medium">A* Dist</th>
                  <th className="pb-1.5 font-medium">Congestion</th>
                  <th className="pb-1.5 font-medium">Score</th>
                  <th className="pb-1.5 font-medium text-right">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {matrix.map((cand: any) => (
                  <tr key={cand.robot_id} className={cand.outcome === "SELECTED" ? "bg-purple-500/10 text-purple-200" : "text-slate-300"}>
                    <td className="py-1.5 font-bold">{cand.robot_id}</td>
                    <td className="py-1.5">{cand.battery}</td>
                    <td className="py-1.5">{cand.distance}</td>
                    <td className="py-1.5">{cand.congestion}</td>
                    <td className="py-1.5 font-semibold">{cand.composite_score.toFixed(2)}</td>
                    <td className="py-1.5 text-right">
                      {cand.outcome === "SELECTED" ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">OPTIMAL</span>
                      ) : cand.outcome.includes("LOW_BATTERY") ? (
                        <span className="text-red-400">LOW BATTERY</span>
                      ) : cand.outcome.includes("CONGESTION") ? (
                        <span className="text-amber-400">CONGESTED</span>
                      ) : (
                        <span className="text-slate-400">LOWER RANK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
