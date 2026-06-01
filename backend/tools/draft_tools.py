from typing import Any, Dict, List, Optional

from langchain_core.tools import tool


def _player_name(player: Any) -> Optional[str]:
    if isinstance(player, dict):
        return player.get("name")
    return getattr(player, "name", None)


def _player_position(player: Any) -> Optional[str]:
    if isinstance(player, dict):
        return player.get("position")
    return getattr(player, "position", None)


def _player_adp(player: Any) -> Optional[float]:
    if isinstance(player, dict):
        adp = player.get("overall_adp", player.get("adp"))
    else:
        adp = getattr(player, "overall_adp", None)

    if adp is None:
        return None

    try:
        return float(adp)
    except (TypeError, ValueError):
        return None


def _signal(
    label: str,
    score_impact: int,
    explanation: str,
    data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    result: Dict[str, Any] = {
        "label": label,
        "score_impact": score_impact,
        "explanation": explanation,
    }
    if data:
        result["data"] = data
    return result


def _analyze_adp_value_impl(
    player_name: str,
    player_adp: Optional[float],
    current_pick: Optional[int],
) -> Dict[str, Any]:
    if player_adp is None or current_pick is None:
        return _signal(
            "unknown",
            0,
            f"ADP value is unknown for {player_name} because ADP or current pick is missing.",
            {"player_adp": player_adp, "current_pick": current_pick},
        )

    value_delta = int(current_pick) - float(player_adp)

    if value_delta >= 15:
        label, score = "strong_positive", 8
    elif value_delta >= 5:
        label, score = "positive", 5
    elif value_delta >= -4:
        label, score = "neutral", 0
    elif value_delta >= -14:
        label, score = "negative", -5
    else:
        label, score = "strong_negative", -8

    return _signal(
        label,
        score,
        (
            f"{player_name} has an ADP value delta of {value_delta:.1f} at pick {current_pick}. "
            "Positive means the player is being drafted later than ADP; negative means the pick is early versus ADP."
        ),
        {
            "player_adp": float(player_adp),
            "current_pick": int(current_pick),
            "value_delta": value_delta,
        },
    )


@tool
def analyze_adp_value(
    player_name: str,
    player_adp: Optional[float],
    current_pick: Optional[int],
) -> Dict[str, Any]:
    """Evaluate whether a selected player is an ADP value at the current pick."""
    return _analyze_adp_value_impl(player_name, player_adp, current_pick)


def _count_position(roster: Any, position: str) -> int:
    if roster is None:
        return 0

    pos = position.lower()
    value = roster.get(pos) if isinstance(roster, dict) else getattr(roster, pos, None)

    if isinstance(value, list):
        count = len(value)
    elif value is None:
        count = 0
    else:
        count = 1

    bench = roster.get("bench", []) if isinstance(roster, dict) else getattr(roster, "bench", [])
    count += sum(1 for player in bench if (_player_position(player) or "").upper() == position)

    flex = roster.get("flex") if isinstance(roster, dict) else getattr(roster, "flex", None)
    if flex is not None and (_player_position(flex) or "").upper() == position:
        count += 1

    return count


def _analyze_roster_need_impl(
    selected_position: Optional[str],
    roster: Any,
    league_format: Optional[str],
) -> Dict[str, Any]:
    position = (selected_position or "").upper()
    starter_requirements = {"QB": 1, "RB": 2, "WR": 2, "TE": 1}

    if position not in starter_requirements:
        return _signal(
            "low",
            -3,
            f"{position or 'Unknown position'} is not a core starter/flex need in this version.",
            {"league_format": league_format, "filled": 0, "starter_requirement": 0},
        )

    filled = _count_position(roster, position)
    starter_requirement = starter_requirements[position]

    if filled < starter_requirement:
        label, score = "high", 8
        explanation = (
            f"{position} is a high roster need: {filled} filled against "
            f"{starter_requirement} expected starter slot(s)."
        )
    elif position in {"RB", "WR", "TE"} and filled <= starter_requirement + 1:
        label, score = "medium", 4
        explanation = (
            f"{position} starters are covered, but depth and FLEX options still matter."
        )
    elif position == "QB" and filled == starter_requirement:
        label, score = "medium", 4
        explanation = "QB starter is covered, but a backup can still have some value."
    else:
        label, score = "low", -3
        explanation = f"{position} is already relatively deep on this roster."

    return _signal(
        label,
        score,
        explanation,
        {
            "selected_position": position,
            "filled": filled,
            "starter_requirement": starter_requirement,
            "league_format": league_format,
        },
    )


@tool
def analyze_roster_need(
    selected_position: Optional[str],
    roster: Any,
    league_format: Optional[str],
) -> Dict[str, Any]:
    """Evaluate how much the selected player's position fits the roster."""
    return _analyze_roster_need_impl(selected_position, roster, league_format)


def _analyze_positional_scarcity_impl(
    selected_position: Optional[str],
    selected_player_adp: Optional[float],
    available_players: List[Any],
    selected_player_name: Optional[str] = None,
) -> Dict[str, Any]:
    position = (selected_position or "").upper()

    if selected_player_adp is None or not position or len(available_players or []) < 5:
        return _signal(
            "neutral",
            0,
            "Positional scarcity is neutral because ADP data is missing or the available board is too small.",
            {
                "selected_position": position,
                "selected_player_adp": selected_player_adp,
                "available_count": len(available_players or []),
            },
        )

    comparable_players = []
    skipped_selected_player = False
    for player in available_players or []:
        name = _player_name(player)
        if selected_player_name and name == selected_player_name:
            continue
        if (_player_position(player) or "").upper() != position:
            continue
        adp = _player_adp(player)
        if adp is None:
            continue
        if (
            not selected_player_name
            and not skipped_selected_player
            and adp == float(selected_player_adp)
        ):
            skipped_selected_player = True
            continue
        if abs(adp - float(selected_player_adp)) <= 12:
            comparable_players.append({"name": name, "position": position, "adp": adp})

    comparable_count = len(comparable_players)

    if comparable_count <= 1:
        label, score = "high", 7
    elif comparable_count <= 4:
        label, score = "medium", 3
    else:
        label, score = "low", -2

    return _signal(
        label,
        score,
        f"{position} scarcity is {label}: {comparable_count} comparable player(s) are within 12 ADP spots.",
        {
            "selected_position": position,
            "selected_player_adp": float(selected_player_adp),
            "comparable_count": comparable_count,
            "comparable_players": comparable_players,
        },
    )


@tool
def analyze_positional_scarcity(
    selected_position: Optional[str],
    selected_player_adp: Optional[float],
    available_players: List[Any],
) -> Dict[str, Any]:
    """Evaluate same-position scarcity around the selected player's ADP."""
    return _analyze_positional_scarcity_impl(
        selected_position,
        selected_player_adp,
        available_players,
    )


def _find_better_alternatives_impl(
    selected_player: Any,
    current_pick: Optional[int],
    available_players: List[Any],
) -> Dict[str, Any]:
    selected_name = _player_name(selected_player) or "Selected player"
    selected_adp = _player_adp(selected_player)

    if selected_adp is None or current_pick is None:
        return _signal(
            "none",
            0,
            f"Better alternatives cannot be compared because ADP or current pick is missing for {selected_name}.",
            {"alternatives": []},
        )

    selected_delta = int(current_pick) - selected_adp
    alternatives = []

    for player in available_players or []:
        name = _player_name(player)
        if name == selected_name:
            continue

        adp = _player_adp(player)
        if adp is None:
            continue

        value_delta = int(current_pick) - adp
        improvement = value_delta - selected_delta

        if improvement >= 5:
            alternatives.append(
                {
                    "name": name or "Unknown player",
                    "position": _player_position(player),
                    "adp": adp,
                    "reason": f"ADP value delta is {improvement:.1f} points better.",
                    "value_delta": value_delta,
                }
            )

    alternatives = sorted(
        alternatives,
        key=lambda item: item["value_delta"],
        reverse=True,
    )[:3]

    if not alternatives:
        label, score = "none", 0
        explanation = "No clearly better ADP alternatives were found on the supplied board."
    elif len(alternatives) >= 3:
        label, score = "major", -6
        explanation = "Multiple clearly better ADP alternatives are available."
    else:
        label, score = "minor", -2
        explanation = "One or two better ADP alternatives are available."

    return _signal(
        label,
        score,
        explanation,
        {
            "selected_value_delta": selected_delta,
            "alternatives": alternatives,
        },
    )


@tool
def find_better_alternatives(
    selected_player: Any,
    current_pick: Optional[int],
    available_players: List[Any],
) -> Dict[str, Any]:
    """Find better available alternatives by ADP value delta."""
    return _find_better_alternatives_impl(selected_player, current_pick, available_players)
