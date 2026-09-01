"""
Explainability Engine for NeuroWarehouse.
Transforms complex multi-agent deliberation metrics into concise, structured judge-facing explanations.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class DecisionFactor(BaseModel):
    name: str
    impact: str  # "positive", "neutral", "negative"
    value: str
    weight: float
    description: str


class CandidateComparison(BaseModel):
    robot_id: str
    composite_score: float
    battery: str
    distance: str
    congestion: str
    outcome: str  # "SELECTED", "REJECTED_LOW_BATTERY", "REJECTED_CONGESTION", "REJECTED_DISTANCE"


class DecisionExplanation(BaseModel):
    decision_id: str
    incident_id: str
    failed_robot_id: str
    selected_robot_id: str
    summary_sentence: str
    key_factors: List[DecisionFactor] = Field(default_factory=list)
    candidate_matrix: List[CandidateComparison] = Field(default_factory=list)
    validation_status: str


class ExplainabilityEngine:
    @staticmethod
    def build_explanation(
        incident_id: str,
        failed_robot_id: str,
        selected_robot_id: str,
        evaluated_candidates: List[Dict[str, Any]],
        validation_passed: bool,
        decision_id: Optional[str] = None
    ) -> DecisionExplanation:
        """
        Builds a comprehensive, structured explanation of the recovery decision.
        """
        import uuid
        d_id = decision_id or f"DEC_{uuid.uuid4().hex[:8]}"

        selected_cand = next((c for c in evaluated_candidates if c.get("robot_id") == selected_robot_id), None)

        key_factors = []
        if selected_cand:
            factors_raw = selected_cand.get("factor_breakdown", {})
            
            # Battery Factor
            bat_info = factors_raw.get("battery", {})
            key_factors.append(DecisionFactor(
                name="Battery Reserve",
                impact=bat_info.get("impact", "positive"),
                value=bat_info.get("value", f"{selected_cand.get('battery', 0.0):.0f}%"),
                weight=0.35,
                description=f"Sufficient reserve margin ({selected_cand.get('battery_margin', 0.0):.0f}%) to complete entire route."
            ))

            # Distance Factor
            dist_info = factors_raw.get("distance", {})
            key_factors.append(DecisionFactor(
                name="A* Path Distance",
                impact=dist_info.get("impact", "positive"),
                value=dist_info.get("value", f"{selected_cand.get('distance', 0.0):.0f}m"),
                weight=0.35,
                description="Fastest accessible transit time along warehouse aisles."
            ))

            # Congestion Factor
            cong_info = factors_raw.get("congestion", {})
            key_factors.append(DecisionFactor(
                name="Corridor Clearance",
                impact=cong_info.get("impact", "positive"),
                value=cong_info.get("value", "0.0"),
                weight=0.20,
                description="Path avoids active bottlenecks and high-traffic aisles."
            ))

        # Build candidate comparison matrix
        candidate_matrix = []
        for cand in evaluated_candidates[:5]:
            r_id = cand.get("robot_id", "")
            score = cand.get("composite_score", 0.0)
            bat = f"{cand.get('battery', 0.0):.0f}%"
            dist = f"{cand.get('distance', 0.0):.0f}m"
            cong = f"{cand.get('congestion_penalty', 0.0):.1f}"

            if r_id == selected_robot_id:
                outcome = "SELECTED"
            elif cand.get("battery_margin", 0.0) < 15.0:
                outcome = "REJECTED_LOW_BATTERY"
            elif cand.get("congestion_penalty", 0.0) > 1.0:
                outcome = "REJECTED_CONGESTION"
            else:
                outcome = "REJECTED_LOWER_RANK"

            candidate_matrix.append(CandidateComparison(
                robot_id=r_id,
                composite_score=score,
                battery=bat,
                distance=dist,
                congestion=cong,
                outcome=outcome
            ))

        # Concise judge summary
        summary = (
            f"Robot {failed_robot_id} failed. {selected_robot_id} was selected because it minimized total recovery cost "
            f"while maintaining safe battery margin and avoiding corridor congestion."
        )

        return DecisionExplanation(
            decision_id=d_id,
            incident_id=incident_id,
            failed_robot_id=failed_robot_id,
            selected_robot_id=selected_robot_id,
            summary_sentence=summary,
            key_factors=key_factors,
            candidate_matrix=candidate_matrix,
            validation_status="PASSED" if validation_passed else "FAILED"
        )
