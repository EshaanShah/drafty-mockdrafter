from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from dotenv import load_dotenv
import os

from schemas import DraftRequest, DraftResponse
from agent.draft_agent import generate_recommendation

# --------------------
# Env
# --------------------
load_dotenv()

if not os.getenv("GROQ_API_KEY"):
    logging.warning("GROQ_API_KEY is not set; draft recommendations will use deterministic fallback if Groq fails.")

# --------------------
# Logging
# --------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --------------------
# App
# --------------------
app = FastAPI(
    title="Draft Assistant API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------
# Routes
# --------------------

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/draft/recommend", response_model=DraftResponse)
def recommend_draft(request: DraftRequest):
    if logger.isEnabledFor(logging.INFO):
        try:
            logger.info("DRAFT REQUEST: %s", request.model_dump_json())
        except AttributeError:
            logger.info("DRAFT REQUEST: %s", request.json())

    recommendation = generate_recommendation(request)

    logger.info("FINAL AGENT OUTPUT: %s", recommendation.model_dump_json())

    return DraftResponse(
        draft_id=recommendation.draft_id,
        verdict=recommendation.verdict,
        explanation=recommendation.explanation,
    )

@app.get("/")
def root():
    return {"message": "API is live"}
