from dotenv import load_dotenv
import json
import logging
import os
import re

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from agent.output_models import DraftAnalysis, FinalDraftRecommendationResponse, LLMRecommendationOutput
from agent.prompt_builder import build_agent_policy_prompt, build_llm_input
from engine.draft_analyzer import analyze_pick
from schemas import DraftRequest

load_dotenv()

# --------------------
# LLM
# --------------------

logger = logging.getLogger("draft_agent")
llm = None


def _get_llm():
    global llm
    if llm is None:
        llm = ChatGroq(
            model="llama-3.1-8b-instant",
            api_key=os.getenv("GROQ_API_KEY"),
        )
    return llm


def _extract_json(raw_text: str) -> str:
    if not raw_text or not raw_text.strip():
        raise ValueError("Empty LLM output")

    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("No JSON object found in LLM output")

    return text[start:end + 1]


def _parse_llm_output(raw_text: str) -> LLMRecommendationOutput:
    json_text = _extract_json(raw_text)
    payload = json.loads(json_text)
    return LLMRecommendationOutput.model_validate(payload)


def _response_content(response) -> str:
    if hasattr(response, "content") and response.content:
        return response.content

    if hasattr(response, "generations"):
        try:
            return response.generations[0][0].text
        except Exception:
            pass

    return ""


def _format_final_explanation(output: LLMRecommendationOutput) -> str:
    reasons = " ".join(output.key_reasons[:3])
    parts = [output.summary]
    if reasons:
        parts.append(f"Reasons: {reasons}")
    if output.alternatives_note:
        parts.append(output.alternatives_note)
    return " ".join(parts).strip()


def _signal_strength(signal):
    return abs(signal.score_impact)


def _build_fallback_summary(analysis: DraftAnalysis) -> str:
    signals = [
        analysis.adp_signal,
        analysis.roster_need_signal,
        analysis.scarcity_signal,
        analysis.alternatives_signal,
    ]
    strongest = sorted(signals, key=_signal_strength, reverse=True)[:2]
    explanation = " ".join(signal.explanation for signal in strongest if signal.explanation)
    return (
        f"{analysis.suggested_verdict}: {explanation}"
        if explanation
        else f"{analysis.suggested_verdict}: Deterministic draft analysis was used because the LLM response was invalid."
    )


def _alternatives_note(analysis: DraftAnalysis) -> str:
    alternatives = analysis.alternatives_signal.data.get("alternatives", [])
    if not alternatives:
        return "No clearly better ADP alternatives were found on the supplied board."

    names = ", ".join(
        f"{player['name']} ({player.get('position') or 'UNK'}, ADP {player.get('adp')})"
        for player in alternatives
    )
    return f"Potential better alternatives: {names}."


def _fallback_response(request: DraftRequest, analysis: DraftAnalysis) -> FinalDraftRecommendationResponse:
    return FinalDraftRecommendationResponse(
        draft_id=request.draft_id,
        verdict=analysis.suggested_verdict,
        explanation=_build_fallback_summary(analysis),
        confidence=0.5,
        key_reasons=[
            analysis.adp_signal.explanation,
            analysis.roster_need_signal.explanation,
            analysis.scarcity_signal.explanation,
            analysis.alternatives_signal.explanation,
        ],
        warnings=analysis.warnings,
        alternatives_note=_alternatives_note(analysis),
        analysis=analysis,
    )


def _invoke_llm(system_message: SystemMessage, user_message: HumanMessage) -> str:
    response = _get_llm().invoke([system_message, user_message])
    logger.info("LLM RESPONSE TYPE: %s", type(response))
    logger.info("LLM RESPONSE CONTENT: %r", getattr(response, "content", response))
    return _response_content(response)


# --------------------
# ENTRY POINT
# --------------------

def generate_recommendation(request: DraftRequest) -> FinalDraftRecommendationResponse:
    analysis = analyze_pick(request)

    system_message = SystemMessage(
        content=build_agent_policy_prompt()
    )

    user_message = HumanMessage(
        content=build_llm_input(request, analysis)
    )

    try:
        raw_output = _invoke_llm(system_message, user_message)
        parsed_output = _parse_llm_output(raw_output)

        if parsed_output.verdict not in analysis.allowed_verdicts:
            correction_message = HumanMessage(
                content=(
                    "Your previous response used a verdict outside the allowed verdicts "
                    f"{analysis.allowed_verdicts}. Return corrected valid JSON only. "
                    f"Use this same input:\n{build_llm_input(request, analysis)}"
                )
            )
            raw_output = _invoke_llm(system_message, correction_message)
            parsed_output = _parse_llm_output(raw_output)

        if parsed_output.verdict not in analysis.allowed_verdicts:
            logger.warning("LLM verdict outside allowed verdicts after retry: %s", parsed_output.verdict)
            return _fallback_response(request, analysis)

        warnings = list(dict.fromkeys([*analysis.warnings, *parsed_output.warnings]))

        return FinalDraftRecommendationResponse(
            draft_id=request.draft_id,
            verdict=parsed_output.verdict,
            explanation=_format_final_explanation(parsed_output),
            confidence=parsed_output.confidence,
            key_reasons=parsed_output.key_reasons,
            warnings=warnings,
            alternatives_note=parsed_output.alternatives_note,
            analysis=analysis,
        )
    except Exception as exc:
        logger.exception("Draft recommendation LLM flow failed; using deterministic fallback: %s", exc)
        return _fallback_response(request, analysis)
