from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Team, Player, Match, MatchSet, SetLineup, SetStats
from app.schemas.schemas import SaveMatchIn, SaveMatchLineupIn

router = APIRouter(prefix="/matches", tags=["save-match"])

# O front manda os papéis com acento/maiúscula (como aparece na tela).
# O banco guarda no formato "slug" (minúsculo, sem acento, com underscore).
ROLE_NORMALIZE = {
    "ponteiro": "ponteiro",
    "oposto": "oposto",
    "líbero": "libero",
    "libero": "libero",
    "ds spiker": "ds_spiker",
    "ds tsk": "ds_tsk",
    "setter": "setter",
}


def normalize_role(raw_role: str) -> str:
    key = raw_role.strip().lower()
    normalized = ROLE_NORMALIZE.get(key)
    if not normalized:
        raise HTTPException(status_code=400, detail=f"Papel desconhecido: '{raw_role}'.")
    return normalized


def get_or_create_player(db: Session, discord_id: str, fallback_name: str, team_id: str) -> Player:
    """Busca o jogador pelo discord_id (identidade real). Se ele ainda não
    existe no banco (ex: o bot nunca sincronizou essa pessoa), cria na hora
    usando o nome que foi digitado no card como apelido provisório."""
    player = db.query(Player).filter(Player.discord_id == discord_id).first()
    if not player:
        player = Player(discord_id=discord_id, nickname=fallback_name, current_team_id=team_id)
        db.add(player)
        db.commit()
        db.refresh(player)
    return player


def save_side_lineups(
    db: Session,
    match_set: MatchSet,
    lineups_in: list[SaveMatchLineupIn],
    team_id: str,
):
    for lineup_in in lineups_in:
        player = get_or_create_player(db, lineup_in.discord_id, lineup_in.player_name, team_id)

        lineup = SetLineup(
            match_set_id=match_set.id,
            role=normalize_role(lineup_in.role),
            player_id=player.id,
            team_id=team_id,
            is_substitute=lineup_in.is_substitute,
        )
        db.add(lineup)
        db.commit()
        db.refresh(lineup)

        stats = SetStats(
            set_lineup_id=lineup.id,
            pontos_feitos=lineup_in.stats.pontos_feitos,
            pontos_tomados=lineup_in.stats.pontos_tomados,
            block=lineup_in.stats.block,
            assistencias=lineup_in.stats.assistencias,
            erro_ofensivo=lineup_in.stats.erro_ofensivo,
            erro_defensivo=lineup_in.stats.erro_defensivo,
        )
        db.add(stats)
    db.commit()


@router.post("/save-full")
def save_full_match(payload: SaveMatchIn, db: Session = Depends(get_db)):
    # 1) Resolve os dois times pelo ID de cargo do Discord.
    home_team = db.query(Team).filter(Team.discord_role_id == payload.team_home_role_id).first()
    if not home_team:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Nenhum time encontrado com o cargo '{payload.team_home_role_id}'. "
                "Rode /vincular-time no bot do Discord pra esse cargo primeiro."
            ),
        )

    away_team = db.query(Team).filter(Team.discord_role_id == payload.team_away_role_id).first()
    if not away_team:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Nenhum time encontrado com o cargo '{payload.team_away_role_id}'. "
                "Rode /vincular-time no bot do Discord pra esse cargo primeiro."
            ),
        )

    # 2) Cria a partida
    match = Match(
        team_home_id=home_team.id,
        team_away_id=away_team.id,
        format=payload.format,
        stat_mode="basic",
        status="finished",
        finished_at=datetime.now(timezone.utc),
    )
    db.add(match)
    db.commit()
    db.refresh(match)

    # 3) Cria cada set, com os DOIS rosters daquele set
    sets_won_home = 0
    sets_won_away = 0

    for set_in in payload.sets:
        match_set = MatchSet(
            match_id=match.id,
            set_number=set_in.set_number,
            score_home=set_in.score_home,
            score_away=set_in.score_away,
        )
        db.add(match_set)
        db.commit()
        db.refresh(match_set)

        if set_in.score_home > set_in.score_away:
            sets_won_home += 1
        elif set_in.score_away > set_in.score_home:
            sets_won_away += 1

        save_side_lineups(db, match_set, set_in.home_lineups, home_team.id)
        save_side_lineups(db, match_set, set_in.away_lineups, away_team.id)

    # 4) Decide o vencedor comparando sets ganhos
    if sets_won_home > sets_won_away:
        match.winner_team_id = home_team.id
    elif sets_won_away > sets_won_home:
        match.winner_team_id = away_team.id
    db.commit()

    return {
        "match_id": match.id,
        "status": match.status,
        "winner_team_id": match.winner_team_id,
        "sets_home": sets_won_home,
        "sets_away": sets_won_away,
    }