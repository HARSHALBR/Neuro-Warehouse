"use client";

import React from "react";
import { WarehouseKPIs } from "@/hooks/useWarehouseSocket";
import GlassCard from "@/components/common/GlassCard";
import AnimatedCounter from "@/components/common/AnimatedCounter";
import { Activity, Bot, Package, BatteryCharging, Radio, TrendingUp, ShieldCheck } from "lucide-react";

interface TopKpiBarProps {
  kpis?: WarehouseKPIs;
  isConnected: boolean;
}

export default function TopKpiBar({ kpis, isConnected }: TopKpiBarProps) {
  const efficiency = kpis?.warehouse_efficiency ?? 96.0;
  const activeFleet = kpis?.active_robots ?? 12;
  const totalFleet = kpis?.total_robots ?? 12;
  const activeOrders = kpis?.active_orders ?? 7;
  const affectedOrders = kpis?.affected_orders ?? 0;
  const avgBattery = Math.round(kpis?.average_battery ?? 74);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
      {/* 1. Warehouse Efficiency */}
      <GlassCard
        interactive
        radialWash="rgba(16, 185, 129, 0.14)"
        glowColor="rgba(16, 185, 129, 0.3)"
        className="p-4 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Efficiency
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +0.4%
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-mono text-[var(--text-primary)] tracking-tight">
            <AnimatedCounter value={efficiency} decimals={1} suffix="%" />
          </span>
          <span className="text-[11px] font-semibold text-emerald-400/90 font-mono">
            OPTIMAL
          </span>
        </div>
      </GlassCard>

      {/* 2. Operational Fleet */}
      <GlassCard
        interactive
        radialWash="rgba(56, 189, 248, 0.14)"
        glowColor="rgba(56, 189, 248, 0.3)"
        className="p-4 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
              <Bot className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Active Fleet
            </span>
          </div>
          <span className="text-[11px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/25">
            100% READY
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-mono text-[var(--text-primary)] tracking-tight">
            <AnimatedCounter value={activeFleet} />
          </span>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            / {totalFleet} AGVs
          </span>
        </div>
      </GlassCard>

      {/* 3. Orders Fulfillment */}
      <GlassCard
        interactive
        radialWash="rgba(217, 70, 239, 0.14)"
        glowColor="rgba(217, 70, 239, 0.3)"
        className="p-4 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_12px_rgba(217,70,239,0.25)]">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Orders Queue
            </span>
          </div>
          {affectedOrders > 0 ? (
            <span className="text-[11px] font-extrabold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/40 animate-pulse">
              {affectedOrders} AT RISK
            </span>
          ) : (
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              ON TIME
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-mono text-[var(--text-primary)] tracking-tight">
            <AnimatedCounter value={activeOrders} />
          </span>
          <span className="text-xs font-mono text-[var(--text-muted)]">Active Orders</span>
        </div>
      </GlassCard>

      {/* 4. Average Battery */}
      <GlassCard
        interactive
        radialWash="rgba(6, 182, 212, 0.14)"
        glowColor="rgba(6, 182, 212, 0.3)"
        className="p-4 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <BatteryCharging className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Fleet Battery
            </span>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/25">
            HEALTHY
          </span>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-extrabold font-mono text-[var(--text-primary)] tracking-tight">
            <AnimatedCounter value={avgBattery} suffix="%" />
          </span>
          <div className="flex-1 bg-slate-800/60 rounded-full h-2 overflow-hidden border border-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-500"
              style={{ width: `${avgBattery}%` }}
            />
          </div>
        </div>
      </GlassCard>

      {/* 5. Live Digital Twin Stream */}
      <GlassCard
        interactive
        radialWash={isConnected ? "rgba(16, 185, 129, 0.14)" : "rgba(244, 63, 94, 0.14)"}
        glowColor={isConnected ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)"}
        className="col-span-2 md:col-span-1 p-4 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-500/20 border border-slate-500/40 flex items-center justify-center text-[var(--text-secondary)]">
              <Radio className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Telemetry
            </span>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">10Hz WS</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className={`w-3.5 h-3.5 rounded-full ${
            isConnected
              ? "bg-emerald-400 animate-pulse shadow-[0_0_12px_#34d399]"
              : "bg-rose-500 shadow-[0_0_12px_#f43f5e]"
          }`} />
          <span className="text-xl font-bold font-mono text-[var(--text-primary)]">
            {isConnected ? "STREAM LIVE" : "OFFLINE"}
          </span>
        </div>
      </GlassCard>
    </div>
  );
}
