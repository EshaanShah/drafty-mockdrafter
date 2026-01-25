from pydantic import BaseModel
from typing import List, Optional


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
    """
    Output from the draft recommendation engine.
    Pure recommendation, no mutation.
    """
    draft_id: str
    recommendation: Player
    reason: str
