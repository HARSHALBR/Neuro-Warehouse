"""
Dynamic Multi-Factor Candidate Generation and Scoring Engine for Robot Recovery.
"""
from typing import List, Dict, Any, Optional, Set, Tuple
from pydantic import BaseModel, Field
from .astar import AStarPlanner, GridPoint
from .state_manager import WarehouseState, Robot, Order


class CandidateScore(BaseModel):
    robot_id: str
    battery: float
    battery_margin: float
    distance: float
    congestion_penalty: float
    workload: int
    composite_score: float
    is_feasible: bool
    route: List[GridPoint] = Field(default_factory=list)
    factor_breakdown: Dict[str, Any] = Field(default_factory=dict)
    summary_reason: str = ""


class CandidateScorer:
    def __init__(
        self,
        weight_battery: float = 0.35,
        weight_distance: float = 0.35,
        weight_congestion: float = 0.20,
        weight_workload: float = 0.10,
        min_battery_threshold: float = 15.0,
    ):
        self.w_battery = weight_battery
        self.w_distance = weight_distance
        self.w_congestion = weight_congestion
        self.w_workload = weight_workload
        self.min_battery_threshold = min_battery_threshold

    def evaluate_candidates(
        self,
        state: WarehouseState,
        failed_robot_id: str,
        target_location: GridPoint,
        planner: AStarPlanner,
    ) -> List[CandidateScore]:
        """
        Evaluates all eligible fleet robots against the disruption target.
        Returns a sorted list of candidate evaluations in descending order of composite score.
        """
        # Dynamic obstacles include static shelves + the failed robot position
        static_obs = {s.position for s in state.shelves.values()}
        planner.set_static_obstacles(static_obs)

        failed_robot = state.robots.get(failed_robot_id)
        dynamic_obs: Set[GridPoint] = set()
        if failed_robot:
            dynamic_obs.add((int(round(failed_robot.position[0])), int(round(failed_robot.position[1]))))

        # Convert congestion map keys from "x,y" to (x, y)
        congestion_dict: Dict[GridPoint, float] = {}
        for k, v in state.congestion_map.items():
            try:
                px, py = map(int, k.split(","))
                congestion_dict[(px, py)] = v
            except ValueError:
                pass

        raw_evaluations = []
        max_possible_distance = float(state.grid_width + state.grid_height)

        for r_id, robot in state.robots.items():
            if r_id == failed_robot_id or robot.status == "FAILED":
                continue

            start_pt: GridPoint = (int(round(robot.position[0])), int(round(robot.position[1])))

            # 1. Compute deterministic A* route
            route = planner.find_path(
                start=start_pt,
                goal=target_location,
                dynamic_obstacles=dynamic_obs,
                congestion_map=congestion_dict,
            )

            if not route:
                # Infeasible candidate (no path or blocked)
                raw_evaluations.append({
                    "robot_id": r_id,
                    "battery": robot.battery,
                    "battery_margin": 0.0,
                    "distance": 999.0,
                    "congestion_penalty": 999.0,
                    "workload": 1 if robot.status in ["BUSY", "MOVING"] else 0,
                    "composite_score": -1.0,
                    "is_feasible": False,
                    "route": [],
                    "summary_reason": f"{r_id} cannot reach the destination due to obstacles.",
                    "factor_breakdown": {
                        "battery": {"value": f"{robot.battery:.0f}%", "impact": "neutral"},
                        "distance": {"value": "Unreachable", "impact": "negative"},
                        "feasibility": {"value": "Infeasible", "impact": "negative"}
                    }
                })
                continue

            distance = planner.calculate_path_length(route)
            
            # 2. Battery margin: battery minus estimated discharge (0.4% per cell moved)
            estimated_discharge = distance * 0.4
            battery_margin = robot.battery - estimated_discharge

            # 3. Path congestion penalty
            congestion_penalty = sum(congestion_dict.get(pt, 0.0) for pt in route)

            # 4. Workload penalty
            workload = 1 if robot.status in ["BUSY", "MOVING"] else 0

            # Battery viability check
            if battery_margin < self.min_battery_threshold:
                # Severe penalty for critical battery depletion
                composite_score = 0.1 * (robot.battery / 100.0)
                reason = f"{r_id} has insufficient battery reserve ({robot.battery:.0f}% drops to {battery_margin:.0f}%)."
                factor_breakdown = {
                    "battery": {"value": f"{robot.battery:.0f}%", "impact": "negative", "margin": f"{battery_margin:.0f}%"},
                    "distance": {"value": f"{distance:.0f}m", "impact": "neutral"},
                    "congestion": {"value": f"{congestion_penalty:.1f}", "impact": "neutral"},
                    "workload": {"value": f"{workload}", "impact": "neutral"},
                }
            else:
                # Normalize metrics into [0.0, 1.0]
                norm_battery = min(1.0, max(0.0, battery_margin / 100.0))
                norm_distance = min(1.0, max(0.0, distance / max_possible_distance))
                norm_congestion = min(1.0, max(0.0, congestion_penalty / 10.0))
                norm_workload = float(workload)

                # Composite score calculation (higher is better)
                score = (
                    (self.w_battery * norm_battery)
                    + (self.w_distance * (1.0 - norm_distance))
                    + (self.w_congestion * (1.0 - norm_congestion))
                    + (self.w_workload * (1.0 - norm_workload))
                )
                composite_score = round(score, 4)

                # Build human-readable factors
                battery_impact = "positive" if robot.battery >= 75 else ("neutral" if robot.battery >= 40 else "negative")
                dist_impact = "positive" if distance <= 10 else ("neutral" if distance <= 20 else "negative")
                cong_impact = "positive" if congestion_penalty < 1.0 else "negative"

                factor_breakdown = {
                    "battery": {"value": f"{robot.battery:.0f}%", "impact": battery_impact, "margin": f"{battery_margin:.0f}%"},
                    "distance": {"value": f"{distance:.0f}m", "impact": dist_impact},
                    "congestion": {"value": f"{congestion_penalty:.1f}", "impact": cong_impact},
                    "workload": {"value": "Available" if workload == 0 else "Busy", "impact": "positive" if workload == 0 else "neutral"},
                }

                reason = (
                    f"{r_id} evaluated with battery {robot.battery:.0f}%, distance {distance:.0f}m, "
                    f"and congestion penalty {congestion_penalty:.1f} (score: {composite_score:.2f})."
                )

            raw_evaluations.append({
                "robot_id": r_id,
                "battery": robot.battery,
                "battery_margin": round(battery_margin, 1),
                "distance": distance,
                "congestion_penalty": round(congestion_penalty, 2),
                "workload": workload,
                "composite_score": composite_score,
                "is_feasible": True,
                "route": route,
                "summary_reason": reason,
                "factor_breakdown": factor_breakdown
            })

        # Sort descending by composite score
        raw_evaluations.sort(key=lambda x: x["composite_score"], reverse=True)

        return [CandidateScore(**item) for item in raw_evaluations]
