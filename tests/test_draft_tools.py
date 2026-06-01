import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from tools.draft_tools import (  # noqa: E402
    analyze_adp_value,
    analyze_positional_scarcity,
    analyze_roster_need,
    find_better_alternatives,
)


def test_analyze_adp_value_missing_adp_is_unknown():
    result = analyze_adp_value.invoke(
        {"player_name": "Player A", "player_adp": None, "current_pick": 10}
    )

    assert result["label"] == "unknown"
    assert result["score_impact"] == 0


def test_analyze_adp_value_strong_positive():
    result = analyze_adp_value.invoke(
        {"player_name": "Player A", "player_adp": 10, "current_pick": 30}
    )

    assert result["label"] == "strong_positive"
    assert result["score_impact"] == 8


def test_analyze_adp_value_strong_negative():
    result = analyze_adp_value.invoke(
        {"player_name": "Player A", "player_adp": 30, "current_pick": 10}
    )

    assert result["label"] == "strong_negative"
    assert result["score_impact"] == -8


def test_analyze_adp_value_high_adp_at_early_pick_is_bad():
    result = analyze_adp_value.invoke(
        {"player_name": "Player A", "player_adp": 105, "current_pick": 3}
    )

    assert result["label"] == "strong_negative"
    assert result["score_impact"] == -8


def test_analyze_roster_need_high_for_unfilled_starter():
    roster = {"qb": None, "rb": [], "wr": [], "te": None, "flex": None, "bench": []}

    result = analyze_roster_need.invoke(
        {"selected_position": "RB", "roster": roster, "league_format": "PPR"}
    )

    assert result["label"] == "high"
    assert result["score_impact"] == 8


def test_analyze_roster_need_medium_when_depth_still_matters():
    roster = {
        "qb": None,
        "rb": [{"name": "RB 1", "position": "RB"}, {"name": "RB 2", "position": "RB"}],
        "wr": [],
        "te": None,
        "flex": None,
        "bench": [],
    }

    result = analyze_roster_need.invoke(
        {"selected_position": "RB", "roster": roster, "league_format": "PPR"}
    )

    assert result["label"] == "medium"
    assert result["score_impact"] == 4


def test_analyze_roster_need_low_when_deep():
    roster = {
        "qb": None,
        "rb": [
            {"name": "RB 1", "position": "RB"},
            {"name": "RB 2", "position": "RB"},
            {"name": "RB 3", "position": "RB"},
            {"name": "RB 4", "position": "RB"},
        ],
        "wr": [],
        "te": None,
        "flex": None,
        "bench": [],
    }

    result = analyze_roster_need.invoke(
        {"selected_position": "RB", "roster": roster, "league_format": "PPR"}
    )

    assert result["label"] == "low"
    assert result["score_impact"] == -3


def test_analyze_positional_scarcity_high():
    board = [
        {"name": "WR 1", "position": "WR", "overall_adp": 51},
        {"name": "RB 1", "position": "RB", "overall_adp": 50},
        {"name": "RB 2", "position": "RB", "overall_adp": 80},
        {"name": "QB 1", "position": "QB", "overall_adp": 54},
        {"name": "TE 1", "position": "TE", "overall_adp": 55},
    ]

    result = analyze_positional_scarcity.invoke(
        {"selected_position": "WR", "selected_player_adp": 50, "available_players": board}
    )

    assert result["label"] == "high"
    assert result["score_impact"] == 7


def test_analyze_positional_scarcity_medium():
    board = [
        {"name": f"WR {index}", "position": "WR", "overall_adp": 50 + index}
        for index in range(1, 4)
    ] + [
        {"name": "RB 1", "position": "RB", "overall_adp": 50},
        {"name": "QB 1", "position": "QB", "overall_adp": 50},
    ]

    result = analyze_positional_scarcity.invoke(
        {"selected_position": "WR", "selected_player_adp": 50, "available_players": board}
    )

    assert result["label"] == "medium"
    assert result["score_impact"] == 3


def test_analyze_positional_scarcity_low():
    board = [
        {"name": f"WR {index}", "position": "WR", "overall_adp": 50 + index}
        for index in range(1, 7)
    ]

    result = analyze_positional_scarcity.invoke(
        {"selected_position": "WR", "selected_player_adp": 50, "available_players": board}
    )

    assert result["label"] == "low"
    assert result["score_impact"] == -2


def test_analyze_positional_scarcity_missing_adp_is_neutral():
    result = analyze_positional_scarcity.invoke(
        {"selected_position": "WR", "selected_player_adp": None, "available_players": []}
    )

    assert result["label"] == "neutral"
    assert result["score_impact"] == 0


def test_find_better_alternatives_none():
    selected = {"name": "Selected", "position": "WR", "overall_adp": 50}
    board = [{"name": "Other", "position": "RB", "overall_adp": 52}]

    result = find_better_alternatives.invoke(
        {"selected_player": selected, "current_pick": 45, "available_players": board}
    )

    assert result["label"] == "none"
    assert result["score_impact"] == 0


def test_find_better_alternatives_minor():
    selected = {"name": "Selected", "position": "WR", "overall_adp": 40}
    board = [{"name": "Other", "position": "RB", "overall_adp": 34}]

    result = find_better_alternatives.invoke(
        {"selected_player": selected, "current_pick": 45, "available_players": board}
    )

    assert result["label"] == "minor"
    assert result["score_impact"] == -2
    assert len(result["data"]["alternatives"]) == 1


def test_find_better_alternatives_major():
    selected = {"name": "Selected", "position": "WR", "overall_adp": 40}
    board = [
        {"name": "Better 1", "position": "RB", "overall_adp": 34},
        {"name": "Better 2", "position": "WR", "overall_adp": 32},
        {"name": "Better 3", "position": "TE", "overall_adp": 30},
    ]

    result = find_better_alternatives.invoke(
        {"selected_player": selected, "current_pick": 45, "available_players": board}
    )

    assert result["label"] == "major"
    assert result["score_impact"] == -6
    assert len(result["data"]["alternatives"]) == 3
