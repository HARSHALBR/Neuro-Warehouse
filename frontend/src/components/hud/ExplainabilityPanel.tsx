"use client";

import React, { useState } from "react";
import GlassCard from "@/components/common/GlassCard";
import { Sparkles, Battery, Navigation, ShieldAlert, CheckCircle, Activity, Box, ChevronDown } from "lucide-react";
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
    <GlassCard className="p-4 flex flex-col h-full">
      {/* Header with Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-3 mb-3">
        <div className="flex items-center gap-2">
          {hasExplanation ? (
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
          ) : (
            <Activity className="w-4 h-4 text-emerald-400" />
          )}
          <h3 className="text-sm font-bold tracking-wider uppercase text-[var(--text-primary)]">
            {hasExplanation ? "Decision Factor Explainability" : "Live Fleet & Mission Telemetry"}
          </h3>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-[var(--surface-sub)] p-1 rounded-xl border border-[var(--border-glass)] text-xs">
          {hasExplanation && (
            <button
              onClick={() => setActiveTab("EXPLAIN")}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === "EXPLAIN"
                  ? "bg-fuchsia-600 text-white shadow-md"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Why R07?
            </button>
          )}
          <button
            onClick={() => setActiveTab("FLEET")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeTab === "FLEET" || (!hasExplanation && activeTab === "EXPLAIN")
                ? "bg-sky-600 text-white shadow-md"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Fleet (12 AGVs)
          </button>
          <button
            onClick={() => setActiveTab("ORDERS")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeTab === "ORDERS"
                ? "bg-emerald-600 text-white shadow-md"
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
            <div className="bg-[var(--surface-sub)] border border-fuchsia-500/30 rounded-2xl p-4 text-xs text-[var(--text-primary)] leading-relaxed font-sans shadow-inner">
              <div className="flex items-center gap-2 mb-1.5 font-extrabold text-fuchsia-400">
                <Sparkles className="w-4 h-4" />
                <span>Selected Candidate: {explanation.selected_robot_id || "R07"} (Recovery Plan Active)</span>
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed text-xs">{explanation.summary_sentence}</p>
            </div>

            {/* Factor Breakdown Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              {(explanation.key_factors || []).map((f: any, idx: number) => {
                let icon = <Battery className="w-4 h-4 text-cyan-400" />;
                if (f.name.includes("Distance")) icon = <Navigation className="w-4 h-4 text-sky-400" />;
                if (f.name.includes("Clearance")) icon = <ShieldAlert className="w-4 h-4 text-emerald-400" />;

                return (
                  <div key={idx} className="bg-[var(--surface-sub)] border border-[var(--border-glass)] rounded-2xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-bold">
                        {icon}
                        <span className="truncate">{f.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{f.value}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-tight">{f.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Deliberation Comparison Matrix */}
            <div className="bg-[var(--surface-sub)] border border-[var(--border-glass)] rounded-2xl p-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Candidate Ranking & Deliberation Matrix
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[var(--text-muted)] border-b border-[var(--border-glass)] pb-1.5 font-mono text-[11px]">
                      <th className="py-1">AGV</th>
                      <th>Composite Score</th>
                      <th>Battery</th>
                      <th>A* Dist</th>
                      <th>Congestion</th>
                      <th>Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-glass)] font-mono text-xs">
                    {(explanation.candidate_matrix || []).map((c: any, idx: number) => {
                      const isWinner = c.outcome === "SELECTED";
                      return (
                        <tr key={idx} className={isWinner ? "bg-fuchsia-950/30 text-fuchsia-200 font-bold" : "text-[var(--text-secondary)] opacity-80"}>
                          <td className="py-2 flex items-center gap-1.5 font-bold">
                            {isWinner && <CheckCircle className="w-4 h-4 text-fuchsia-400" />}
                            {c.robot_id}
                          </td>
                          <td className={isWinner ? "text-fuchsia-400 font-bold" : "text-[var(--text-muted)]"}>
                            {typeof c.composite_score === "number" ? c.composite_score.toFixed(4) : c.composite_score}
                          </td>
                          <td>{c.battery}</td>
                          <td>{c.distance}</td>
                          <td>{c.congestion}</td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isWinner
                                ? "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40"
                                : "bg-[var(--surface-glass)] text-[var(--text-muted)]"
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
                let statusBg = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
                if (r.status === "FAILED") statusBg = "bg-rose-500/20 border-rose-500/50 text-rose-400 font-bold animate-pulse";
                if (r.status === "RECOVERING") statusBg = "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300 font-bold";
                if (r.status === "CHARGING") statusBg = "bg-cyan-500/10 border-cyan-500/30 text-cyan-400";

                const isExpanded = expandedRobotId === rId;

                return (
                  <div
                    key={rId}
                    onClick={() => setExpandedRobotId(isExpanded ? null : rId)}
                    className={`bg-[var(--surface-sub)] border rounded-2xl p-3 text-xs flex flex-col justify-between cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-lg ${
                      isExpanded ? "border-sky-500/60 bg-[var(--surface-glass)]" : "border-[var(--border-glass)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold font-mono text-[var(--text-primary)] text-sm">{rId}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusBg}`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                        <span>Battery</span>
                        <span className="font-mono font-bold text-[var(--text-primary)]">{Math.round(r.battery)}%</span>
                      </div>
                      <div className="w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            r.battery > 50 ? "bg-emerald-400" : r.battery > 25 ? "bg-amber-400" : "bg-rose-400"
                          }`}
                          style={{ width: `${Math.max(5, r.battery)}%` }}
                        />
                      </div>
                    </div>

                    {/* Progressive Disclosure */}
                    {isExpanded && (
                      <div className="mt-2.5 pt-2 border-t border-[var(--border-glass)] text-[11px] space-y-1 text-[var(--text-secondary)]">
                        <div>Position: <span className="font-mono text-[var(--text-primary)]">({r.position[0]}, {r.position[1]})</span></div>
                        <div>Task: <span className="font-mono text-sky-400">{r.current_task_id || "None"}</span></div>
                        <div>Order: <span className="font-mono text-fuchsia-400">{r.assigned_order_id || "Patrol"}</span></div>
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
          <div className="space-y-2 animate-slide-up">
            {Object.entries(orders).map(([oId, order]) => {
              let prioBg = "bg-blue-500/10 border-blue-500/30 text-sky-300";
              if (order.priority === "CRITICAL") prioBg = "bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold";
              if (order.priority === "HIGH") prioBg = "bg-amber-500/15 border-amber-500/30 text-amber-300";

              return (
                <div key={oId} className="bg-[var(--surface-sub)] border border-[var(--border-glass)] rounded-2xl p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <Box className="w-5 h-5 text-fuchsia-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold font-mono text-[var(--text-primary)] text-sm">{oId}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${prioBg}`}>
                          {order.priority}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] font-mono">Shelf: {order.shelf_id}</span>
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">
                        Pick: ({order.pick_location[0]}, {order.pick_location[1]}) ➔ Dropoff: ({order.dropoff_location[0]}, {order.dropoff_location[1]})
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-[var(--text-secondary)]">
                      AGV: <span className="font-bold text-sky-400">{order.assigned_robot_id || "Unassigned"}</span>
                    </div>
                    <span className={`text-[11px] font-bold ${
                      order.status === "AFFECTED" ? "text-rose-400" : "text-emerald-400"
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
