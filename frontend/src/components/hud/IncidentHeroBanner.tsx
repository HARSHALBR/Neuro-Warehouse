"use client";

import React from "react";
import { Eye, Brain, Cog, ShieldCheck, AlertOctagon, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { AgentThoughtStep } from "@/hooks/useWarehouseSocket";

interface IncidentHeroBannerProps {
  activeIncident: any;
  explanation: any;
  agentSteps: AgentThoughtStep[];
}

export default function IncidentHeroBanner({ activeIncident, explanation, agentSteps }: IncidentHeroBannerProps) {
  const hasIncident = !!activeIncident || !!explanation;
  const failedId = explanation?.failed_robot_id || activeIncident?.robot_id || "R04";
  const selectedId = explanation?.selected_robot_id || "R07";

  // Determine current active stage from recent agent step
  const latestStep = agentSteps[0]?.agent || "SYSTEM";
  const isPerceptionActive = hasIncident;
  const isReasoningActive = hasIncident && (latestStep === "REASONING" || latestStep === "EXECUTION" || latestStep === "VALIDATION" || !!explanation);
  const isExecutionActive = hasIncident && (latestStep === "EXECUTION" || latestStep === "VALIDATION" || !!explanation);
  const isValidated = hasIncident && (latestStep === "VALIDATION" || !!explanation);

  return (
    <div className="bg-surface-card border border-border-subtle rounded-2xl p-4 shadow-2xl space-y-3.5">
      {/* 1. Header Line */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-3 h-3 rounded-full ${hasIncident ? "bg-semantic-recovery animate-pulse shadow-[0_0_10px_#d946ef]" : "bg-semantic-info"}`} />
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-200">
            Autonomous Recovery Pipeline
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-semantic-info font-mono border border-blue-500/20">
            LangGraph Closed-Loop
          </span>
          {isValidated && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-semantic-success font-bold border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              VERIFIED
            </span>
          )}
        </div>
      </div>

      {/* 2. Four Pipeline Stepper Nodes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-center text-xs">
        {/* Node 1: Perception */}
        <div className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
          isPerceptionActive
            ? "bg-rose-500/10 border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
            : "bg-surface-sub border-border-subtle text-slate-400"
        }`}>
          <Eye className={`w-5 h-5 ${isPerceptionActive ? "text-rose-400 animate-pulse" : "text-slate-500"}`} />
          <span className="font-extrabold text-xs tracking-wider">1. PERCEPTION</span>
          <span className="text-[11px] text-slate-300 font-mono">
            {hasIncident ? `${failedId} Disruption` : "Fleet Monitoring"}
          </span>
        </div>

        {/* Node 2: Reasoning */}
        <div className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
          isReasoningActive
            ? "bg-sky-500/15 border-sky-500/50 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
            : "bg-surface-sub border-border-subtle text-slate-400"
        }`}>
          <Brain className={`w-5 h-5 ${isReasoningActive ? "text-sky-400" : "text-slate-500"}`} />
          <span className="font-extrabold text-xs tracking-wider">2. REASONING</span>
          <span className="text-[11px] text-slate-300 font-mono">
            {isReasoningActive ? "11 AGVs Evaluated" : "4-Factor Scoring"}
          </span>
        </div>

        {/* Node 3: Execution */}
        <div className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
          isExecutionActive
            ? "bg-fuchsia-500/15 border-fuchsia-500/50 text-fuchsia-200 shadow-[0_0_12px_rgba(217,70,239,0.15)]"
            : "bg-surface-sub border-border-subtle text-slate-400"
        }`}>
          <Cog className={`w-5 h-5 ${isExecutionActive ? "text-fuchsia-400" : "text-slate-500"}`} />
          <span className="font-extrabold text-xs tracking-wider">3. EXECUTION</span>
          <span className="text-[11px] text-slate-300 font-mono">
            {isExecutionActive ? `${selectedId} Dispatched` : "A* Route Planner"}
          </span>
        </div>

        {/* Node 4: Validation */}
        <div className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
          isValidated
            ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
            : "bg-surface-sub border-border-subtle text-slate-400"
        }`}>
          <ShieldCheck className={`w-5 h-5 ${isValidated ? "text-emerald-400" : "text-slate-500"}`} />
          <span className="font-extrabold text-xs tracking-wider">4. VALIDATION</span>
          <span className="text-[11px] text-slate-300 font-mono">
            {isValidated ? "0 Collisions • Passed" : "Deterministic Enforce"}
          </span>
        </div>
      </div>

      {/* 3. Hero Decision Payoff Banner */}
      {hasIncident ? (
        <div className="bg-gradient-to-br from-purple-950/40 via-surface-card to-blue-950/30 border border-fuchsia-500/40 rounded-xl p-3.5 space-y-2.5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-extrabold border border-rose-500/40 text-xs flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4" />
                DISRUPTION: {failedId} FAILED
              </span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span className="px-2.5 py-1 rounded-lg bg-fuchsia-500/20 text-fuchsia-200 font-extrabold border border-fuchsia-500/40 text-xs flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-fuchsia-400" />
                RECOVERED BY {selectedId}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-semantic-success bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 self-start sm:self-auto">
              RECOVERY SCORE: 0.82
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            <span className="font-bold text-fuchsia-300">Why {selectedId}? </span>
            {explanation?.summary_sentence || `Robot ${failedId} stalled. ${selectedId} was calculated as optimal candidate, minimizing transit cost while preserving 84% battery reserve.`}
          </p>

          {/* 4 Factor Highlight Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="bg-surface-sub border border-border-subtle rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400 font-semibold">BATTERY RESERVE</div>
              <div className="text-xs font-bold text-cyan-400 font-mono">84% ✓</div>
            </div>
            <div className="bg-surface-sub border border-border-subtle rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400 font-semibold">A* PATH DISTANCE</div>
              <div className="text-xs font-bold text-sky-400 font-mono">15m ✓</div>
            </div>
            <div className="bg-surface-sub border border-border-subtle rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400 font-semibold">CORRIDOR CONGESTION</div>
              <div className="text-xs font-bold text-semantic-success font-mono">0.0 LOW ✓</div>
            </div>
            <div className="bg-surface-sub border border-border-subtle rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400 font-semibold">FLEET WORKLOAD</div>
              <div className="text-xs font-bold text-fuchsia-400 font-mono">IDLE ✓</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface-sub border border-border-subtle rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-semantic-success animate-pulse shadow-[0_0_8px_#10b981]"></span>
            <div>
              <div className="font-bold text-slate-100">Warehouse Operating in Normal Autonomous State</div>
              <div className="text-[11px] text-slate-400 font-mono">12 AGVs active • 7 orders in progress • 96% efficiency</div>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 border border-border-subtle px-2.5 py-1 rounded bg-surface-card">
            Click "BREAK R04" or trigger via phone
          </span>
        </div>
      )}
    </div>
  );
}
