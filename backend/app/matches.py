from typing import Optional, Literal
from pydantic import BaseModel, Field

Role = Literal["ponteiro", "setter", "oposto", "ds_spiker", "libero", "ds_tsk"]
StatField = Literal[
    "pontos_feitos", "pontos_tomados", "block", "assistencias",
    "erro_ofensivo", "erro_defensivo", "sets_recebidos", "recepcoes",
]


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class PlayerCreate(BaseModel):
    nickname: str = Field(min_length=1, max_length=60)
    team_id: Optional[str] = None


class MatchCreate(BaseModel):
    team_home_id: Optional[str] = None
    team_away_id: Optional[str] = None
    format: Literal[3, 5] = 3
    stat_mode: Literal["basic", "advanced"] = "basic"


class LineupCreate(BaseModel):
    role: Role
    player_id: str


class StatUpdate(BaseModel):
    field: StatField
    delta: Literal[1, -1]  # incrementa ou decrementa em 1


class SubstitutionCreate(BaseModel):
    role: Role
    out_player_id: str
    in_player_nickname: str
    apply_to: Literal["current", "current_and_next", "all"] = "current"
