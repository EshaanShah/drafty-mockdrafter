import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from engine.verdict_utils import get_allowed_verdicts, map_score_to_verdict  # noqa: E402


def test_map_score_to_verdict():
    assert map_score_to_verdict(20) == "STEAL"
    assert map_score_to_verdict(8) == "GOOD VALUE"
    assert map_score_to_verdict(7) == "FAIR VALUE"
    assert map_score_to_verdict(-5) == "FAIR VALUE"
    assert map_score_to_verdict(-6) == "REACH"


def test_get_allowed_verdicts_middle():
    assert get_allowed_verdicts("GOOD VALUE") == ["FAIR VALUE", "GOOD VALUE", "STEAL"]


def test_get_allowed_verdicts_lower_edge():
    assert get_allowed_verdicts("REACH") == ["REACH", "FAIR VALUE"]


def test_get_allowed_verdicts_upper_edge():
    assert get_allowed_verdicts("STEAL") == ["GOOD VALUE", "STEAL"]
