from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.staff import require_staff
from app.models.models import Team, Player, Match, MatchSet, SetLineup, SetStats
from app.schemas.schemas import TeamStaffUpdate
from app.services.scoring import calculate_rating, StatLine

router = APIRouter(prefix="/teams", tags=["team-pages"])


def _team_card(db: Session, team: Team) -> dict:
    players = db.query(Player).filter(Player.current_team_id == team.id).all()
    captain = None
    if team.captain_player_id:
        captain = db.query(Player).filter(Player.id == team.captain_player_id).first()
    return {
        "id": team.id,
        "name": team.name,
        "logo_url": team.logo_url,
        "primary_color": team.primary_color or "#38bdf8",
        "discord_role_id": team.discord_role_id,
        "division": team.division,
        "player_count": len(players),
        "captain": (
            {
                "id": captain.id,
                "nickname": captain.nickname,
                "discord_avatar_url": captain.discord_avatar_url,
            }
            if captain
            else None
        ),
    }


@router.get("")
def list_teams_rich(db: Session = Depends(get_db)):
    """Grid da aba TIMES."""
    teams = db.query(Team).order_by(Team.name.asc()).all()
    return [_team_card(db, t) for t in teams]


@router.get("/{team_id}")
def get_team(team_id: str, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Time não encontrado.")
    return _team_card(db, team)


@router.patch("/{team_id}")
def staff_update_team(
    team_id: str,
    payload: TeamStaffUpdate,
    db: Session = Depends(get_db),
    _: bool = Depends(require_staff),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Time não encontrado.")

    if payload.logo_url is not None:
        team.logo_url = payload.logo_url.strip() or None
    if payload.primary_color is not None:
        team.primary_color = payload.primary_color.strip() or "#38bdf8"
    if payload.division is not None:
        team.division = payload.division.strip() or None
    if payload.captain_player_id is not None:
        team.captain_player_id = payload.captain_player_id.strip() or None

    db.commit()
    db.refresh(team)
    return _team_card(db, team)


@router.get("/{team_id}/roster")
def get_roster(team_id: str, db: Session = Depends(get_db)):
    players = db.query(Player).filter(Player.current_team_id == team_id).all()
    return [
        {
            "id": p.id,
            "nickname": p.nickname,
            "discord_id": p.discord_id,
            "discord_avatar_url": p.discord_avatar_url,
        }
        for p in players
    ]


@router.get("/{team_id}/matches")
def get_team_matches(team_id: str, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Time não encontrado.")

    matches = (
        db.query(Match)
        .filter((Match.team_home_id == team_id) | (Match.team_away_id == team_id))
        .order_by(Match.created_at.desc())
        .all()
    )

    result = []
    for m in matches:
        is_home = m.team_home_id == team_id
        opp_id = m.team_away_id if is_home else m.team_home_id
        opponent = db.query(Team).filter(Team.id == opp_id).first() if opp_id else None

        sets = (
            db.query(MatchSet)
            .filter(MatchSet.match_id == m.id)
            .order_by(MatchSet.set_number.asc())
            .all()
        )
        sets_home = sum(1 for s in sets if (s.score_home or 0) > (s.score_away or 0))
        sets_away = sum(1 for s in sets if (s.score_away or 0) > (s.score_home or 0))

        # placar do ponto de vista DESTE time
        my_sets = sets_home if is_home else sets_away
        opp_sets = sets_away if is_home else sets_home
        won = m.winner_team_id == team_id
        lost = m.winner_team_id is not None and m.winner_team_id != team_id

        sets_str = " / ".join(
            f"{(s.score_home if is_home else s.score_away)}-{(s.score_away if is_home else s.score_home)}"
            for s in sets
        )

        result.append(
            {
                "match_id": m.id,
                "round_label": m.round_label or "—",
                "opponent": {
                    "id": opponent.id if opponent else None,
                    "name": (
                        opponent.name
                        if opponent
                        else (m.opponent_name_override or "Adversário")
                    ),
                    "logo_url": opponent.logo_url if opponent else m.opponent_logo_override,
                    "primary_color": (opponent.primary_color if opponent else "#38bdf8"),
                },
                "result": {
                    "won": won,
                    "lost": lost,
                    "score": f"{my_sets}–{opp_sets}",
                },
                "sets_detail": sets_str,
                "division": team.division or "—",
                "format": m.format,
                "finished_at": m.finished_at.isoformat() if m.finished_at else None,
            }
        )

    return result


@router.get("/matches/{match_id}/statsheet")
def get_match_statsheet(match_id: str, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Partida não encontrada.")

    home = db.query(Team).filter(Team.id == match.team_home_id).first()
    away = db.query(Team).filter(Team.id == match.team_away_id).first()

    match_sets = (
        db.query(MatchSet)
        .filter(MatchSet.match_id == match_id)
        .order_by(MatchSet.set_number.asc())
        .all()
    )

    sets_payload = []
    for match_set in match_sets:
        lineups_payload = []
        for lineup in match_set.lineups:
            player = db.query(Player).filter(Player.id == lineup.player_id).first()
            s = lineup.stats
            stat_line = StatLine(
                pontos_feitos=s.pontos_feitos if s else 0,
                pontos_tomados=s.pontos_tomados if s else 0,
                block=s.block if s else 0,
                assistencias=s.assistencias if s else 0,
                erro_ofensivo=s.erro_ofensivo if s else 0,
                erro_defensivo=s.erro_defensivo if s else 0,
            )
            lineups_payload.append(
                {
                    "role": lineup.role,
                    "team_id": lineup.team_id,
                    "is_substitute": lineup.is_substitute,
                    "player": {
                        "id": player.id if player else None,
                        "nickname": player.nickname if player else "?",
                        "discord_avatar_url": player.discord_avatar_url if player else None,
                    },
                    "stats": {
                        "pontos_feitos": stat_line.pontos_feitos,
                        "pontos_tomados": stat_line.pontos_tomados,
                        "block": stat_line.block,
                        "assistencias": stat_line.assistencias,
                        "erro_ofensivo": stat_line.erro_ofensivo,
                        "erro_defensivo": stat_line.erro_defensivo,
                    },
                    "rating": calculate_rating(stat_line, lineup.role),
                }
            )
        sets_payload.append(
            {
                "set_number": match_set.set_number,
                "score_home": match_set.score_home,
                "score_away": match_set.score_away,
                "lineups": lineups_payload,
            }
        )

    return {
        "match_id": match.id,
        "format": match.format,
        "round_label": match.round_label,
        "team_home": _team_card(db, home) if home else None,
        "team_away": _team_card(db, away) if away else None,
        "winner_team_id": match.winner_team_id,
        "sets": sets_payload,
    }


@router.get("/players/{player_id}/career", tags=["players"])
def get_player_career(player_id: str, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Jogador não encontrado.")

    lineups = db.query(SetLineup).filter(SetLineup.player_id == player_id).all()
    totals = {
        "pontos_feitos": 0,
        "pontos_tomados": 0,
        "block": 0,
        "assistencias": 0,
        "erro_ofensivo": 0,
        "erro_defensivo": 0,
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
        r = calculate_rating(
            StatLine(
                pontos_feitos=s.pontos_feitos,
                pontos_tomados=s.pontos_tomados,
                block=s.block,
                assistencias=s.assistencias,
                erro_ofensivo=s.erro_ofensivo,
                erro_defensivo=s.erro_defensivo,
            ),
            lineup.role,
        )
        if r > 0:
            ratings.append(r)

    return {
        "player": {
            "id": player.id,
            "nickname": player.nickname,
            "discord_avatar_url": player.discord_avatar_url,
        },
        "totals": totals,
        "average_rating": round(sum(ratings) / len(ratings), 1) if ratings else 0.0,
    }