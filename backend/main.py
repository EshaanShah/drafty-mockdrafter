from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from schemas import DraftRequest

from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=".env")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("GOOGLE_API_KEY is not set")

# Create app
app = FastAPI(
    title="My FastAPI App",
    description="Backend API built with FastAPI",
    version="1.0.0",
)

# CORS (adjust origins later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to frontend URL in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging

# --------------------
# Logging setup
# --------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --------------------
# App setup
# --------------------
app = FastAPI(title="Draft Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------
# Routes
# --------------------

from agent.draft_agent import generate_recommendation

@app.post("/draft/recommend")
async def recommend_draft(request: DraftRequest):
    result = generate_recommendation(request)

    return {
        "draft_id": request.draft_id,
        "recommendation": {
            "name": "Placeholder Player"
        },
        "reason": result
    }

@app.get("/health")
def health():
    return {"status": "ok"}



# Root
@app.get("/", tags=["Root"])
def root():
    return {"message": "API is live"}

# Example router import
# from app.api.routes import users
# app.include_router(users.router, prefix="/users", tags=["Users"])
