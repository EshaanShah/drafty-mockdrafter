from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from agent.prompt_builder import build_agent_policy_prompt, build_roster_string
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
