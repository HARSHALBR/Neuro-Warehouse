"""
LangGraph Multi-Agent Orchestration for NeuroWarehouse Closed-Loop Recovery.
"""
from typing import Literal
from langgraph.graph import StateGraph, START, END
from .state import WarehouseAgentState
from .perception import perception_node
from .reasoning import reasoning_node
from .execution import execution_node
from .validation import validation_node


def route_after_validation(state: WarehouseAgentState) -> Literal["reasoning", "__end__"]:
    """
    Conditional routing edge following deterministic validation.
    If validation fails and retry count < 3, loops back to reasoning.
    Otherwise completes the graph.
    """
    if state.get("validation_passed", False):
        return END
    
    if state.get("iteration_count", 0) >= 3:
        return END
    
    # Retry reasoning with feedback
    return "reasoning"


def build_recovery_graph() -> StateGraph:
    """Builds and compiles the closed-loop recovery workflow."""
    workflow = StateGraph(WarehouseAgentState)

    # Register Nodes
    workflow.add_node("perception", perception_node)
    workflow.add_node("reasoning", reasoning_node)
    workflow.add_node("execution", execution_node)
    workflow.add_node("validation", validation_node)

    # Register Linear Edges
    workflow.add_edge(START, "perception")
    workflow.add_edge("perception", "reasoning")
    workflow.add_edge("reasoning", "execution")
    workflow.add_edge("execution", "validation")

    # Conditional Closed-Loop Validation Edge
    workflow.add_conditional_edges(
        "validation",
        route_after_validation,
        {
            "reasoning": "reasoning",
            END: END
        }
    )

    return workflow.compile()


# Singleton compiled graph instance
recovery_graph = build_recovery_graph()
