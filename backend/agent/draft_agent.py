from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from agent.prompt_builder import build_agent_policy_prompt, build_roster_string, build_available_players_string
from schemas import DraftRequest
import os

import logging

load_dotenv()

# --------------------
# LLM
# --------------------

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=os.getenv("GROQ_API_KEY"),
)


# --------------------
# ENTRY POINT
# --------------------

def generate_recommendation(request: DraftRequest) -> str:
    system_message = SystemMessage(
        content=build_agent_policy_prompt()
    )

    roster_string = build_roster_string(request)
    available_players_string = build_available_players_string(request)
    context = request.context

    user_message = HumanMessage(
        content=f"""
Player: {request.player.name}
Player ID: {request.player.id}
Position: {request.player.position}
Position Rank: {request.player.position_rank}
Overall ADP: {request.player.overall_adp}
Positional ADP: {request.player.pos_adp}
Team: {request.player.team}

Round: {context.round}
Pick In Round: {context.pick}
Current Overall Pick: {context.current_overall_pick}
Next User Pick: {context.next_user_pick}
Picks Until Next User Pick: {context.picks_until_next_user_pick}
Team On Clock: {context.team_on_clock}
Total Teams: {context.total_teams}
User Pick Number: {context.user_pick_number}
Draft Order: {context.draft_order}
League Format: {context.league_format or context.league}

Roster Snapshot:
{roster_string}

Drafted Player IDs:
{request.drafted_player_ids}

Top Available Players By ADP:
{available_players_string}
""".strip()
    )

    response = llm.invoke(
        [system_message, user_message]
    )
    logger = logging.getLogger("draft_agent")

    logger.info("LLM RESPONSE TYPE: %s", type(response))
    logger.info("LLM RESPONSE CONTENT: %r", response.content)

    if hasattr(response, "content") and response.content:
        return response.content

    # Groq / OpenAI-style fallback
    if hasattr(response, "generations"):
        try:
            return response.generations[0][0].text
        except Exception:
            pass

    # Absolute fallback (safe failure)
    return ""
