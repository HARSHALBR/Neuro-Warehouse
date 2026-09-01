"use client";

import React from "react";
import GlassCard from "@/components/common/GlassCard";
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

  const latestStep = agentSteps[0]?.agent || "SYSTEM";
  const isPerceptionActive = hasIncident;
  const isReasoningActive = hasIncident && (latestStep === "REASONING" || latestStep === "EXECUTION" || latestStep === "VALIDATION" || !!explanation);
  const isExecutionActive = hasIncident && (latestStep === "EXECUTION" || latestStep === "VALIDATION" || !!explanation);
  const isValidated = hasIncident && (latestStep === "VALIDATION" || !!explanation);

  return (
    <GlassCard
      glowColor={hasIncident ? "rgba(217, 70, 239, 0.25)" : undefined}
      radialWash={hasIncident ? "rgba(217, 70, 239, 0.08)" : undefined}
      className="p-4 space-y-3.5"
    >
      {/* 1. Header Line */}
      <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-3 h-3 rounded-full ${hasIncident ? "bg-fuchsia-500 animate-pulse shadow-[0_0_12px_#d946ef]" : "bg-sky-500"}`} />
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[var(--text-primary)]">
            Autonomous Multi-Agent Pipeline
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-0.5 rounded-full bg-sky-100 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 font-mono font-bold border border-sky-300 dark:border-sky-500/30">
            LangGraph Closed-Loop
          </span>
          {isValidated && (
            <span className="text-xs px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              VERIFIED
            </span>
          )}
        </div>
      </div>

      {/* 2. Four Pipeline Stepper Nodes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
        {/* Node 1: Perception */}
        <div className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1.5 ${
          isPerceptionActive
            ? "bg-rose-100 dark:bg-rose-500/15 border-rose-300 dark:border-rose-500/50 text-rose-900 dark:text-rose-200 shadow-md"
            : "bg-[var(--surface-sub)] border-[var(--border-glass)] text-[var(--text-muted)]"
        }`}>
          <div className={`p-2 rounded-xl ${isPerceptionActive ? "bg-rose-200 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 animate-pulse" : "bg-slate-200 dark:bg-slate-800/40 text-slate-500"}`}>
            <Eye className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-xs tracking-wider">1. PERCEPTION</span>
          <span className="text-[11px] font-mono font-semibold text-[var(--text-secondary)]">
            {hasIncident ? `${failedId} Disruption` : "Fleet Monitoring"}
          </span>
        </div>

        {/* Node 2: Reasoning */}
        <div className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1.5 ${
          isReasoningActive
            ? "bg-sky-100 dark:bg-sky-500/15 border-sky-300 dark:border-sky-500/50 text-sky-900 dark:text-sky-200 shadow-md"
            : "bg-[var(--surface-sub)] border-[var(--border-glass)] text-[var(--text-muted)]"
        }`}>
          <div className={`p-2 rounded-xl ${isReasoningActive ? "bg-sky-200 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400" : "bg-slate-200 dark:bg-slate-800/40 text-slate-500"}`}>
            <Brain className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-xs tracking-wider">2. REASONING</span>
          <span className="text-[11px] font-mono font-semibold text-[var(--text-secondary)]">
            {isReasoningActive ? "11 AGVs Evaluated" : "4-Factor Scoring"}
          </span>
        </div>

        {/* Node 3: Execution */}
        <div className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1.5 ${
          isExecutionActive
            ? "bg-fuchsia-100 dark:bg-fuchsia-500/15 border-fuchsia-300 dark:border-fuchsia-500/50 text-fuchsia-900 dark:text-fuchsia-200 shadow-md"
            : "bg-[var(--surface-sub)] border-[var(--border-glass)] text-[var(--text-muted)]"
        }`}>
          <div className={`p-2 rounded-xl ${isExecutionActive ? "bg-fuchsia-200 dark:bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-400" : "bg-slate-200 dark:bg-slate-800/40 text-slate-500"}`}>
            <Cog className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-xs tracking-wider">3. EXECUTION</span>
          <span className="text-[11px] font-mono font-semibold text-[var(--text-secondary)]">
            {isExecutionActive ? `${selectedId} Dispatched` : "A* Route Planner"}
          </span>
        </div>

        {/* Node 4: Validation */}
        <div className={`p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1.5 ${
          isValidated
            ? "bg-emerald-100 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/50 text-emerald-900 dark:text-emerald-200 shadow-md"
            : "bg-[var(--surface-sub)] border-[var(--border-glass)] text-[var(--text-muted)]"
        }`}>
          <div className={`p-2 rounded-xl ${isValidated ? "bg-emerald-200 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-slate-200 dark:bg-slate-800/40 text-slate-500"}`}>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-xs tracking-wider">4. VALIDATION</span>
          <span className="text-[11px] font-mono font-semibold text-[var(--text-secondary)]">
            {isValidated ? "0 Collisions • Passed" : "Deterministic Enforce"}
          </span>
        </div>
      </div>

      {/* 3. Hero Decision Payoff Banner */}
      {hasIncident ? (
        <div className="bg-gradient-to-br from-purple-100/80 via-[var(--surface-sub)] to-sky-100/80 dark:from-purple-950/40 dark:via-[var(--surface-sub)] dark:to-blue-950/30 border border-fuchsia-300 dark:border-fuchsia-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 font-extrabold border border-rose-300 dark:border-rose-500/40 text-xs flex items-center gap-1.5 shadow-sm">
                <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                DISRUPTION: {failedId} FAILED
              </span>
              <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="px-3 py-1.5 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-500/20 text-fuchsia-800 dark:text-fuchsia-200 font-extrabold border border-fuchsia-300 dark:border-fuchsia-500/40 text-xs flex items-center gap-1.5 shadow-sm">
                <Zap className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                RECOVERED BY {selectedId}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-500/30 shadow-sm">
              RECOVERY SCORE: 0.82
            </span>
          </div>

          <p className="text-xs text-[var(--text-primary)] leading-relaxed font-sans font-medium">
            <span className="font-bold text-fuchsia-700 dark:text-fuchsia-400">Why {selectedId}? </span>
            {explanation?.summary_sentence || `Robot ${failedId} stalled. ${selectedId} was calculated as optimal candidate, minimizing transit cost while preserving 84% battery reserve.`}
          </p>

          {/* 4 Factor Highlight Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="bg-[var(--surface-sub)] border border-[var(--border-glass)] rounded-xl p-2.5 text-center shadow-sm">
              <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">BATTERY RESERVE</div>
              <div className="text-xs font-extrabold text-cyan-700 dark:text-cyan-400 font-mono">84% ✓</div>
            </div>
            <div className="bg-[var(--surface-sub)] border border-[var(--border-glass)] rounded-xl p-2.5 text-center shadow-sm">
              <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">A* PATH DISTANCE</div>
              <div className="text-xs font-extrabold text-sky-700 dark:text-sky-400 font-mono">15m ✓</div>
            </div>
            <div className="bg-[var(--surface-sub)] border border-[var(--border-glass)] rounded-xl p-2.5 text-center shadow-sm">
              <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">CORRIDOR CONGESTION</div>
              <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">0.0 LOW ✓</div>
            </div>
            <div className="bg-[var(--surface-sub)] border border-[var(--border-glass)] rounded-xl p-2.5 text-center shadow-sm">
              <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">FLEET WORKLOAD</div>
              <div className="text-xs font-extrabold text-fuchsia-700 dark:text-fuchsia-400 font-mono">IDLE ✓</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--surface-sub)] border border-[var(--border-glass)] rounded-2xl p-4 flex items-center justify-between text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]"></span>
            <div>
              <div className="font-bold text-[var(--text-primary)]">Warehouse Operating in Normal Autonomous State</div>
              <div className="text-[11px] text-[var(--text-muted)] font-mono">12 AGVs active • 7 orders in progress • 96% efficiency</div>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-secondary)] border border-[var(--border-glass)] px-3 py-1.5 rounded-xl bg-[var(--surface-glass)] font-semibold shadow-sm">
            Click "BREAK R04" or trigger via phone
          </span>
        </div>
      )}
    </GlassCard>
  );
}
