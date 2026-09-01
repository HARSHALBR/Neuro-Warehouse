"use client";

import React, { useState } from "react";
import { useWarehouseSocket } from "@/hooks/useWarehouseSocket";
import TopKpiBar from "@/components/hud/TopKpiBar";
import WarehouseScene from "@/components/3d/WarehouseScene";
import ControlToolbar from "@/components/hud/ControlToolbar";
import AgentThoughtFeed from "@/components/hud/AgentThoughtFeed";
import ExplainabilityPanel from "@/components/hud/ExplainabilityPanel";
import IncidentHeroBanner from "@/components/hud/IncidentHeroBanner";
import WhatIfModal from "@/components/hud/WhatIfModal";
import { Bot, Smartphone, Layers, Maximize2, Minimize2 } from "lucide-react";

export default function DashboardPage() {
  const {
    warehouseState,
    isConnected,
    agentSteps,
    activeIncident,
    latestExplanation,
    isProcessing,
    resetWarehouse,
    triggerRobotFailure,
    runWhatIf,
  } = useWarehouseSocket();

  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);

  const togglePresentation = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsPresentationMode(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsPresentationMode(false);
    }
  };

  return (
    <main className={`min-h-screen flex flex-col transition-all duration-300 ${
      isPresentationMode
        ? "p-2 md:p-3 max-w-full bg-surface-bg gap-2"
        : "p-3 md:p-5 max-w-[1780px] mx-auto gap-3.5"
    }`}>
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              iQOO HACKATHON 2026 • CITY BATTLES
            </span>
            <span className="text-xs text-slate-400 font-mono">Autonomous Warehouse OS</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Bot className="w-8 h-8 text-blue-500" />
            <span>NEUROWAREHOUSE</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono tracking-wide mt-0.5">
            "BREAK IT. WATCH IT HEAL. SEE WHY." — Multi-Agent Autonomous Recovery System
          </p>
        </div>

        {/* Action Badges & Presentation Mode Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={togglePresentation}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all border ${
              isPresentationMode
                ? "bg-fuchsia-600/30 border-fuchsia-500 text-fuchsia-200 shadow-md"
                : "bg-surface-card border-border-subtle text-slate-300 hover:text-white"
            }`}
          >
            {isPresentationMode ? (
              <>
                <Minimize2 className="w-4 h-4 text-fuchsia-400" />
                <span>EXIT FULLSCREEN</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-slate-400" />
                <span>PRESENTATION MODE</span>
              </>
            )}
          </button>

          <div className="hidden sm:flex bg-surface-card border border-border-subtle px-3 py-1.5 rounded-xl text-xs font-mono items-center gap-2">
            <Layers className="w-4 h-4 text-fuchsia-400" />
            <span className="text-slate-300">3-Agent Closed Loop</span>
          </div>

          <a
            href="/mobile/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-sky-300 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Smartphone className="w-4 h-4 text-sky-400" />
            <span>iQOO Field Client</span>
          </a>
        </div>
      </header>

      {/* 1. Top KPI Metrics Bar */}
      <TopKpiBar kpis={warehouseState?.kpis} isConnected={isConnected} />

      {/* 2. Incident & Multi-Agent Hero Stepper Banner */}
      <IncidentHeroBanner
        activeIncident={activeIncident}
        explanation={latestExplanation}
        agentSteps={agentSteps}
      />

      {/* 3. Main Command Center Grid: 3D Digital Twin + Thought Stream & Explainability */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1">
        {/* Left 3D Viewport (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3">
          <div className={`flex-1 ${isPresentationMode ? "min-h-[580px] xl:min-h-[660px]" : "min-h-[520px] xl:min-h-[600px]"}`}>
            <WarehouseScene state={warehouseState} />
          </div>
          <ControlToolbar
            onReset={resetWarehouse}
            onFailR04={() => triggerRobotFailure("R04", "dashboard_hud")}
            onOpenWhatIf={() => setIsWhatIfOpen(true)}
            isProcessing={isProcessing}
          />
        </div>

        {/* Right Intelligence HUD (4 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3">
          <div className={isPresentationMode ? "h-[280px]" : "h-[320px]"}>
            <AgentThoughtFeed steps={agentSteps} />
          </div>
          <div className="flex-1 min-h-[300px]">
            <ExplainabilityPanel explanation={latestExplanation} warehouseState={warehouseState} />
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
