"use client";

import React, { useState } from "react";
import { Sparkles, Battery, Navigation, ShieldAlert, CheckCircle, Activity, Box, Cpu, AlertTriangle } from "lucide-react";
import { WarehouseFullState } from "@/hooks/useWarehouseSocket";

interface ExplainabilityPanelProps {
  explanation: any;
  warehouseState: WarehouseFullState | null;
}

export default function ExplainabilityPanel({ explanation, warehouseState }: ExplainabilityPanelProps) {
  const [activeTab, setActiveTab] = useState<"EXPLAIN" | "FLEET" | "ORDERS">("EXPLAIN");

  const robots = warehouseState?.robots || {};
  const orders = warehouseState?.orders || {};
  const hasExplanation = !!explanation;

  return (
    <div className="bg-[#0f141f] border border-slate-800 rounded-2xl p-4 flex flex-col h-full shadow-2xl">
      {/* Header with Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          {hasExplanation ? (
            <Sparkles className="w-4 h-4 text-purple-400" />
          ) : (
            <Activity className="w-4 h-4 text-emerald-400" />
          )}
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-100">
            {hasExplanation ? "Autonomous Decision Explainability" : "Live Fleet & Mission Telemetry"}
          </h3>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-[#080c14] p-0.5 rounded-lg border border-slate-800 text-xs">
          {hasExplanation && (
            <button
              onClick={() => setActiveTab("EXPLAIN")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                activeTab === "EXPLAIN"
                  ? "bg-purple-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Why R07?
            </button>
          )}
          <button
            onClick={() => setActiveTab("FLEET")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              activeTab === "FLEET" || (!hasExplanation && activeTab === "EXPLAIN")
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Fleet (12 AGVs)
          </button>
          <button
            onClick={() => setActiveTab("ORDERS")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              activeTab === "ORDERS"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Active Orders ({Object.keys(orders).length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {/* TAB 1: DECISION EXPLAINABILITY (Active when failure triggered) */}
        {hasExplanation && activeTab === "EXPLAIN" && (
          <div className="space-y-3">
            {/* Why Summary */}
            <div className="bg-[#090c13] border border-purple-500/30 rounded-xl p-3.5 text-xs text-slate-200 leading-relaxed font-sans shadow-inner">
              <div className="flex items-center gap-2 mb-1.5 font-bold text-purple-400">
                <Sparkles className="w-4 h-4" />
                <span>Selected Candidate: {explanation.selected_robot_id || "R07"} (Recovery Plan Active)</span>
              </div>
              <p className="text-slate-300">{explanation.summary_sentence}</p>
            </div>

            {/* Factor Cards */}
            <div className="grid grid-cols-3 gap-2">
              {(explanation.key_factors || []).map((f: any, idx: number) => {
                let icon = <Battery className="w-4 h-4 text-cyan-400" />;
                if (f.name.includes("Distance")) icon = <Navigation className="w-4 h-4 text-blue-400" />;
                if (f.name.includes("Clearance")) icon = <ShieldAlert className="w-4 h-4 text-emerald-400" />;

                return (
                  <div key={idx} className="bg-[#090c13] border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                        {icon}
                        <span className="truncate">{f.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-100">{f.value}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">{f.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Candidate Evaluation Matrix */}
            <div className="bg-[#090c13] border border-slate-800 rounded-xl p-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Fleet Deliberation Matrix (Ranked by Multi-Factor Composite Score)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 pb-1 font-mono text-[11px]">
                      <th className="py-1">AGV</th>
                      <th>Composite Score</th>
                      <th>Battery</th>
                      <th>A* Dist</th>
                      <th>Congestion</th>
                      <th>Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {(explanation.candidate_matrix || []).map((c: any, idx: number) => (
                      <tr key={idx} className={c.outcome === "SELECTED" ? "bg-purple-950/40 text-purple-200 font-bold" : "text-slate-300"}>
                        <td className="py-1.5 flex items-center gap-1.5">
                          {c.outcome === "SELECTED" && <CheckCircle className="w-3.5 h-3.5 text-purple-400" />}
                          {c.robot_id}
                        </td>
                        <td className="text-purple-400">{typeof c.composite_score === "number" ? c.composite_score.toFixed(4) : c.composite_score}</td>
                        <td>{c.battery}</td>
                        <td>{c.distance}</td>
                        <td>{c.congestion}</td>
                        <td>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            c.outcome === "SELECTED"
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                              : "bg-slate-800 text-slate-400"
                          }`}>
                            {c.outcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE FLEET TELEMETRY */}
        {(activeTab === "FLEET" || (!hasExplanation && activeTab === "EXPLAIN")) && (
          <div className="space-y-3">
            {/* Multi-Agent Health Status Banner */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#090c13] border border-amber-500/20 rounded-xl p-2.5 flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
                <div>
                  <div className="text-[11px] font-bold text-amber-300">Perception Agent</div>
                  <div className="text-[10px] text-slate-400">Monitoring 12 AGVs</div>
                </div>
              </div>
              <div className="bg-[#090c13] border border-blue-500/20 rounded-xl p-2.5 flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
                <div>
                  <div className="text-[11px] font-bold text-blue-300">Reasoning Agent</div>
                  <div className="text-[10px] text-slate-400">4-Factor Model Ready</div>
                </div>
              </div>
              <div className="bg-[#090c13] border border-emerald-500/20 rounded-xl p-2.5 flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                <div>
                  <div className="text-[11px] font-bold text-emerald-300">Validation Node</div>
                  <div className="text-[10px] text-slate-400">Deterministic A* Safe</div>
                </div>
              </div>
            </div>

            {/* Live Fleet Grid (12 AGVs) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {Object.entries(robots).map(([rId, r]) => {
                let statusBg = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
                if (r.status === "FAILED") statusBg = "bg-red-500/20 border-red-500/50 text-red-400 font-bold animate-pulse";
                if (r.status === "RECOVERING") statusBg = "bg-purple-500/20 border-purple-500/50 text-purple-300 font-bold";
                if (r.status === "CHARGING") statusBg = "bg-cyan-500/10 border-cyan-500/30 text-cyan-400";

                return (
                  <div key={rId} className="bg-[#090c13] border border-slate-800/90 rounded-xl p-2.5 text-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold font-mono text-slate-100">{rId}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusBg}`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Battery</span>
                        <span className="font-mono text-slate-200">{Math.round(r.battery)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            r.battery > 50 ? "bg-emerald-400" : r.battery > 25 ? "bg-amber-400" : "bg-red-400"
                          }`}
                          style={{ width: `${Math.max(5, r.battery)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span>Pos: ({r.position[0]}, {r.position[1]})</span>
                        <span className="text-slate-300 truncate max-w-[50px]">{r.assigned_order_id || "Patrol"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVE ORDERS */}
        {activeTab === "ORDERS" && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(orders).map(([oId, order]) => {
                let prioBg = "bg-blue-500/10 border-blue-500/30 text-blue-300";
                if (order.priority === "CRITICAL") prioBg = "bg-red-500/20 border-red-500/40 text-red-300 font-bold";
                if (order.priority === "HIGH") prioBg = "bg-amber-500/15 border-amber-500/30 text-amber-300";

                return (
                  <div key={oId} className="bg-[#090c13] border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <Box className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-slate-100">{oId}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${prioBg}`}>
                            {order.priority}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">Shelf: {order.shelf_id}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Pick: ({order.pick_location[0]}, {order.pick_location[1]}) ➔ Dropoff: ({order.dropoff_location[0]}, {order.dropoff_location[1]})
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-mono text-slate-300">
                        AGV: <span className="font-bold text-cyan-400">{order.assigned_robot_id || "Unassigned"}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                        order.status === "AFFECTED" ? "text-red-400 font-bold" : "text-emerald-400"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
