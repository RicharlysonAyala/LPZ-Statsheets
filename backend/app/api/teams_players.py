from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Team, Player
from app.schemas.schemas import TeamCreate, PlayerCreate

router = APIRouter(tags=["teams-players"])


@router.post("/teams")
def create_team(payload: TeamCreate, db: Session = Depends(get_db)):
    existing = db.query(Team).filter(Team.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Já existe um time com esse nome.")
    team = Team(name=payload.name)
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


@router.get("/teams")
def list_teams(db: Session = Depends(get_db)):
    return db.query(Team).all()


@router.post("/players")
def create_player(payload: PlayerCreate, db: Session = Depends(get_db)):
    player = Player(nickname=payload.nickname, team_id=payload.team_id)
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


@router.get("/players")
def list_players(db: Session = Depends(get_db)):
    return db.query(Player).all()
