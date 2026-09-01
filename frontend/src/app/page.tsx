"use client";

import React, { useState } from "react";
import { useWarehouseSocket } from "@/hooks/useWarehouseSocket";
import TopKpiBar from "@/components/hud/TopKpiBar";
import WarehouseScene from "@/components/3d/WarehouseScene";
import ControlToolbar from "@/components/hud/ControlToolbar";
import AgentThoughtFeed from "@/components/hud/AgentThoughtFeed";
import ExplainabilityPanel from "@/components/hud/ExplainabilityPanel";
import WhatIfModal from "@/components/hud/WhatIfModal";
import { Bot, Layers, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const {
    warehouseState,
    isConnected,
    agentSteps,
    latestExplanation,
    isProcessing,
    resetWarehouse,
    triggerRobotFailure,
    runWhatIf,
  } = useWarehouseSocket();

  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);

  return (
    <main className="min-h-screen p-4 md:p-6 flex flex-col gap-4 max-w-[1720px] mx-auto">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              iQOO HACKATHON 2026
            </span>
            <span className="text-xs text-slate-400 font-mono">Digital Twin Command Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Bot className="w-7 h-7 text-blue-500" />
            <span>NEUROWAREHOUSE</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono tracking-wide mt-0.5">
            "BREAK IT. WATCH IT HEAL. SEE WHY." — Autonomous Warehouse Recovery System
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0f141f] border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="text-slate-300">3-Agent LangGraph Core</span>
          </div>
        </div>
      </header>

      {/* 1. Top KPI Metric Bar */}
      <TopKpiBar kpis={warehouseState?.kpis} isConnected={isConnected} />

      {/* 2. Main Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left/Center 3D Digital Twin Viewport (7 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3">
          <div className="flex-1 min-h-[500px] xl:min-h-[560px]">
            <WarehouseScene state={warehouseState} />
          </div>
          <ControlToolbar
            onReset={resetWarehouse}
            onFailR04={() => triggerRobotFailure("R04", "dashboard_hud")}
            onOpenWhatIf={() => setIsWhatIfOpen(true)}
            isProcessing={isProcessing}
          />
        </div>

        {/* Right Multi-Agent Intelligence HUD (5 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          <div className="h-[380px]">
            <AgentThoughtFeed steps={agentSteps} />
          </div>
          <div className="flex-1">
            <ExplainabilityPanel explanation={latestExplanation} />
          </div>
        </div>
      </div>

      {/* What-If Sandbox Modal */}
      <WhatIfModal
        isOpen={isWhatIfOpen}
        onClose={() => setIsWhatIfOpen(false)}
        onRunWhatIf={(robotId) => runWhatIf(robotId, "R04")}
      />
    </main>
  );
}
