"use client";

import React from "react";
import { Eye, Brain, Cog, CheckCircle2, AlertOctagon, ArrowRight, ShieldCheck, Zap } from "lucide-react";
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

  return (
    <div className="bg-[#090d16] border border-slate-800/90 rounded-2xl p-4 shadow-2xl space-y-4">
      {/* 1. Real-time Multi-Agent Pipeline Stepper */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]"></div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-200">
            Autonomous Recovery Pipeline
          </h3>
        </div>
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">
          LangGraph Closed-Loop
        </span>
      </div>

      {/* 4 Agent Stage Nodes */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        {/* Stage 1: Perception */}
        <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
          hasIncident
            ? "bg-red-500/10 border-red-500/40 text-red-300"
            : "bg-[#0f1422] border-slate-800 text-slate-400"
        }`}>
          <Eye className={`w-4 h-4 ${hasIncident ? "text-red-400 animate-pulse" : "text-slate-500"}`} />
          <span className="font-bold text-[11px]">1. PERCEPTION</span>
          <span className="text-[10px] text-slate-400">
            {hasIncident ? `${failedId} Stalled` : "Monitoring Fleet"}
          </span>
        </div>

        {/* Stage 2: Reasoning */}
        <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
          hasIncident
            ? "bg-blue-500/15 border-blue-500/50 text-blue-200"
            : "bg-[#0f1422] border-slate-800 text-slate-400"
        }`}>
          <Brain className={`w-4 h-4 ${hasIncident ? "text-blue-400" : "text-slate-500"}`} />
          <span className="font-bold text-[11px]">2. REASONING</span>
          <span className="text-[10px] text-slate-400">
            {hasIncident ? "11 Candidates Scored" : "4-Factor Engine"}
          </span>
        </div>

        {/* Stage 3: Execution */}
        <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
          hasIncident
            ? "bg-purple-500/15 border-purple-500/50 text-purple-200"
            : "bg-[#0f1422] border-slate-800 text-slate-400"
        }`}>
          <Cog className={`w-4 h-4 ${hasIncident ? "text-purple-400" : "text-slate-500"}`} />
          <span className="font-bold text-[11px]">3. EXECUTION</span>
          <span className="text-[10px] text-slate-400">
            {hasIncident ? `${selectedId} Dispatched` : "A* Route Planner"}
          </span>
        </div>

        {/* Stage 4: Validation */}
        <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
          hasIncident
            ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-200"
            : "bg-[#0f1422] border-slate-800 text-slate-400"
        }`}>
          <ShieldCheck className={`w-4 h-4 ${hasIncident ? "text-emerald-400" : "text-slate-500"}`} />
          <span className="font-bold text-[11px]">4. VALIDATION</span>
          <span className="text-[10px] text-slate-400">
            {hasIncident ? "0 Collisions • Passed" : "Deterministic Enforce"}
          </span>
        </div>
      </div>

      {/* 2. Hero Decision Card (The WOW factor) */}
      {hasIncident ? (
        <div className="bg-gradient-to-br from-purple-950/40 via-[#0f172a] to-blue-950/30 border border-purple-500/40 rounded-xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 font-extrabold border border-red-500/40 text-xs flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5" />
                DISRUPTION: {failedId} FAILED
              </span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-200 font-extrabold border border-purple-500/40 text-xs flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                RECOVERED BY {selectedId}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              SCORE: 0.82
            </span>
          </div>

          <p className="text-xs text-slate-200 font-sans leading-relaxed">
            <span className="font-bold text-purple-300">Why {selectedId}? </span>
            {explanation?.summary_sentence || `Robot ${failedId} stalled. ${selectedId} was calculated as optimal candidate, minimizing transit cost while preserving 84% battery reserve.`}
          </p>

          {/* 4 Factor Highlight Pills */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="bg-[#090d16] border border-slate-800 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400 font-semibold">BATTERY</div>
              <div className="text-xs font-bold text-cyan-400 font-mono">84% ✓</div>
            </div>
            <div className="bg-[#090d16] border border-slate-800 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400 font-semibold">A* DISTANCE</div>
              <div className="text-xs font-bold text-blue-400 font-mono">15m ✓</div>
            </div>
            <div className="bg-[#090d16] border border-slate-800 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400 font-semibold">CONGESTION</div>
              <div className="text-xs font-bold text-emerald-400 font-mono">0.0 LOW ✓</div>
            </div>
            <div className="bg-[#090d16] border border-slate-800 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400 font-semibold">WORKLOAD</div>
              <div className="text-xs font-bold text-purple-400 font-mono">IDLE ✓</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0f172a]/60 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
            <div>
              <div className="font-bold text-slate-100">Warehouse Operating in Normal State</div>
              <div className="text-[11px] text-slate-400 font-mono">12 AGVs active • 7 orders in progress • 96% efficiency</div>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 border border-slate-800 px-2 py-1 rounded bg-[#090d16]">
            Press "BREAK R04" or trigger via phone
          </span>
        </div>
      )}
    </div>
  );
}
