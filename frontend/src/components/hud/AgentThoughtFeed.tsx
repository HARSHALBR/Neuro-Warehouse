"use client";

import React from "react";
import { AgentThoughtStep } from "@/hooks/useWarehouseSocket";
import { Eye, Brain, Cog, CheckCircle2, Radio } from "lucide-react";

interface AgentThoughtFeedProps {
  steps: AgentThoughtStep[];
}

export default function AgentThoughtFeed({ steps }: AgentThoughtFeedProps) {
  const getAgentBadge = (agent: AgentThoughtStep["agent"]) => {
    switch (agent) {
      case "PERCEPTION":
        return {
          label: "PERCEPTION AGENT",
          color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
          icon: <Eye className="w-3.5 h-3.5 text-amber-400" />,
        };
      case "REASONING":
        return {
          label: "REASONING AGENT",
          color: "bg-blue-500/15 text-blue-300 border-blue-500/30",
          icon: <Brain className="w-3.5 h-3.5 text-blue-400" />,
        };
      case "EXECUTION":
        return {
          label: "EXECUTION NODE",
          color: "bg-purple-500/15 text-purple-300 border-purple-500/30",
          icon: <Cog className="w-3.5 h-3.5 text-purple-400" />,
        };
      case "VALIDATION":
        return {
          label: "VALIDATION (DETERMINISTIC)",
          color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        };
      default:
        return {
          label: "SYSTEM CORE",
          color: "bg-slate-700/30 text-slate-300 border-slate-700",
          icon: <Radio className="w-3.5 h-3.5 text-slate-400" />,
        };
    }
  };

  return (
    <div className="bg-[#0f141f] border border-slate-800 rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
            Agent Thought Stream
          </h3>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
          LangGraph Closed-Loop
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[380px]">
        {steps.length === 0 ? (
          <div className="text-xs text-slate-400 italic text-center py-8">
            Waiting for operational events... Trigger failure to observe multi-agent recovery.
          </div>
        ) : (
          steps.map((step) => {
            const badge = getAgentBadge(step.agent);
            return (
              <div
                key={step.id}
                className="bg-[#090c13] border border-slate-800/60 rounded-lg p-2.5 transition-all hover:border-slate-700"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border ${badge.color}`}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{step.timestamp}</span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed font-sans pl-1">
                  {step.message}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
