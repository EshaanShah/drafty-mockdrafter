import json
from typing import Any

from agent.output_models import DraftAnalysis
from schemas import DraftRequest


def _model_to_dict(value: Any) -> Any:
    if value is None:
        return None
    if hasattr(value, "model_dump"):
        return value.model_dump()
    if hasattr(value, "dict"):
        return value.dict()
    return value


def build_roster_string(request: DraftRequest) -> str:
    """
    Deterministic roster snapshot.
    Pure data formatting. No reasoning.
    """
    if not request.roster:
        return "No roster data available."

    roster = request.roster

    return (
        f"QB: {roster.qb.name if roster.qb else 'Empty'}\n"
        f"RB: {[p.name for p in roster.rb]}\n"
        f"WR: {[p.name for p in roster.wr]}\n"
        f"TE: {roster.te.name if roster.te else 'Empty'}\n"
        f"FLEX: {roster.flex.name if roster.flex else 'Empty'}\n"
        f"DST: {roster.dst.name if roster.dst else 'Empty'}\n"
        f"K: {roster.k.name if roster.k else 'Empty'}\n"
        f"BENCH: {[p.name for p in roster.bench]}"
    )


def build_available_players_string(request: DraftRequest, limit: int = 12) -> str:
    if not request.available_players:
        return "No available board data supplied."

    players = request.available_players[:limit]

    return "\n".join(
        f"- {player.name} ({player.position or 'UNK'}, ADP {player.overall_adp if player.overall_adp is not None else 'N/A'})"
        for player in players
    )


def build_agent_policy_prompt() -> str:
    return """
You are a fantasy football draft recommendation assistant for a live draft app.

You will receive:
- selected player information
- draft context
- user roster context
- available board context
- backend-generated tool analysis
- a list of allowed verdicts

Your job is to make the final recommendation using the provided evidence.

Core rules:
1. Use only the provided data and tool analysis.
2. Do not invent injury status, player news, team changes, rankings, projections, stats, headlines, or trends.
3. If live news, injuries, or projections are not provided, treat them as unavailable.
4. The backend tool analysis is a guardrail, not an absolute final answer.
5. You may choose only one of the allowed verdicts provided in the input.
6. You may move one level above or below the backend suggested verdict only if the evidence supports it.
7. Prioritize practical draft usefulness over generic player praise.
8. Consider ADP value, roster need, positional scarcity, better alternatives, league format, current pick, and next user pick as a balanced set of signals.
9. Do not overrate a player just because the player is well-known.
10. Do not call a player a STEAL unless there is clear value, roster fit, or scarcity evidence.
11. Do not call a player a REACH unless the pick is meaningfully early, poor roster fit, or better alternatives are clearly available.
12. If the evidence is mixed, choose FAIR VALUE or GOOD VALUE rather than extreme labels.
13. Be transparent about missing data.
14. Keep the recommendation concise and useful for someone currently drafting.
15. ADP is an earlier-is-better draft cost signal: lower ADP means a player is normally drafted earlier. A high ADP number at an early pick is a negative value signal.
16. Do not let ADP alone decide the verdict unless the pick is extremely early or late relative to ADP and the other signals do not offset it.

Return valid JSON only using this exact schema:
{
  "verdict": "STEAL" | "GOOD VALUE" | "FAIR VALUE" | "REACH",
  "confidence": number between 0 and 1,
  "summary": string under 90 words,
  "key_reasons": list of 2 to 4 strings,
  "warnings": list of strings,
  "alternatives_note": string
}
""".strip()


def build_llm_input(request: DraftRequest, analysis: DraftAnalysis) -> str:
    board = request.available_players[:20]
    payload = {
        "selected_player": _model_to_dict(request.player),
        "draft_context": _model_to_dict(request.context),
        "roster_summary": build_roster_string(request),
        "available_board_summary": [
            {
                "name": player.name,
                "position": player.position,
                "team": player.team,
                "overall_adp": player.overall_adp,
                "position_rank": player.position_rank,
            }
            for player in board
        ],
        "drafted_player_ids": request.drafted_player_ids,
        "tool_analysis": analysis.model_dump(),
        "allowed_verdicts": analysis.allowed_verdicts,
    }
    return json.dumps(payload, indent=2)
