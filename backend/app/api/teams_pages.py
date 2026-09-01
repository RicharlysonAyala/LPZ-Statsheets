from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Team, Player, Match, MatchSet, SetLineup, SetStats
from app.services.scoring import calculate_rating, StatLine

router = APIRouter(prefix="/teams", tags=["team-pages"])


# ---------------------------------------------------------------------------
# GET /teams/{team_id}  ->  cabeçalho do time (logo, nome, cor)
# ---------------------------------------------------------------------------
@router.get("/{team_id}")
def get_team(team_id: str, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Time não encontrado.")
    return team


# ---------------------------------------------------------------------------
# GET /teams/{team_id}/roster  ->  aba JOGADORES (grade de cards)
# Só traz quem tem current_team_id == esse time, ou seja, o elenco DE AGORA.
# ---------------------------------------------------------------------------
@router.get("/{team_id}/roster")
def get_roster(team_id: str, db: Session = Depends(get_db)):
    players = db.query(Player).filter(Player.current_team_id == team_id).all()
    return [
        {
            "id": p.id,
            "nickname": p.nickname,
            "discord_avatar_url": p.discord_avatar_url,
            # tag exibida no card (ex: CAPTAIN, SET, LIB, MID, OUT) — hoje
            # é preenchida manualmente pelo admin no painel; ver Fase 4.
        }
        for p in players
    ]


# ---------------------------------------------------------------------------
# GET /teams/{team_id}/matches  ->  aba MATCH HISTORY (a tabela da sua foto)
# ---------------------------------------------------------------------------
@router.get("/{team_id}/matches")
def get_team_matches(team_id: str, db: Session = Depends(get_db)):
    matches = (
        db.query(Match)
        .filter((Match.team_home_id == team_id) | (Match.team_away_id == team_id))
        .order_by(Match.created_at.desc())
        .all()
    )

    result = []
    for m in matches:
        is_home = m.team_home_id == team_id
        opponent_team = None
        if is_home and m.team_away_id:
            opponent_team = db.query(Team).filter(Team.id == m.team_away_id).first()
        elif not is_home and m.team_home_id:
            opponent_team = db.query(Team).filter(Team.id == m.team_home_id).first()

        sets_score = [(s.score_home, s.score_away) for s in sorted(m.sets, key=lambda s: s.set_number)]
        sets_won_by_team = sum(
            1 for h, a in sets_score if (h > a if is_home else a > h)
        )
        sets_won_by_opponent = sum(
            1 for h, a in sets_score if (h < a if is_home else a < h)
        )

        if m.status == "scheduled":
            result_label = "Scheduled"
        elif m.won_by_forfeit:
            result_label = "W" if m.winner_team_id == team_id else "L"
        else:
            result_label = "W" if m.winner_team_id == team_id else "L"

        result.append({
            "match_id": m.id,
            "round_label": m.round_label,
            "opponent_name": opponent_team.name if opponent_team else m.opponent_name_override,
            "opponent_logo": opponent_team.logo_url if opponent_team else m.opponent_logo_override,
            "status": m.status,
            "scheduled_at": m.scheduled_at,
            "result": result_label if m.status == "finished" else None,
            "sets_summary": f"{sets_won_by_team}-{sets_won_by_opponent}" if m.status == "finished" else None,
            "sets_scores": sets_score if not m.won_by_forfeit else None,
            "won_by_forfeit": m.won_by_forfeit,
            "points_delta": m.points_delta,
        })

    return result


# ---------------------------------------------------------------------------
# GET /matches/{match_id}/statsheet  ->  ao clicar numa linha do histórico
# ---------------------------------------------------------------------------
@router.get("/matches/{match_id}/statsheet", tags=["matches"])
def get_match_statsheet(match_id: str, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Partida não encontrada.")

    sets_payload = []
    for match_set in sorted(match.sets, key=lambda s: s.set_number):
        lineups_payload = []
        for lineup in match_set.lineups:
            player = db.query(Player).filter(Player.id == lineup.player_id).first()
            stats = lineup.stats
            stat_line = StatLine(
                pontos_feitos=stats.pontos_feitos if stats else 0,
                pontos_tomados=stats.pontos_tomados if stats else 0,
                block=stats.block if stats else 0,
                assistencias=stats.assistencias if stats else 0,
                erro_ofensivo=stats.erro_ofensivo if stats else 0,
                erro_defensivo=stats.erro_defensivo if stats else 0,
            )
            lineups_payload.append({
                "role": lineup.role,
                "player_nickname": player.nickname if player else "?",
                "is_substitute": lineup.is_substitute,
                "stats": {
                    "pontos_feitos": stat_line.pontos_feitos,
                    "pontos_tomados": stat_line.pontos_tomados,
                    "block": stat_line.block,
                    "assistencias": stat_line.assistencias,
                    "erro_ofensivo": stat_line.erro_ofensivo,
                    "erro_defensivo": stat_line.erro_defensivo,
                },
                "rating": calculate_rating(stat_line, lineup.role),
            })
        sets_payload.append({
            "set_number": match_set.set_number,
            "score_home": match_set.score_home,
            "score_away": match_set.score_away,
            "lineups": lineups_payload,
        })

    return {"match_id": match.id, "format": match.format, "sets": sets_payload}


# ---------------------------------------------------------------------------
# GET /teams/players/{player_id}/career  ->  ao clicar num jogador no roster
# Soma TODAS as partidas que ele já jogou, em qualquer time.
# ---------------------------------------------------------------------------
@router.get("/players/{player_id}/career", tags=["players"])
def get_player_career(player_id: str, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Jogador não encontrado.")

    lineups = db.query(SetLineup).filter(SetLineup.player_id == player_id).all()

    totals = {
        "pontos_feitos": 0, "pontos_tomados": 0, "block": 0,
        "assistencias": 0, "erro_ofensivo": 0, "erro_defensivo": 0,
        "sets_jogados": 0,
    }
    ratings = []

    for lineup in lineups:
        s = lineup.stats
        if not s:
            continue
        totals["pontos_feitos"] += s.pontos_feitos
        totals["pontos_tomados"] += s.pontos_tomados
        totals["block"] += s.block
        totals["assistencias"] += s.assistencias
        totals["erro_ofensivo"] += s.erro_ofensivo
        totals["erro_defensivo"] += s.erro_defensivo
        totals["sets_jogados"] += 1

        stat_line = StatLine(
            pontos_feitos=s.pontos_feitos, pontos_tomados=s.pontos_tomados,
            block=s.block, assistencias=s.assistencias,
            erro_ofensivo=s.erro_ofensivo, erro_defensivo=s.erro_defensivo,
        )
        r = calculate_rating(stat_line, lineup.role)
        if r > 0:
            ratings.append(r)

    avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0

    return {
        "player": {"id": player.id, "nickname": player.nickname, "discord_avatar_url": player.discord_avatar_url},
        "totals": totals,
        "average_rating": avg_rating,
    }