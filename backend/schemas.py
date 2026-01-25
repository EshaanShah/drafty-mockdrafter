from typing import List, Optional, Literal
from pydantic import BaseModel, Field

# --------------------
# Core domain models
# --------------------

class Player(BaseModel):
    """
    Represents a player identity.
    Stable across drafts and seasons.
    """
    id: Optional[str] = None
    name: str
    position: Optional[str] = None
    team: Optional[str] = None


class Roster(BaseModel):
    """
    Snapshot of a user's roster at a point in time.
    Mirrors frontend structure.
    """
    qb: Optional[Player] = None
    rb: List[Player] = []
    wr: List[Player] = []
    flex: Optional[Player] = None
    bench: List[Player] = []


class DraftContext(BaseModel):
    """
    Draft-specific context.
    Changes every pick.
    """
    round: int
    pick: int
    league: str


# --------------------
# API request / response
# --------------------

class DraftRequest(BaseModel):
    """
    Input to the draft recommendation engine.
    """
    draft_id: str
    player: Player
    context: DraftContext
    roster: Optional[Roster] = None


class DraftResponse(BaseModel):
    draft_id: str
    verdict: Literal[
        "STEAL",
        "GOOD VALUE",
        "FAIR VALUE",
        "REACH"
    ]
    explanation: str = Field(
        ...,
        min_length=10,
        description="Short explanation justifying the verdict"
    )
