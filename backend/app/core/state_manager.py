"""
Authoritative Warehouse State Manager and Data Models for NeuroWarehouse.
"""
from typing import List, Dict, Any, Optional, Set, Tuple
from pydantic import BaseModel, Field
import copy
import uuid


GridPoint = Tuple[int, int]


class Robot(BaseModel):
    id: str
    position: Tuple[float, float]
    battery: float = Field(ge=0.0, le=100.0)
    status: str = "IDLE"  # IDLE, MOVING, BUSY, FAILED, CHARGING, RECOVERING
    current_task_id: Optional[str] = None
    assigned_order_id: Optional[str] = None
    speed: float = 1.0  # cells per second
    route: List[GridPoint] = Field(default_factory=list)
    route_index: int = 0
    color: str = "#3B82F6"  # Visual color code


class Shelf(BaseModel):
    id: str
    position: GridPoint
    category: str
    stock_count: int = 100


class Order(BaseModel):
    id: str
    priority: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    shelf_id: str
    pick_location: GridPoint
    dropoff_location: GridPoint
    status: str = "PENDING"  # PENDING, IN_PROGRESS, AFFECTED, COMPLETED
    assigned_robot_id: Optional[str] = None


class Task(BaseModel):
    id: str
    order_id: str
    robot_id: str
    task_type: str = "PICK_AND_DELIVER"  # PICK, TRANSPORT, CHARGE
    target_location: GridPoint
    status: str = "ACTIVE"  # ACTIVE, BLOCKED, COMPLETED, CANCELLED


class WarehouseKPIs(BaseModel):
    total_robots: int = 12
    active_robots: int = 12
    failed_robots: int = 0
    active_orders: int = 0
    affected_orders: int = 0
    completed_orders: int = 0
    warehouse_efficiency: float = 94.0  # percentage
    average_battery: float = 80.0


class WarehouseState(BaseModel):
    grid_width: int = 30
    grid_height: int = 20
    robots: Dict[str, Robot] = Field(default_factory=dict)
    shelves: Dict[str, Shelf] = Field(default_factory=dict)
    orders: Dict[str, Order] = Field(default_factory=dict)
    tasks: Dict[str, Task] = Field(default_factory=dict)
    charging_stations: List[GridPoint] = Field(default_factory=list)
    dropoff_stations: List[GridPoint] = Field(default_factory=list)
    congestion_map: Dict[str, float] = Field(default_factory=dict)
    kpis: WarehouseKPIs = Field(default_factory=WarehouseKPIs)


class WarehouseStateManager:
    def __init__(self, width: int = 30, height: int = 20):
        self.width = width
        self.height = height
        self.state: WarehouseState = WarehouseState(grid_width=width, grid_height=height)
        self.reset_to_golden_seed()

    def get_shelf_obstacles(self) -> Set[GridPoint]:
        """Return the set of all shelf obstacle grid points."""
        return {shelf.position for shelf in self.state.shelves.values()}

    def get_failed_robot_obstacles(self) -> Set[GridPoint]:
        """Return coordinates of all currently failed robots."""
        obs = set()
        for r in self.state.robots.values():
            if r.status == "FAILED":
                obs.add((int(round(r.position[0])), int(round(r.position[1]))))
        return obs

    def reset_to_golden_seed(self) -> WarehouseState:
        """
        Resets warehouse to the exact deterministic starting state for the Golden Demo:
        - 12 Robots (R01 to R12) with distinct batteries & positions.
        - 24 Shelves in realistic storage rows.
        - Charging and drop-off stations.
        - R04 assigned to high-priority order O104.
        - R05 placed near R04 target with LOW battery (31%).
        - R09 placed with route crossing congested zone.
        - R07 placed with healthy battery (84%) and clean path.
        """
        self.state = WarehouseState(grid_width=self.width, grid_height=self.height)

        # 1. Setup Shelves in structured rows (Columns 6, 12, 18, 24 with aisles)
        shelves_dict = {}
        shelf_counter = 1
        for col in [6, 12, 18, 24]:
            for row in [3, 4, 5, 6, 8, 9, 10, 11, 13, 14, 15, 16]:
                s_id = f"S{shelf_counter:02d}"
                category = "Electronics" if col <= 12 else "Mechanical"
                shelves_dict[s_id] = Shelf(
                    id=s_id,
                    position=(col, row),
                    category=category,
                    stock_count=80 + (shelf_counter * 3) % 40,
                )
                shelf_counter += 1
        self.state.shelves = shelves_dict

        # 2. Charging & Dropoff Stations
        self.state.charging_stations = [(1, 1), (1, 2), (1, 3), (1, 4)]
        self.state.dropoff_stations = [(28, 5), (28, 10), (28, 15)]

        # 3. Setup Congestion Zones (e.g. around packing stations at x=14..16, y=7..10)
        self.state.congestion_map = {
            f"{x},{y}": 2.5
            for x in range(14, 17)
            for y in range(7, 11)
        }

        # 4. Initialize Fleet of 12 Robots
        robots_init = [
            # ID, pos, battery, status, color
            ("R01", (2, 5), 92.0, "BUSY", "#10B981"),
            ("R02", (2, 8), 88.0, "MOVING", "#10B981"),
            ("R03", (2, 12), 79.0, "BUSY", "#10B981"),
            ("R04", (8, 7), 72.0, "BUSY", "#F59E0B"),  # Target failure robot in Golden Demo
            ("R05", (9, 6), 31.0, "IDLE", "#3B82F6"),  # Close to R04 target, but low battery
            ("R06", (15, 4), 65.0, "BUSY", "#10B981"),
            ("R07", (15, 14), 84.0, "IDLE", "#3B82F6"), # High battery, feasible clear route
            ("R08", (20, 5), 90.0, "BUSY", "#10B981"),
            ("R09", (14, 8), 68.0, "IDLE", "#3B82F6"),  # In/near congested zone
            ("R10", (22, 12), 81.0, "BUSY", "#10B981"),
            ("R11", (26, 7), 75.0, "IDLE", "#3B82F6"),
            ("R12", (26, 14), 95.0, "IDLE", "#3B82F6"),
        ]

        self.state.robots = {}
        for r_id, pos, bat, status, col in robots_init:
            self.state.robots[r_id] = Robot(
                id=r_id,
                position=pos,
                battery=bat,
                status=status,
                speed=1.0,
                color=col,
            )

        # 5. Initialize Orders
        self.state.orders = {
            "O101": Order(id="O101", priority="MEDIUM", shelf_id="S01", pick_location=(5, 3), dropoff_location=(28, 5), status="IN_PROGRESS", assigned_robot_id="R01"),
            "O102": Order(id="O102", priority="HIGH", shelf_id="S08", pick_location=(7, 10), dropoff_location=(28, 10), status="IN_PROGRESS", assigned_robot_id="R02"),
            "O103": Order(id="O103", priority="LOW", shelf_id="S14", pick_location=(11, 14), dropoff_location=(28, 15), status="IN_PROGRESS", assigned_robot_id="R03"),
            "O104": Order(id="O104", priority="CRITICAL", shelf_id="S06", pick_location=(7, 7), dropoff_location=(28, 10), status="IN_PROGRESS", assigned_robot_id="R04"),
            "O105": Order(id="O105", priority="MEDIUM", shelf_id="S20", pick_location=(17, 9), dropoff_location=(28, 5), status="IN_PROGRESS", assigned_robot_id="R06"),
            "O106": Order(id="O106", priority="HIGH", shelf_id="S28", pick_location=(23, 11), dropoff_location=(28, 10), status="IN_PROGRESS", assigned_robot_id="R08"),
            "O107": Order(id="O107", priority="LOW", shelf_id="S32", pick_location=(25, 15), dropoff_location=(28, 15), status="IN_PROGRESS", assigned_robot_id="R10"),
        }

        # 6. Tasks for robots
        self.state.tasks = {
            "T01": Task(id="T01", order_id="O101", robot_id="R01", target_location=(5, 3), status="ACTIVE"),
            "T02": Task(id="T02", order_id="O102", robot_id="R02", target_location=(7, 10), status="ACTIVE"),
            "T03": Task(id="T03", order_id="O103", robot_id="R03", target_location=(11, 14), status="ACTIVE"),
            "T04": Task(id="T04", order_id="O104", robot_id="R04", target_location=(7, 7), status="ACTIVE"),
            "T05": Task(id="T05", order_id="O105", robot_id="R06", target_location=(17, 9), status="ACTIVE"),
            "T06": Task(id="T06", order_id="O106", robot_id="R08", target_location=(23, 11), status="ACTIVE"),
            "T07": Task(id="T07", order_id="O107", robot_id="R10", target_location=(25, 15), status="ACTIVE"),
        }

        # Assign task links
        for t_id, task in self.state.tasks.items():
            if task.robot_id in self.state.robots:
                self.state.robots[task.robot_id].current_task_id = t_id
                self.state.robots[task.robot_id].assigned_order_id = task.order_id

        self.recompute_kpis()
        return self.state

    def trigger_robot_failure(self, robot_id: str) -> Tuple[bool, List[str]]:
        """
        Sets a robot into FAILED status and flags any assigned orders as AFFECTED.
        Returns: (success, list_of_affected_order_ids)
        """
        if robot_id not in self.state.robots:
            return False, []

        robot = self.state.robots[robot_id]
        robot.status = "FAILED"
        robot.color = "#EF4444"  # Alert Red
        robot.route = []
        robot.route_index = 0

        affected_orders = []
        if robot.assigned_order_id and robot.assigned_order_id in self.state.orders:
            order = self.state.orders[robot.assigned_order_id]
            order.status = "AFFECTED"
            affected_orders.append(order.id)

        if robot.current_task_id and robot.current_task_id in self.state.tasks:
            self.state.tasks[robot.current_task_id].status = "BLOCKED"

        self.recompute_kpis()
        return True, affected_orders

    def apply_recovery_assignment(
        self,
        replacement_robot_id: str,
        order_id: str,
        new_route: List[GridPoint]
    ) -> bool:
        """
        Applies a validated recovery plan:
        - Assigns replacement robot to the affected order.
        - Sets new route and transitions replacement robot to RECOVERING / MOVING.
        - Updates order status to IN_PROGRESS.
        """
        if replacement_robot_id not in self.state.robots or order_id not in self.state.orders:
            return False

        robot = self.state.robots[replacement_robot_id]
        order = self.state.orders[order_id]

        robot.assigned_order_id = order_id
        robot.status = "RECOVERING"
        robot.color = "#8B5CF6"  # Recovery Purple/Blue
        robot.route = new_route
        robot.route_index = 0

        order.assigned_robot_id = replacement_robot_id
        order.status = "IN_PROGRESS"

        # Update or create task
        task_id = f"T_REC_{uuid.uuid4().hex[:6]}"
        new_task = Task(
            id=task_id,
            order_id=order_id,
            robot_id=replacement_robot_id,
            target_location=order.pick_location,
            status="ACTIVE"
        )
        self.state.tasks[task_id] = new_task
        robot.current_task_id = task_id

        self.recompute_kpis()
        return True

    def recompute_kpis(self) -> WarehouseKPIs:
        """Recalculate dynamic KPIs based on current entity states."""
        total = len(self.state.robots)
        failed = sum(1 for r in self.state.robots.values() if r.status == "FAILED")
        active_robots = sum(1 for r in self.state.robots.values() if r.status in ["IDLE", "MOVING", "BUSY", "RECOVERING"])
        active_orders = sum(1 for o in self.state.orders.values() if o.status in ["PENDING", "IN_PROGRESS"])
        affected = sum(1 for o in self.state.orders.values() if o.status == "AFFECTED")
        completed = sum(1 for o in self.state.orders.values() if o.status == "COMPLETED")
        
        avg_battery = (
            sum(r.battery for r in self.state.robots.values()) / total
            if total > 0 else 0.0
        )

        # Efficiency penalty based on failed robots and affected orders
        penalty = (failed * 12.0) + (affected * 10.0)
        eff = max(10.0, min(100.0, 96.0 - penalty))

        self.state.kpis = WarehouseKPIs(
            total_robots=total,
            active_robots=active_robots,
            failed_robots=failed,
            active_orders=active_orders,
            affected_orders=affected,
            completed_orders=completed,
            warehouse_efficiency=round(eff, 1),
            average_battery=round(avg_battery, 1)
        )
        return self.state.kpis

    def create_snapshot(self) -> Dict[str, Any]:
        """Creates a deep-copy dictionary snapshot of state for What-If sandbox or agent reasoning."""
        return copy.deepcopy(self.state.model_dump())
