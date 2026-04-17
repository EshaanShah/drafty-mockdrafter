from schemas import DraftRequest


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
        f"FLEX: {roster.flex.name if roster.flex else 'Empty'}\n"
        f"BENCH: {[p.name for p in roster.bench]}"
    )


def build_agent_policy_prompt() -> str:
    """
    Temporary no-tool system prompt for testing the Groq backend path.
    """

    return """
You are a fantasy football draft assistant.

This is a temporary testing mode without tool calling.
Use only the supplied player, roster, round, pick, and league context.
Do not invent exact ADP, injury status, news, or trend data.
If exact factual data is unavailable, explicitly say it is unavailable.
Give a cautious draft recommendation based on the provided context.

Return one verdict exactly as one of:
STEAL | GOOD VALUE | FAIR VALUE | REACH

Output a single paragraph under 120 words.
""".strip()
