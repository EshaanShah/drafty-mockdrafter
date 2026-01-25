import re
from schemas import DraftResponse


VERDICT_PATTERN = re.compile(
    r"\b(STEAL|GOOD VALUE|FAIR VALUE|REACH)\b",
    re.IGNORECASE
)


def parse_agent_output(
        raw_text: str,
        draft_id: str
) -> DraftResponse:
    """
    Extracts verdict + explanation from agent output.
    Raises ValueError if parsing fails.
    """

    if not raw_text or not raw_text.strip():
        raise ValueError("Empty agent output")

    verdict_match = VERDICT_PATTERN.search(raw_text)

    if not verdict_match:
        raise ValueError("No valid verdict found in agent output")

    verdict = verdict_match.group(1).upper()

    explanation = raw_text.strip()

    return DraftResponse(
        draft_id=draft_id,
        verdict=verdict,
        explanation=explanation
    )