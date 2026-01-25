from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.tools import tool

from agent.prompt_builder import build_agent_policy_prompt, build_roster_string
from schemas import DraftRequest
import os

import logging
import json

load_dotenv()

# --------------------
# LLM
# --------------------

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=os.getenv("GROQ_API_KEY"),
)
# --------------------
# TOOL STUBS (FACTS ONLY)
# --------------------

@tool
def adp_tool(player_name: str) -> str:
    """Returns ADP data for a player. Required for Tier 1 baseline."""
    return "ADP data unavailable"

@tool
def roster_fit_tool(roster_summary: str) -> str:
    """Evaluates roster fit. Used only for Tier 2 adjustments."""
    return "Roster fit data unavailable"

@tool
def risk_tool(player_name: str) -> str:
    """Returns injury and risk information. Used only for Tier 2."""
    return "Risk data unavailable"


tools = [adp_tool, roster_fit_tool, risk_tool]

# Bind tools to model (THIS IS THE KEY STEP)
llm_with_tools = llm.bind_tools(tools)


# --------------------
# ENTRY POINT
# --------------------

def generate_recommendation(request: DraftRequest) -> str:
    system_message = SystemMessage(
        content=build_agent_policy_prompt()
    )

    roster_string = build_roster_string(request)

    user_message = HumanMessage(
        content=f"""
Player: {request.player.name}
Round: {request.context.round}
Pick: {request.context.pick}
League: {request.context.league}

Roster Snapshot:
{roster_string}
""".strip()
    )

    response = llm_with_tools.invoke(
        [system_message, user_message]
    )
    logger = logging.getLogger("draft_agent")

    logger.info("LLM RESPONSE TYPE: %s", type(response))
    logger.info("LLM RESPONSE CONTENT: %r", response.content)
    logger.info("LLM RESPONSE TOOL_CALLS: %r", response.tool_calls)

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
