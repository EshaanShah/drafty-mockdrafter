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
    position_rank: Optional[int] = None
    overall_adp: Optional[float] = None
    pos_adp: Optional[str] = None


class Roster(BaseModel):
    """
    Snapshot of a user's roster at a point in time.
    Mirrors frontend structure.
    """
    qb: Optional[Player] = None
    rb: List[Player] = Field(default_factory=list)
    wr: List[Player] = Field(default_factory=list)
    te: Optional[Player] = None
    flex: Optional[Player] = None
    dst: Optional[Player] = None
    k: Optional[Player] = None
    bench: List[Player] = Field(default_factory=list)


class DraftContext(BaseModel):
    """
    Draft-specific context.
    Changes every pick.
    """
    round: int
    pick: int
    current_overall_pick: Optional[int] = None
    next_user_pick: Optional[int] = None
    picks_until_next_user_pick: Optional[int] = None
    team_on_clock: Optional[int] = None
    total_teams: Optional[int] = None
    user_pick_number: Optional[int] = None
    draft_order: Optional[str] = None
    league_format: Optional[str] = None
    league: Optional[str] = None


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
    drafted_player_ids: List[str] = Field(default_factory=list)
    available_players: List[Player] = Field(default_factory=list)


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
