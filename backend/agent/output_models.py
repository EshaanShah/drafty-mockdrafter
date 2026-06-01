from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


Verdict = Literal["STEAL", "GOOD VALUE", "FAIR VALUE", "REACH"]
SignalLabel = Literal[
    "strong_positive",
    "positive",
    "neutral",
    "negative",
    "strong_negative",
    "unknown",
    "high",
    "medium",
    "low",
    "none",
    "minor",
    "major",
]


class BetterAlternative(BaseModel):
    name: str
    position: Optional[str] = None
    adp: Optional[float] = None
    reason: str


class DraftSignal(BaseModel):
    label: SignalLabel
    score_impact: int
    explanation: str
    data: Dict[str, Any] = Field(default_factory=dict)


class DraftAnalysis(BaseModel):
    suggested_verdict: Verdict
    allowed_verdicts: List[Verdict]
    score: int
    adp_signal: DraftSignal
    roster_need_signal: DraftSignal
    scarcity_signal: DraftSignal
    alternatives_signal: DraftSignal
    warnings: List[str] = Field(default_factory=list)


class LLMRecommendationOutput(BaseModel):
    verdict: Verdict
    confidence: float = Field(ge=0, le=1)
    summary: str
    key_reasons: List[str]
    warnings: List[str] = Field(default_factory=list)
    alternatives_note: str


class FinalDraftRecommendationResponse(BaseModel):
    draft_id: str
    verdict: Verdict
    explanation: str
    confidence: Optional[float] = None
    key_reasons: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    alternatives_note: str = ""
    analysis: DraftAnalysis
