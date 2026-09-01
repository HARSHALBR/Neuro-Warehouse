"use client";

import React from "react";
import { WarehouseKPIs } from "@/hooks/useWarehouseSocket";
import { Activity, Bot, AlertTriangle, BatteryCharging, ShieldCheck } from "lucide-react";

interface TopKpiBarProps {
  kpis?: WarehouseKPIs;
  isConnected: boolean;
}

export default function TopKpiBar({ kpis, isConnected }: TopKpiBarProps) {
  const efficiency = kpis?.warehouse_efficiency ?? 96.0;
  const activeRobots = kpis?.active_robots ?? 12;
  const failedRobots = kpis?.failed_robots ?? 0;
  const activeOrders = kpis?.active_orders ?? 7;
  const affectedOrders = kpis?.affected_orders ?? 0;
  const avgBattery = kpis?.average_battery ?? 80.0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full">
      {/* Fleet Efficiency */}
      <div className="bg-[#0f141f] border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${efficiency >= 90 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-medium">Warehouse Efficiency</div>
          <div className="text-xl font-bold font-mono text-slate-100">{efficiency.toFixed(1)}%</div>
        </div>
      </div>

      {/* Fleet Status */}
      <div className="bg-[#0f141f] border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${failedRobots > 0 ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"}`}>
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-medium">Active Fleet</div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {activeRobots} <span className="text-xs font-normal text-slate-400">/ 12 AGVs</span>
          </div>
        </div>
      </div>

      {/* Orders & Affected */}
      <div className="bg-[#0f141f] border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${affectedOrders > 0 ? "bg-red-500/10 text-red-400 animate-pulse" : "bg-purple-500/10 text-purple-400"}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-medium">Active Orders</div>
          <div className="text-xl font-bold font-mono text-slate-100 flex items-center gap-1.5">
            <span>{activeOrders}</span>
            {affectedOrders > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-semibold">
                {affectedOrders} at risk
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Average Battery */}
      <div className="bg-[#0f141f] border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
          <BatteryCharging className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-medium">Average Battery</div>
          <div className="text-xl font-bold font-mono text-slate-100">{avgBattery.toFixed(0)}%</div>
        </div>
      </div>

      {/* Live Stream State */}
      <div className="bg-[#0f141f] border border-slate-800 rounded-xl p-3.5 flex items-center gap-3 col-span-2 md:col-span-1">
        <div className={`p-2.5 rounded-lg ${isConnected ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-400 font-medium">Digital Twin Stream</div>
          <div className="text-sm font-bold font-mono flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <span className={isConnected ? "text-emerald-400" : "text-red-400"}>
              {isConnected ? "10Hz LIVE" : "DISCONNECTED"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
