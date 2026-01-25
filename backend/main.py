from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from dotenv import load_dotenv
import os

from schemas import DraftRequest, DraftResponse
from agent.draft_agent import generate_recommendation
from agent.output_parser import parse_agent_output

# --------------------
# Env
# --------------------
load_dotenv()

# Optional sanity check
if not os.getenv("GROQ_API_KEY"):
    raise RuntimeError("GROQ_API_KEY is not set")

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
    raw_output = generate_recommendation(request)

    logger.info(f"RAW AGENT OUTPUT: {repr(raw_output)}")

    try:
        return parse_agent_output(
            raw_text=raw_output,
            draft_id=request.draft_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Agent output parsing failed: {str(e)}"
        )

@app.get("/")
def root():
    return {"message": "API is live"}
