from typing import Any, Dict, List

from agent.output_models import DraftAnalysis, DraftSignal
from engine.verdict_utils import get_allowed_verdicts, map_score_to_verdict
from schemas import DraftRequest
from tools.draft_tools import (
    _analyze_adp_value_impl,
    _analyze_positional_scarcity_impl,
    _analyze_roster_need_impl,
    _find_better_alternatives_impl,
)


def _model_to_dict(value: Any) -> Any:
    if value is None:
        return None
    if hasattr(value, "model_dump"):
        return value.model_dump()
    if hasattr(value, "dict"):
        return value.dict()
    return value


def _draft_signal(raw_signal: Dict[str, Any]) -> DraftSignal:
    return DraftSignal(
        label=raw_signal["label"],
        score_impact=int(raw_signal["score_impact"]),
        explanation=raw_signal["explanation"],
        data=raw_signal.get("data", {}),
    )


def _build_warnings(request: DraftRequest) -> List[str]:
    warnings = ["No live injury/news data included yet."]

    if len(request.available_players or []) < 20:
        warnings.append("Available board has fewer than 20 players, so scarcity and alternatives may be less reliable.")

    if request.player.overall_adp is None:
        warnings.append("Selected player ADP is missing.")

    return warnings


def analyze_pick(request: DraftRequest) -> DraftAnalysis:
    current_pick = request.context.current_overall_pick or request.context.pick
    league_format = request.context.league_format or request.context.league
    selected_position = request.player.position
    selected_adp = request.player.overall_adp
    roster = _model_to_dict(request.roster)
    selected_player = _model_to_dict(request.player)
    available_players = [_model_to_dict(player) for player in request.available_players]

    adp_signal = _draft_signal(
        _analyze_adp_value_impl(
            player_name=request.player.name,
            player_adp=selected_adp,
            current_pick=current_pick,
        )
    )
    roster_need_signal = _draft_signal(
        _analyze_roster_need_impl(
            selected_position=selected_position,
            roster=roster,
            league_format=league_format,
        )
    )
    scarcity_signal = _draft_signal(
        _analyze_positional_scarcity_impl(
            selected_position=selected_position,
            selected_player_adp=selected_adp,
            available_players=available_players,
            selected_player_name=request.player.name,
        )
    )
    alternatives_signal = _draft_signal(
        _find_better_alternatives_impl(
            selected_player=selected_player,
            current_pick=current_pick,
            available_players=available_players,
        )
    )

    score = sum(
        signal.score_impact
        for signal in [
            adp_signal,
            roster_need_signal,
            scarcity_signal,
            alternatives_signal,
        ]
    )
    suggested_verdict = map_score_to_verdict(score)

    return DraftAnalysis(
        suggested_verdict=suggested_verdict,
        allowed_verdicts=get_allowed_verdicts(suggested_verdict),
        score=score,
        adp_signal=adp_signal,
        roster_need_signal=roster_need_signal,
        scarcity_signal=scarcity_signal,
        alternatives_signal=alternatives_signal,
        warnings=_build_warnings(request),
    )
