"use client";

import React, { useEffect, useState } from "react";
import { WarehouseKPIs } from "@/hooks/useWarehouseSocket";
import { Activity, Bot, Package, BatteryCharging, Radio } from "lucide-react";

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
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {/* 1. Warehouse Efficiency */}
      <div className="bg-surface-card border border-border-subtle rounded-2xl p-3.5 flex flex-col justify-between shadow-lg transition-all hover:border-border-focus/50">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
          <span>EFFICIENCY</span>
          <Activity className="w-4 h-4 text-semantic-success" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
            {efficiency.toFixed(1)}%
          </span>
          <span className="text-[11px] font-bold text-semantic-success bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            OPTIMAL
          </span>
        </div>
      </div>

      {/* 2. Operational Fleet */}
      <div className="bg-surface-card border border-border-subtle rounded-2xl p-3.5 flex flex-col justify-between shadow-lg transition-all hover:border-border-focus/50">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
          <span>ACTIVE FLEET</span>
          <Bot className="w-4 h-4 text-semantic-info" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
            {activeFleet}
          </span>
          <span className="text-xs font-mono text-slate-400">/ {totalFleet} AGVs</span>
        </div>
      </div>

      {/* 3. Orders Fulfillment */}
      <div className="bg-surface-card border border-border-subtle rounded-2xl p-3.5 flex flex-col justify-between shadow-lg transition-all hover:border-border-focus/50">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
          <span>ACTIVE ORDERS</span>
          <Package className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
            {activeOrders}
          </span>
          {affectedOrders > 0 ? (
            <span className="text-[11px] font-extrabold text-semantic-failure bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40 animate-pulse">
              {affectedOrders} AT RISK
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-slate-400 font-mono">
              ALL ON TIME
            </span>
          )}
        </div>
      </div>

      {/* 4. Average Battery */}
      <div className="bg-surface-card border border-border-subtle rounded-2xl p-3.5 flex flex-col justify-between shadow-lg transition-all hover:border-border-focus/50">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
          <span>FLEET BATTERY</span>
          <BatteryCharging className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
            {avgBattery}%
          </span>
          <div className="w-16 bg-surface-sub rounded-full h-2 overflow-hidden border border-border-subtle">
            <div
              className="h-full rounded-full bg-semantic-info transition-all duration-500"
              style={{ width: `${avgBattery}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5. Live Digital Twin Stream */}
      <div className="col-span-2 md:col-span-1 bg-surface-card border border-border-subtle rounded-2xl p-3.5 flex flex-col justify-between shadow-lg transition-all hover:border-border-focus/50">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
          <span>TELEMETRY STREAM</span>
          <Radio className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${
            isConnected
              ? "bg-semantic-success animate-pulse shadow-[0_0_10px_#10b981]"
              : "bg-semantic-failure shadow-[0_0_10px_#f43f5e]"
          }`} />
          <span className="text-lg font-bold font-mono text-white">
            {isConnected ? "10Hz LIVE" : "DISCONNECTED"}
          </span>
        </div>
      </div>
    </div>
  );
}
