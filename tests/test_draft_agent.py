import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from agent import draft_agent  # noqa: E402
from schemas import DraftContext, DraftRequest, Player, Roster  # noqa: E402


class FakeResponse:
    def __init__(self, content):
        self.content = content


class InvalidVerdictLLM:
    def __init__(self):
        self.calls = 0

    def invoke(self, messages):
        self.calls += 1
        return FakeResponse(
            """
            {
              "verdict": "STEAL",
              "confidence": 0.8,
              "summary": "Invalid outside the allowed set for this test.",
              "key_reasons": ["Reason one", "Reason two"],
              "warnings": [],
              "alternatives_note": "No note."
            }
            """
        )


def test_generate_recommendation_falls_back_after_invalid_llm_verdict(monkeypatch):
    fake_llm = InvalidVerdictLLM()
    monkeypatch.setattr(draft_agent, "llm", fake_llm)

    request = DraftRequest(
        draft_id="draft-1",
        player=Player(name="Selected WR", position="WR", overall_adp=30),
        context=DraftContext(round=2, pick=10, current_overall_pick=15, league_format="PPR"),
        roster=Roster(),
        available_players=[
            Player(name=f"Player {index}", position="RB", overall_adp=60 + index)
            for index in range(25)
        ],
    )

    response = draft_agent.generate_recommendation(request)

    assert fake_llm.calls == 2
    assert response.verdict == response.analysis.suggested_verdict
    assert response.verdict in response.analysis.allowed_verdicts
    assert response.confidence == 0.5
