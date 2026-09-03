from typing import Optional, Literal
from pydantic import BaseModel, Field

Role = Literal["ponteiro", "oposto", "libero", "ds_spiker", "ds_tsk", "setter"]
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

# ---------------------------------------------------------------------------
# Payload do botão "Salvar Partida (Staff)" — vem com TUDO de uma vez:
# os dois times (por ID de cargo do Discord), o ID de Discord de cada
# jogador local, e a estatística completa de cada set.
# ---------------------------------------------------------------------------
class SaveMatchStatsIn(BaseModel):
    pontos_feitos: int = 0
    pontos_tomados: int = 0
    block: int = 0
    assistencias: int = 0
    erro_ofensivo: int = 0
    erro_defensivo: int = 0


class SaveMatchLineupIn(BaseModel):
    # Vem no formato do front (com acento/maiúscula), ex: "Ds Spiker".
    # É normalizado pro formato do banco (ex: "ds_spiker") dentro da rota.
    role: str
    player_name: str
    is_substitute: bool = False
    stats: SaveMatchStatsIn


class SaveMatchSetIn(BaseModel):
    set_number: int
    score_home: int = 0
    score_away: int = 0
    lineups: list[SaveMatchLineupIn]


class SaveMatchIn(BaseModel):
    format: Literal[3, 5]
    team_home_role_id: str = Field(min_length=1)
    team_away_role_id: str = Field(min_length=1)
    # nome local do jogador (como digitado no card) -> ID de Discord dele
    player_discord_ids: dict[str, str]
    sets: list[SaveMatchSetIn]