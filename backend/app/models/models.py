import uuid
from sqlalchemy import Column, String, SmallInteger, ForeignKey, DateTime, Boolean, func
from sqlalchemy.orm import relationship
from app.core.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Team(Base):
    __tablename__ = "teams"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(80), nullable=False, unique=True)
    logo_url = Column(String, nullable=True)
    primary_color = Column(String(7), nullable=False, default="#38bdf8")
    discord_role_id = Column(String(32), unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Player(Base):
    __tablename__ = "players"
    id = Column(String, primary_key=True, default=gen_uuid)
    nickname = Column(String(60), nullable=False)
    discord_id = Column(String(32), unique=True, nullable=True)
    discord_avatar_url = Column(String, nullable=True)
    # time_id "antigo" mantido por compatibilidade; current_team_id é a
    # fonte da verdade sobre onde o jogador está jogando AGORA.
    team_id = Column(String, ForeignKey("teams.id"), nullable=True)
    current_team_id = Column(String, ForeignKey("teams.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PlayerTeamHistory(Base):
    __tablename__ = "player_team_history"
    id = Column(String, primary_key=True, default=gen_uuid)
    player_id = Column(String, ForeignKey("players.id"), nullable=False)
    team_id = Column(String, ForeignKey("teams.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    left_at = Column(DateTime(timezone=True), nullable=True)


class Match(Base):
    __tablename__ = "matches"
    id = Column(String, primary_key=True, default=gen_uuid)
    team_home_id = Column(String, ForeignKey("teams.id"), nullable=True)
    team_away_id = Column(String, ForeignKey("teams.id"), nullable=True)
    # Se o adversário NÃO é um time cadastrado no site (ex: time de fora
    # da liga), usa esses dois campos em vez de team_away_id.
    opponent_name_override = Column(String(80), nullable=True)
    opponent_logo_override = Column(String, nullable=True)

    round_label = Column(String(20), nullable=True)  # ex: "Week 8", "QF4"
    scheduled_at = Column(DateTime(timezone=True), nullable=True)  # para partidas "Scheduled"
    won_by_forfeit = Column(Boolean, default=False)
    winner_team_id = Column(String, ForeignKey("teams.id"), nullable=True)
    points_delta = Column(String(10), nullable=True)  # ex: "+3.5" (coluna PTS da imagem)

    format = Column(SmallInteger, nullable=False, default=3)  # 3 ou 5
    stat_mode = Column(String(10), nullable=False, default="basic")  # basic | advanced
    status = Column(String(15), nullable=False, default="in_progress")  # in_progress | finished | scheduled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)

    sets = relationship("MatchSet", back_populates="match", cascade="all, delete-orphan")


class MatchSet(Base):
    __tablename__ = "match_sets"
    id = Column(String, primary_key=True, default=gen_uuid)
    match_id = Column(String, ForeignKey("matches.id"), nullable=False)
    set_number = Column(SmallInteger, nullable=False)
    score_home = Column(SmallInteger, default=0)
    score_away = Column(SmallInteger, default=0)

    match = relationship("Match", back_populates="sets")
    lineups = relationship("SetLineup", back_populates="match_set", cascade="all, delete-orphan")


class SetLineup(Base):
    __tablename__ = "set_lineups"
    id = Column(String, primary_key=True, default=gen_uuid)
    match_set_id = Column(String, ForeignKey("match_sets.id"), nullable=False)
    role = Column(String(20), nullable=False)  # ponteiro, oposto, libero, ds_spiker, ds_tsk, setter
    player_id = Column(String, ForeignKey("players.id"), nullable=False)
    is_substitute = Column(Boolean, default=False)
    substituted_player_id = Column(String, ForeignKey("players.id"), nullable=True)

    match_set = relationship("MatchSet", back_populates="lineups")
    stats = relationship("SetStats", back_populates="lineup", uselist=False, cascade="all, delete-orphan")


class SetStats(Base):
    __tablename__ = "set_stats"
    id = Column(String, primary_key=True, default=gen_uuid)
    set_lineup_id = Column(String, ForeignKey("set_lineups.id"), nullable=False, unique=True)
    pontos_feitos = Column(SmallInteger, default=0)
    pontos_tomados = Column(SmallInteger, default=0)
    block = Column(SmallInteger, default=0)
    assistencias = Column(SmallInteger, default=0)
    erro_ofensivo = Column(SmallInteger, default=0)
    erro_defensivo = Column(SmallInteger, default=0)
    sets_recebidos = Column(SmallInteger, default=0)  # modo avançado
    recepcoes = Column(SmallInteger, default=0)  # modo avançado

    lineup = relationship("SetLineup", back_populates="stats")