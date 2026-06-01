from typing import List

from agent.output_models import Verdict


VERDICT_ORDER: List[Verdict] = ["REACH", "FAIR VALUE", "GOOD VALUE", "STEAL"]


def map_score_to_verdict(score: int) -> Verdict:
    if score >= 20:
        return "STEAL"
    if score >= 8:
        return "GOOD VALUE"
    if score >= -5:
        return "FAIR VALUE"
    return "REACH"


def get_allowed_verdicts(suggested_verdict: Verdict) -> List[Verdict]:
    index = VERDICT_ORDER.index(suggested_verdict)
    start = max(0, index - 1)
    end = min(len(VERDICT_ORDER), index + 2)
    return VERDICT_ORDER[start:end]
