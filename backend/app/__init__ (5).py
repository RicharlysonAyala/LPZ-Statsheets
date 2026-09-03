from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Match, MatchSet, SetLineup, SetStats, Player
from app.schemas.schemas import MatchCreate, LineupCreate, StatUpdate, SubstitutionCreate
from app.services.scoring import calculate_rating, calculate_efficiency, StatLine

router = APIRouter(prefix="/matches", tags=["matches"])

ROLES = ["ponteiro", "setter", "oposto", "ds_spiker", "libero", "ds_tsk"]


@router.post("/")
def create_match(payload: MatchCreate, db: Session = Depends(get_db)):
    match = Match(
        team_home_id=payload.team_home_id,
        team_away_id=payload.team_away_id,
        format=payload.format,
        stat_mode=payload.stat_mode,
    )
    db.add(match)
    db.commit()
    db.refresh(match)

    # já cria os sets vazios (1..format)
    for n in range(1, payload.format + 1):
        db.add(MatchSet(match_id=match.id, set_number=n))
    db.commit()

    return match


@router.get("/{match_id}")
def get_match(match_id: str, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Partida não encontrada.")
    return match


@router.post("/{match_id}/sets/{set_number}/lineups")
def add_lineup(match_id: str, set_number: int, payload: LineupCreate, db: Session = Depends(get_db)):
    match_set = (
        db.query(MatchSet)
        .filter(MatchSet.match_id == match_id, MatchSet.set_number == set_number)
        .first()
    )
    if not match_set:
        raise HTTPException(status_code=404, detail="Set não encontrado.")

    lineup = SetLineup(match_set_id=match_set.id, role=payload.role, player_id=payload.player_id)
    db.add(lineup)
    db.commit()
    db.refresh(lineup)

    stats = SetStats(set_lineup_id=lineup.id)
    db.add(stats)
    db.commit()

    return lineup


@router.patch("/lineups/{lineup_id}/stats")
def update_stat(lineup_id: str, payload: StatUpdate, db: Session = Depends(get_db)):
    stats = db.query(SetStats).filter(SetStats.set_lineup_id == lineup_id).first()
    if not stats:
        raise HTTPException(status_code=404, detail="Estatísticas não encontradas.")

    current = getattr(stats, payload.field)
    new_value = max(0, current + payload.delta)
    setattr(stats, payload.field, new_value)
    db.commit()
    db.refresh(stats)

    lineup = db.query(SetLineup).filter(SetLineup.id == lineup_id).first()
    stat_line = StatLine(
        pontos_feitos=stats.pontos_feitos,
        pontos_tomados=stats.pontos_tomados,
        block=stats.block,
        assistencias=stats.assistencias,
        erro_ofensivo=stats.erro_ofensivo,
        erro_defensivo=stats.erro_defensivo,
    )
    rating = calculate_rating(stat_line, lineup.role)
    efficiency = calculate_efficiency(stat_line)

    return {"stats": stats, "rating": rating, "efficiency": efficiency}


@router.post("/{match_id}/substitutions")
def substitute_player(match_id: str, payload: SubstitutionCreate, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Partida não encontrada.")

    # cria (ou reaproveita) o jogador que está entrando
    new_player = Player(nickname=payload.in_player_nickname)
    db.add(new_player)
    db.commit()
    db.refresh(new_player)

    all_sets = (
        db.query(MatchSet)
        .filter(MatchSet.match_id == match_id)
        .order_by(MatchSet.set_number)
        .all()
    )

    if payload.apply_to == "current":
        target_sets = [s for s in all_sets if s.set_number == all_sets[0].set_number]
    elif payload.apply_to == "current_and_next":
        target_sets = all_sets  # simplificado: em produção, filtrar pelo set atual informado no payload
    else:
        target_sets = all_sets

    updated = []
    for match_set in target_sets:
        old_lineup = (
            db.query(SetLineup)
            .filter(
                SetLineup.match_set_id == match_set.id,
                SetLineup.role == payload.role,
                SetLineup.player_id == payload.out_player_id,
            )
            .first()
        )
        if not old_lineup:
            continue

        new_lineup = SetLineup(
            match_set_id=match_set.id,
            role=payload.role,
            player_id=new_player.id,
            is_substitute=True,
            substituted_player_id=payload.out_player_id,
        )
        db.add(new_lineup)
        db.commit()
        db.refresh(new_lineup)
        db.add(SetStats(set_lineup_id=new_lineup.id))
        db.commit()
        updated.append(new_lineup)

    return {"new_player": new_player, "updated_lineups": updated}


@router.get("/{match_id}/summary")
def match_summary(match_id: str, db: Session = Depends(get_db)):
    """Agrega estatísticas de todos os sets por jogador/papel e calcula MVP/WORST."""
    match_sets = db.query(MatchSet).filter(MatchSet.match_id == match_id).all()
    aggregated: dict[str, dict] = {}

    for match_set in match_sets:
        for lineup in match_set.lineups:
            key = f"{lineup.role}_{lineup.player_id}"
            if key not in aggregated:
                aggregated[key] = {
                    "role": lineup.role,
                    "player_id": lineup.player_id,
                    "pontos_feitos": 0, "pontos_tomados": 0, "block": 0,
                    "assistencias": 0, "erro_ofensivo": 0, "erro_defensivo": 0,
                }
            s = lineup.stats
            if s:
                aggregated[key]["pontos_feitos"] += s.pontos_feitos
                aggregated[key]["pontos_tomados"] += s.pontos_tomados
                aggregated[key]["block"] += s.block
                aggregated[key]["assistencias"] += s.assistencias
                aggregated[key]["erro_ofensivo"] += s.erro_ofensivo
                aggregated[key]["erro_defensivo"] += s.erro_defensivo

    rows = []
    for row in aggregated.values():
        stat_line = StatLine(
            pontos_feitos=row["pontos_feitos"], pontos_tomados=row["pontos_tomados"],
            block=row["block"], assistencias=row["assistencias"],
            erro_ofensivo=row["erro_ofensivo"], erro_defensivo=row["erro_defensivo"],
        )
        row["rating"] = calculate_rating(stat_line, row["role"])
        rows.append(row)

    with_data = [r for r in rows if r["rating"] > 0]
    mvp = max(with_data, key=lambda r: r["rating"]) if with_data else None
    worst = min(with_data, key=lambda r: r["rating"]) if with_data else None

    return {"players": rows, "mvp": mvp, "worst": worst}
