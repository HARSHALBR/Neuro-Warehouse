"use client";

import React, { useState } from "react";
import GlassCard from "@/components/common/GlassCard";
import { Sparkles, Battery, Navigation, ShieldAlert, CheckCircle, Activity, Box } from "lucide-react";
import { WarehouseFullState } from "@/hooks/useWarehouseSocket";

interface ExplainabilityPanelProps {
  explanation: any;
  warehouseState: WarehouseFullState | null;
}

export default function ExplainabilityPanel({ explanation, warehouseState }: ExplainabilityPanelProps) {
  const [activeTab, setActiveTab] = useState<"EXPLAIN" | "FLEET" | "ORDERS">("EXPLAIN");
  const [expandedRobotId, setExpandedRobotId] = useState<string | null>(null);

  const robots = warehouseState?.robots || {};
  const orders = warehouseState?.orders || {};
  const hasExplanation = !!explanation;

  return (
    <GlassCard className="p-4 flex flex-col h-full overflow-hidden">
      {/* Header with Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-glass)] pb-3 mb-3">
        <div className="flex items-center gap-2">
          {hasExplanation ? (
            <Sparkles className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400 shrink-0" />
          ) : (
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-[var(--text-primary)] truncate">
            {hasExplanation ? "Decision Factor Explainability" : "Live Fleet & Orders Telemetry"}
          </h3>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-[var(--surface-sub)] p-1 rounded-xl border border-[var(--border-glass)] text-xs shadow-sm self-start sm:self-auto">
          {hasExplanation && (
            <button
              onClick={() => setActiveTab("EXPLAIN")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                activeTab === "EXPLAIN"
                  ? "bg-fuchsia-600 text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Why R07?
            </button>
          )}
          <button
            onClick={() => setActiveTab("FLEET")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeTab === "FLEET" || (!hasExplanation && activeTab === "EXPLAIN")
                ? "bg-sky-600 text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Fleet (12)
          </button>
          <button
            onClick={() => setActiveTab("ORDERS")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              activeTab === "ORDERS"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Orders ({Object.keys(orders).length})
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {/* TAB 1: DECISION EXPLAINABILITY */}
        {hasExplanation && activeTab === "EXPLAIN" && (
          <div className="space-y-3 animate-slide-up">
            {/* Why Summary Card */}
            <div className="bg-[var(--surface-sub)] border border-fuchsia-300 dark:border-fuchsia-500/30 rounded-2xl p-3.5 text-xs text-[var(--text-primary)] leading-relaxed font-sans shadow-sm">
              <div className="flex items-center gap-2 mb-1.5 font-extrabold text-fuchsia-700 dark:text-fuchsia-400">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Selected Candidate: {explanation.selected_robot_id || "R07"} (Recovery Active)</span>
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed text-xs font-medium">{explanation.summary_sentence}</p>
            </div>

            {/* Factor Breakdown Cards — Stacked Layout to Prevent Text Overlap */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(explanation.key_factors || []).map((f: any, idx: number) => {
                let icon = <Battery className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />;
                if (f.name.includes("Distance")) icon = <Navigation className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />;
                if (f.name.includes("Clearance")) icon = <ShieldAlert className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />;

                return (
                  <div key={idx} className="bg-[var(--surface-sub)] border border-[var(--border-glass)] rounded-2xl p-3 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] font-bold mb-1">
                        {icon}
                        <span className="truncate">{f.name}</span>
                      </div>
                      <div className="text-base font-mono font-extrabold text-[var(--text-primary)] mb-1">
                        {f.value}
                      </div>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] leading-snug font-medium line-clamp-3">
                      {f.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Deliberation Comparison Matrix with Smooth Horizontal Scrolling */}
            <div className="bg-[var(--surface-sub)] border border-[var(--border-glass)] rounded-2xl p-3.5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Candidate Ranking Matrix
                </h4>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">11 Evaluated</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full min-w-[460px] text-left text-xs">
                  <thead>
                    <tr className="text-[var(--text-muted)] border-b border-[var(--border-glass)] pb-2 font-mono text-[11px] font-bold">
                      <th className="py-2 px-2">AGV</th>
                      <th className="py-2 px-2">Score</th>
                      <th className="py-2 px-2">Battery</th>
                      <th className="py-2 px-2">A* Dist</th>
                      <th className="py-2 px-2">Congestion</th>
                      <th className="py-2 px-2 text-right">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-glass)] font-mono text-xs">
                    {(explanation.candidate_matrix || []).map((c: any, idx: number) => {
                      const isWinner = c.outcome === "SELECTED";
                      return (
                        <tr key={idx} className={isWinner ? "bg-fuchsia-100/90 dark:bg-fuchsia-950/40 text-fuchsia-900 dark:text-fuchsia-200 font-bold" : "text-[var(--text-secondary)]"}>
                          <td className="py-2.5 px-2 flex items-center gap-1.5 font-bold">
                            {isWinner && <CheckCircle className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400 shrink-0" />}
                            {c.robot_id}
                          </td>
                          <td className={`py-2.5 px-2 ${isWinner ? "text-fuchsia-700 dark:text-fuchsia-400 font-extrabold" : "text-[var(--text-muted)]"}`}>
                            {typeof c.composite_score === "number" ? c.composite_score.toFixed(4) : c.composite_score}
                          </td>
                          <td className="py-2.5 px-2">{c.battery}</td>
                          <td className="py-2.5 px-2">{c.distance}</td>
                          <td className="py-2.5 px-2">{c.congestion}</td>
                          <td className="py-2.5 px-2 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block whitespace-nowrap ${
                              isWinner
                                ? "bg-fuchsia-200 dark:bg-fuchsia-500/20 text-fuchsia-900 dark:text-fuchsia-300 border-fuchsia-300 dark:border-fuchsia-500/40"
                                : "bg-slate-100 dark:bg-[var(--surface-glass)] text-[var(--text-muted)] border-slate-200 dark:border-slate-800"
                            }`}>
                              {c.outcome}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPACT FLEET GRID WITH PROGRESSIVE DISCLOSURE */}
        {(activeTab === "FLEET" || (!hasExplanation && activeTab === "EXPLAIN")) && (
          <div className="space-y-2.5 animate-slide-up">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Object.entries(robots).map(([rId, r]) => {
                let statusBg = "bg-emerald-100 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400";
                if (r.status === "FAILED") statusBg = "bg-rose-100 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500/50 text-rose-800 dark:text-rose-400 font-bold animate-pulse";
                if (r.status === "RECOVERING") statusBg = "bg-fuchsia-100 dark:bg-fuchsia-500/20 border-fuchsia-300 dark:border-fuchsia-500/50 text-fuchsia-800 dark:text-fuchsia-300 font-bold";
                if (r.status === "CHARGING") statusBg = "bg-cyan-100 dark:bg-cyan-500/10 border-cyan-300 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-400";

                const isExpanded = expandedRobotId === rId;

                return (
                  <div
                    key={rId}
                    onClick={() => setExpandedRobotId(isExpanded ? null : rId)}
                    className={`bg-[var(--surface-sub)] border rounded-2xl p-3 text-xs flex flex-col justify-between cursor-pointer transition-all hover:translate-y-[-2px] shadow-sm ${
                      isExpanded ? "border-sky-500 dark:border-sky-500/60 ring-2 ring-sky-500/20" : "border-[var(--border-glass)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold font-mono text-[var(--text-primary)] text-sm">{rId}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${statusBg}`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
                        <span>Battery</span>
                        <span className="font-mono font-extrabold text-[var(--text-primary)]">{Math.round(r.battery)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-300 dark:border-slate-700/50">
                        <div
                          className={`h-full rounded-full ${
                            r.battery > 50 ? "bg-emerald-500" : r.battery > 25 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.max(5, r.battery)}%` }}
                        />
                      </div>
                    </div>

                    {/* Progressive Disclosure */}
                    {isExpanded && (
                      <div className="mt-2.5 pt-2 border-t border-[var(--border-glass)] text-[11px] space-y-1 text-[var(--text-secondary)]">
                        <div>Position: <span className="font-mono font-bold text-[var(--text-primary)]">({r.position[0]}, {r.position[1]})</span></div>
                        <div>Task: <span className="font-mono text-sky-700 dark:text-sky-400 font-bold">{r.current_task_id || "None"}</span></div>
                        <div>Order: <span className="font-mono text-fuchsia-700 dark:text-fuchsia-400 font-bold">{r.assigned_order_id || "Patrol"}</span></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVE ORDERS */}
        {activeTab === "ORDERS" && (
          <div className="space-y-2.5 animate-slide-up">
            {Object.entries(orders).map(([oId, order]) => {
              let prioBg = "bg-sky-100 dark:bg-blue-500/10 border-sky-300 dark:border-blue-500/30 text-sky-800 dark:text-sky-300";
              if (order.priority === "CRITICAL") prioBg = "bg-rose-100 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 font-bold";
              if (order.priority === "HIGH") prioBg = "bg-amber-100 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold";

              return (
                <div key={oId} className="bg-[var(--surface-sub)] border border-[var(--border-glass)] rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-sm">
                  <div className="flex items-center gap-3">
                    <Box className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold font-mono text-[var(--text-primary)] text-sm">{oId}</span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${prioBg}`}>
                          {order.priority}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] font-mono font-semibold">Shelf: {order.shelf_id}</span>
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                        Pick: ({order.pick_location[0]}, {order.pick_location[1]}) ➔ Dropoff: ({order.dropoff_location[0]}, {order.dropoff_location[1]})
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-[var(--text-secondary)]">
                      AGV: <span className="font-bold text-sky-700 dark:text-sky-400">{order.assigned_robot_id || "Unassigned"}</span>
                    </div>
                    <span className={`text-[11px] font-bold ${
                      order.status === "AFFECTED" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
