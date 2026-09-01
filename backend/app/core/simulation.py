"""
Deterministic Kinematics and Simulation Tick Engine for NeuroWarehouse.
"""
from typing import Callable, List, Optional, Dict, Any
import asyncio
import math
from .state_manager import WarehouseStateManager, WarehouseState, Robot
from .astar import AStarPlanner, GridPoint


class WarehouseSimulation:
    def __init__(
        self,
        state_manager: WarehouseStateManager,
        planner: Optional[AStarPlanner] = None,
        tick_rate_hz: int = 10
    ):
        self.state_manager = state_manager
        self.planner = planner or AStarPlanner(state_manager.width, state_manager.height)
        self.tick_rate_hz = tick_rate_hz
        self.dt = 1.0 / float(tick_rate_hz)
        self._is_running = False
        self._task: Optional[asyncio.Task] = None
        self._listeners: List[Callable[[Dict[str, Any]], Any]] = []

    def add_tick_listener(self, callback: Callable[[Dict[str, Any]], Any]) -> None:
        """Register a callback for tick broadcast (e.g. WebSocket streamer)."""
        self._listeners.append(callback)

    def remove_tick_listener(self, callback: Callable[[Dict[str, Any]], Any]) -> None:
        if callback in self._listeners:
            self._listeners.remove(callback)

    def tick(self, dt: Optional[float] = None) -> WarehouseState:
        """
        Executes a single deterministic simulation step:
        - Advances robot kinematics along active routes.
        - Updates battery states.
        - Handles task/order completion triggers.
        - Recomputes KPIs.
        """
        step_dt = dt if dt is not None else self.dt
        state = self.state_manager.state

        for r_id, robot in list(state.robots.items()):
            if robot.status == "FAILED":
                continue

            if robot.status == "CHARGING":
                robot.battery = min(100.0, robot.battery + (1.0 * step_dt))
                continue

            # Check if robot is moving along a path
            if robot.route and len(robot.route) > 0 and robot.status in ["MOVING", "BUSY", "RECOVERING"]:
                current_target_idx = min(robot.route_index + 1, len(robot.route) - 1)
                target_pt = robot.route[current_target_idx]

                cur_x, cur_y = robot.position
                tgt_x, tgt_y = float(target_pt[0]), float(target_pt[1])

                dx = tgt_x - cur_x
                dy = tgt_y - cur_y
                dist_to_wp = math.sqrt(dx * dx + dy * dy)

                step_distance = robot.speed * step_dt

                if dist_to_wp <= step_distance or dist_to_wp < 0.05:
                    # Reached waypoint
                    robot.position = (tgt_x, tgt_y)
                    robot.route_index = current_target_idx

                    # Check if reached final waypoint of route
                    if robot.route_index >= len(robot.route) - 1:
                        # Path completed
                        if robot.status == "RECOVERING":
                            robot.status = "BUSY"
                            robot.color = "#10B981"
                        robot.route = []
                        robot.route_index = 0
                else:
                    # Interpolate movement
                    move_fraction = step_distance / dist_to_wp
                    new_x = cur_x + dx * move_fraction
                    new_y = cur_y + dy * move_fraction
                    robot.position = (round(new_x, 3), round(new_y, 3))

                # Battery consumption during movement
                robot.battery = max(0.0, robot.battery - (0.05 * step_dt))
            else:
                # Idle battery drain
                robot.battery = max(0.0, robot.battery - (0.005 * step_dt))

        self.state_manager.recompute_kpis()
        return self.state_manager.state

    async def _run_loop(self) -> None:
        """Async background tick loop."""
        while self._is_running:
            state = self.tick()
            payload = state.model_dump()
            for listener in self._listeners:
                try:
                    res = listener(payload)
                    if asyncio.iscoroutine(res):
                        await res
                except Exception:
                    pass
            await asyncio.sleep(self.dt)

    def start(self) -> None:
        """Starts background simulation loop."""
        if not self._is_running:
            self._is_running = True
            self._task = asyncio.create_task(self._run_loop())

    def stop(self) -> None:
        """Stops background simulation loop."""
        self._is_running = False
        if self._task:
            self._task.cancel()
            self._task = None
