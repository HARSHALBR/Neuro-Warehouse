"use client";

import React from "react";
import GlassCard from "@/components/common/GlassCard";
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
          color: "bg-rose-500/15 text-rose-300 border-rose-500/30",
          icon: <Eye className="w-3.5 h-3.5 text-rose-400" />,
        };
      case "REASONING":
        return {
          label: "REASONING AGENT",
          color: "bg-sky-500/15 text-sky-300 border-sky-500/30",
          icon: <Brain className="w-3.5 h-3.5 text-sky-400" />,
        };
      case "EXECUTION":
        return {
          label: "EXECUTION NODE",
          color: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
          icon: <Cog className="w-3.5 h-3.5 text-fuchsia-400" />,
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
          color: "bg-slate-500/15 text-[var(--text-secondary)] border-[var(--border-glass)]",
          icon: <Radio className="w-3.5 h-3.5 text-slate-400" />,
        };
    }
  };

  return (
    <GlassCard className="p-4 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-glass)]">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold tracking-wider uppercase text-[var(--text-primary)]">
            Agent Thought Stream
          </h3>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-sky-400 font-mono border border-blue-500/25">
          Live Deliberation
        </span>
      </div>

      {/* Thought Stream List with Slide-in Transition */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-sans">
        {steps.map((step) => {
          const badge = getAgentBadge(step.agent);
          return (
            <div
              key={step.id}
              className="animate-slide-up bg-[var(--surface-sub)] border border-[var(--border-glass)] rounded-2xl p-3 text-xs space-y-1.5 transition-all hover:border-[var(--border-focus)] shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${badge.color}`}
                >
                  {badge.icon}
                  {badge.label}
                </span>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  {step.timestamp}
                </span>
              </div>
              <p className="text-xs text-[var(--text-primary)] leading-relaxed font-sans pl-1">
                {step.message}
              </p>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
