"""
Unit tests for deterministic A* grid pathfinder.
"""
import pytest
from app.core.astar import AStarPlanner


def test_astar_straight_line():
    planner = AStarPlanner(width=30, height=20)
    start = (2, 2)
    goal = (2, 6)
    path = planner.find_path(start, goal)
    assert path is not None
    assert path[0] == start
    assert path[-1] == goal
    assert len(path) == 5  # (2,2), (2,3), (2,4), (2,5), (2,6)


def test_astar_obstacle_avoidance():
    planner = AStarPlanner(width=10, height=10)
    # Put a vertical wall at x=3, y=1..4
    obstacles = {(3, 1), (3, 2), (3, 3), (3, 4)}
    planner.set_static_obstacles(obstacles)

    start = (1, 2)
    goal = (5, 2)
    path = planner.find_path(start, goal)

    assert path is not None
    assert path[0] == start
    assert path[-1] == goal
    # Assert path does not intersect obstacles
    for pt in path:
        assert pt not in obstacles


def test_astar_dynamic_obstacle_rerouting():
    planner = AStarPlanner(width=10, height=10)
    start = (0, 0)
    goal = (2, 0)
    
    # Normal path goes through (1, 0)
    direct_path = planner.find_path(start, goal)
    assert (1, 0) in direct_path

    # Inject dynamic obstacle (failed robot at (1, 0))
    dynamic_obs = {(1, 0)}
    rerouted_path = planner.find_path(start, goal, dynamic_obstacles=dynamic_obs)

    assert rerouted_path is not None
    assert (1, 0) not in rerouted_path
    assert rerouted_path[0] == start
    assert rerouted_path[-1] == goal


def test_astar_unreachable_target():
    planner = AStarPlanner(width=5, height=5)
    # Box in target (2, 2) completely
    obstacles = {(1, 2), (3, 2), (2, 1), (2, 3), (2, 2)}
    planner.set_static_obstacles(obstacles)

    start = (0, 0)
    goal = (2, 2)
    path = planner.find_path(start, goal)
    assert path is None


def test_astar_congestion_penalty():
    planner = AStarPlanner(width=6, height=6)
    start = (0, 1)
    goal = (4, 1)
    
    # Path 1 (direct straight row y=1) vs Path 2 (diverted row y=0)
    # Congestion placed along y=1
    congestion = {(1, 1): 10.0, (2, 1): 10.0, (3, 1): 10.0}
    
    path = planner.find_path(start, goal, congestion_map=congestion)
    assert path is not None
    # Planner should route around the congested cells
    for pt in [(1, 1), (2, 1), (3, 1)]:
        assert pt not in path
