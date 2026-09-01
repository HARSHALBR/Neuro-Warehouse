"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface RobotState {
  id: string;
  position: [number, number];
  battery: number;
  status: string; // "IDLE" | "MOVING" | "BUSY" | "FAILED" | "CHARGING" | "RECOVERING"
  current_task_id?: string;
  assigned_order_id?: string;
  speed: number;
  route: [number, number][];
  route_index: number;
  color: string;
}

export interface ShelfState {
  id: string;
  position: [number, number];
  category: string;
  stock_count: number;
}

export interface OrderState {
  id: string;
  priority: string;
  shelf_id: string;
  pick_location: [number, number];
  dropoff_location: [number, number];
  status: string;
  assigned_robot_id?: string;
}

export interface WarehouseKPIs {
  total_robots: number;
  active_robots: number;
  failed_robots: number;
  active_orders: number;
  affected_orders: number;
  completed_orders: number;
  warehouse_efficiency: number;
  average_battery: number;
}

export interface AgentThoughtStep {
  id: string;
  agent: "PERCEPTION" | "REASONING" | "EXECUTION" | "VALIDATION" | "SYSTEM";
  step: string;
  message: string;
  timestamp: string;
  payload?: any;
}

export interface WarehouseFullState {
  grid_width: number;
  grid_height: number;
  robots: Record<string, RobotState>;
  shelves: Record<string, ShelfState>;
  orders: Record<string, OrderState>;
  tasks: Record<string, any>;
  charging_stations: [number, number][];
  dropoff_stations: [number, number][];
  congestion_map: Record<string, number>;
  kpis: WarehouseKPIs;
}

const BACKEND_BASE = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws/warehouse";

export function useWarehouseSocket() {
  const [warehouseState, setWarehouseState] = useState<WarehouseFullState | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [agentSteps, setAgentSteps] = useState<AgentThoughtStep[]>([]);
  const [activeIncident, setActiveIncident] = useState<any>(null);
  const [latestExplanation, setLatestExplanation] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);

  const addAgentStep = useCallback((step: Omit<AgentThoughtStep, "id" | "timestamp">) => {
    const newStep: AgentThoughtStep = {
      ...step,
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setAgentSteps((prev) => [newStep, ...prev.slice(0, 30)]);
  }, []);

  // Fetch full state once via REST to initialize quickly
  const fetchInitialState = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/v1/warehouse/state`);
      if (res.ok) {
        const data = await res.json();
        setWarehouseState(data);
      }
    } catch (e) {
      console.warn("Could not fetch initial warehouse state via REST:", e);
    }
  }, []);

  useEffect(() => {
    fetchInitialState();

    function connect() {
      const ws = new WebSocket(WS_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        addAgentStep({
          agent: "SYSTEM",
          step: "CONNECT",
          message: "Authoritative WebSocket link established with simulation core (10Hz).",
        });
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "INITIAL_STATE" && msg.state) {
            setWarehouseState(msg.state);
          } else if (msg.type === "TICK") {
            setWarehouseState((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                robots: msg.robots || prev.robots,
                kpis: msg.kpis || prev.kpis,
                orders: msg.orders || prev.orders,
              };
            });
          } else if (msg.type === "AGENT_STEP") {
            let agentType: AgentThoughtStep["agent"] = "SYSTEM";
            if (msg.agent === "PERCEPTION") agentType = "PERCEPTION";
            else if (msg.agent === "REASONING") agentType = "REASONING";
            else if (msg.agent === "EXECUTION_VALIDATION" || msg.agent === "VALIDATION") agentType = "VALIDATION";
            else if (msg.agent === "EXECUTION") agentType = "EXECUTION";

            addAgentStep({
              agent: agentType,
              step: msg.step || "UPDATE",
              message: msg.message || "",
              payload: msg.payload,
            });
          } else if (msg.type === "INCIDENT_DETECTED") {
            setActiveIncident(msg);
          } else if (msg.type === "RESET" && msg.state) {
            setWarehouseState(msg.state);
            setActiveIncident(null);
            setLatestExplanation(null);
            addAgentStep({
              agent: "SYSTEM",
              step: "RESET",
              message: "Warehouse state reset to deterministic seed 42.",
            });
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [fetchInitialState, addAgentStep]);

  // REST Triggers
  const resetWarehouse = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/v1/warehouse/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: 42 }),
      });
      if (res.ok) {
        await fetchInitialState();
      }
    } catch (e) {
      console.error("Reset error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerRobotFailure = async (robotId: string = "R04", source: string = "dashboard_hud") => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/v1/events/robot-failure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ robot_id: robotId, source }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.explanation) {
          setLatestExplanation(data.explanation);
        }
        return data;
      }
    } catch (e) {
      console.error("Failure trigger error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const runWhatIf = async (hypotheticalRobotId: string = "R07", baselineFailedId: string = "R04") => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/v1/simulation/what-if`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hypothetical_failure_robot_id: hypotheticalRobotId,
          baseline_failed_robot_id: baselineFailedId,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error("What-If error:", e);
    }
    return null;
  };

  return {
    warehouseState,
    isConnected,
    agentSteps,
    activeIncident,
    latestExplanation,
    isProcessing,
    resetWarehouse,
    triggerRobotFailure,
    runWhatIf,
  };
}
