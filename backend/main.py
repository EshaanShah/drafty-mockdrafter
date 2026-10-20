from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from environment import load_settings
from schemas import DraftRequest, DraftResponse
from agent.draft_agent import generate_recommendation

# --------------------
# Logging
# --------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = load_settings()

# --------------------
# App
# --------------------
app = FastAPI(
    title="Draft Assistant API",
    version="1.0.0",
)

logger.info("Starting Draft Assistant API in %s", settings.app_environment.value)

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
