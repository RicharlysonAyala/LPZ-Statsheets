from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Team, Player, Match, MatchSet, SetLineup, SetStats
from app.schemas.schemas import SaveMatchIn

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


@router.post("/save-full")
def save_full_match(payload: SaveMatchIn, db: Session = Depends(get_db)):
    # 1) Resolve os dois times pelo ID de cargo do Discord.
    #    Se não encontrar, é sinal de que ninguém rodou /vincular-time
    #    pra esse cargo ainda no bot.
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

    # 2) Resolve (ou cria) cada jogador pelo discord_id. A identidade
    #    real é sempre o discord_id, nunca o nome digitado no card.
    name_to_player_id: dict[str, str] = {}
    for player_name, discord_id in payload.player_discord_ids.items():
        player = db.query(Player).filter(Player.discord_id == discord_id).first()
        if not player:
            player = Player(
                discord_id=discord_id,
                nickname=player_name,
                current_team_id=home_team.id,
            )
            db.add(player)
            db.commit()
            db.refresh(player)
        name_to_player_id[player_name] = player.id

    # 3) Cria a partida
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

    # 4) Cria cada set, cada escalação e cada estatística
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

        for lineup_in in set_in.lineups:
            player_id = name_to_player_id.get(lineup_in.player_name)
            if not player_id:
                raise HTTPException(
                    status_code=400,
                    detail=f"Falta o ID de Discord de '{lineup_in.player_name}'.",
                )

            lineup = SetLineup(
                match_set_id=match_set.id,
                role=normalize_role(lineup_in.role),
                player_id=player_id,
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

    # 5) Decide o vencedor comparando sets ganhos
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