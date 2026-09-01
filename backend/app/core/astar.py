"""
Deterministic A* Pathfinding Engine for NeuroWarehouse Grid.
"""
from typing import List, Tuple, Set, Dict, Optional
import heapq
import math

GridPoint = Tuple[int, int]


class AStarPlanner:
    def __init__(self, width: int = 30, height: int = 20):
        self.width = width
        self.height = height
        self.static_obstacles: Set[GridPoint] = set()

    def set_static_obstacles(self, obstacles: Set[GridPoint]) -> None:
        """Register permanent obstacles like warehouse shelves and boundaries."""
        self.static_obstacles = {
            (x, y) for (x, y) in obstacles
            if 0 <= x < self.width and 0 <= y < self.height
        }

    def is_traversable(
        self,
        point: GridPoint,
        dynamic_obstacles: Optional[Set[GridPoint]] = None
    ) -> bool:
        """Check if a point is within bounds and not blocked by static or dynamic obstacles."""
        x, y = point
        if not (0 <= x < self.width and 0 <= y < self.height):
            return False
        if point in self.static_obstacles:
            return False
        if dynamic_obstacles and point in dynamic_obstacles:
            return False
        return True

    @staticmethod
    def manhattan_distance(p1: GridPoint, p2: GridPoint) -> float:
        """Manhattan distance heuristic for grid-based orthogonal movement."""
        return abs(p1[0] - p2[0]) + abs(p1[1] - p2[1])

    @staticmethod
    def euclidean_distance(p1: GridPoint, p2: GridPoint) -> float:
        """Euclidean distance metric."""
        return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)

    def find_path(
        self,
        start: GridPoint,
        goal: GridPoint,
        dynamic_obstacles: Optional[Set[GridPoint]] = None,
        congestion_map: Optional[Dict[GridPoint, float]] = None,
    ) -> Optional[List[GridPoint]]:
        """
        Finds the shortest deterministic path from start to goal.
        Returns:
            List of (x, y) coordinates from start to goal inclusive, or None if unreachable.
        """
        start = (int(start[0]), int(start[1]))
        goal = (int(goal[0]), int(goal[1]))

        # Edge case: already at goal
        if start == goal:
            return [start]

        # If goal is inside a static obstacle (e.g. shelf), allow routing to the closest accessible adjacent cell
        dynamic_obs = set(dynamic_obstacles) if dynamic_obstacles else set()

        if not self.is_traversable(start):
            return None

        actual_goal = goal
        if not self.is_traversable(goal, dynamic_obs):
            # Check orthogonal neighbors of goal for the closest accessible pick dock
            neighbors = [
                (goal[0] + dx, goal[1] + dy)
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]
            ]
            valid_adjacent = [n for n in neighbors if self.is_traversable(n, dynamic_obs)]
            if not valid_adjacent:
                return None
            # Pick the adjacent node closest to start
            actual_goal = min(valid_adjacent, key=lambda p: self.manhattan_distance(start, p))

        # Priority queue stores tuples of (f_score, counter, current_node)
        # counter ensures deterministic tie-breaking without comparing tuples with nodes
        counter = 0
        open_set = []
        heapq.heappush(open_set, (0.0, counter, start))

        came_from: Dict[GridPoint, GridPoint] = {}
        g_score: Dict[GridPoint, float] = {start: 0.0}
        f_score: Dict[GridPoint, float] = {start: self.manhattan_distance(start, actual_goal)}
        in_open_set = {start}

        # 4 cardinal directions (Orthogonal movement for warehouse AGVs)
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]

        while open_set:
            _, _, current = heapq.heappop(open_set)
            in_open_set.discard(current)

            if current == actual_goal:
                # Reconstruct path
                path = [current]
                while current in came_from:
                    current = came_from[current]
                    path.append(current)
                path.reverse()
                return path

            for dx, dy in directions:
                neighbor = (current[0] + dx, current[1] + dy)

                if not self.is_traversable(neighbor, dynamic_obs):
                    continue

                # Base step cost is 1.0; add congestion penalty if any
                step_cost = 1.0
                if congestion_map and neighbor in congestion_map:
                    step_cost += congestion_map[neighbor]

                tentative_g = g_score[current] + step_cost

                if neighbor not in g_score or tentative_g < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    h = self.manhattan_distance(neighbor, actual_goal)
                    f = tentative_g + h
                    f_score[neighbor] = f

                    if neighbor not in in_open_set:
                        counter += 1
                        heapq.heappush(open_set, (f, counter, neighbor))
                        in_open_set.add(neighbor)

        # No path found
        return None

    def calculate_path_length(self, path: Optional[List[GridPoint]]) -> float:
        """Calculate total step count / Euclidean distance of path."""
        if not path or len(path) < 2:
            return 0.0
        return float(len(path) - 1)
