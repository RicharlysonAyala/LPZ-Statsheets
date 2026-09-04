"""
Migração leve: adiciona colunas/tabelas que o create_all NÃO cria
quando a tabela já existia com schema antigo.
Roda no startup — seguro rodar várias vezes (IF NOT EXISTS).
"""
from sqlalchemy import text
from app.core.database import engine


# Cada item: (tabela, coluna, definição SQL do tipo)
COLUMNS_TO_ENSURE = [
    # teams
    ("teams", "logo_url", "VARCHAR"),
    ("teams", "primary_color", "VARCHAR(7) DEFAULT '#38bdf8'"),
    ("teams", "discord_role_id", "VARCHAR(32)"),
    ("teams", "created_at", "TIMESTAMPTZ DEFAULT NOW()"),
    # players
    ("players", "discord_id", "VARCHAR(32)"),
    ("players", "discord_avatar_url", "VARCHAR"),
    ("players", "team_id", "VARCHAR"),
    ("players", "current_team_id", "VARCHAR"),
    ("players", "created_at", "TIMESTAMPTZ DEFAULT NOW()"),
    # matches
    ("matches", "team_home_id", "VARCHAR"),
    ("matches", "team_away_id", "VARCHAR"),
    ("matches", "opponent_name_override", "VARCHAR(80)"),
    ("matches", "opponent_logo_override", "VARCHAR"),
    ("matches", "round_label", "VARCHAR(20)"),
    ("matches", "scheduled_at", "TIMESTAMPTZ"),
    ("matches", "won_by_forfeit", "BOOLEAN DEFAULT FALSE"),
    ("matches", "winner_team_id", "VARCHAR"),
    ("matches", "points_delta", "VARCHAR(10)"),
    ("matches", "format", "SMALLINT DEFAULT 3"),
    ("matches", "stat_mode", "VARCHAR(10) DEFAULT 'basic'"),
    ("matches", "status", "VARCHAR(15) DEFAULT 'in_progress'"),
    ("matches", "created_at", "TIMESTAMPTZ DEFAULT NOW()"),
    ("matches", "finished_at", "TIMESTAMPTZ"),
    # match_sets
    ("match_sets", "match_id", "VARCHAR"),
    ("match_sets", "set_number", "SMALLINT"),
    ("match_sets", "score_home", "SMALLINT DEFAULT 0"),
    ("match_sets", "score_away", "SMALLINT DEFAULT 0"),
    # set_lineups
    ("set_lineups", "match_set_id", "VARCHAR"),
    ("set_lineups", "role", "VARCHAR(20)"),
    ("set_lineups", "player_id", "VARCHAR"),
    ("set_lineups", "team_id", "VARCHAR"),
    ("set_lineups", "is_substitute", "BOOLEAN DEFAULT FALSE"),
    ("set_lineups", "substituted_player_id", "VARCHAR"),
    # set_stats
    ("set_stats", "set_lineup_id", "VARCHAR"),
    ("set_stats", "pontos_feitos", "SMALLINT DEFAULT 0"),
    ("set_stats", "pontos_tomados", "SMALLINT DEFAULT 0"),
    ("set_stats", "block", "SMALLINT DEFAULT 0"),
    ("set_stats", "assistencias", "SMALLINT DEFAULT 0"),
    ("set_stats", "erro_ofensivo", "SMALLINT DEFAULT 0"),
    ("set_stats", "erro_defensivo", "SMALLINT DEFAULT 0"),
    ("set_stats", "sets_recebidos", "SMALLINT DEFAULT 0"),
    ("set_stats", "recepcoes", "SMALLINT DEFAULT 0"),
    # player_team_history
    ("player_team_history", "player_id", "VARCHAR"),
    ("player_team_history", "team_id", "VARCHAR"),
    ("player_team_history", "joined_at", "TIMESTAMPTZ DEFAULT NOW()"),
    ("player_team_history", "left_at", "TIMESTAMPTZ"),
]


def _column_exists(conn, table: str, column: str) -> bool:
    row = conn.execute(
        text(
            """
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = :table
              AND column_name = :column
            """
        ),
        {"table": table, "column": column},
    ).first()
    return row is not None


def _table_exists(conn, table: str) -> bool:
    row = conn.execute(
        text(
            """
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = :table
            """
        ),
        {"table": table},
    ).first()
    return row is not None


def run_migrations() -> None:
    """Idempotente: pode rodar em todo startup."""
    # SQLite local não precisa disso (create_all já basta no dev)
    if engine.url.get_backend_name() == "sqlite":
        print("migrate: sqlite — pulando ALTER TABLE")
        return

    with engine.begin() as conn:
        added = 0
        for table, column, col_type in COLUMNS_TO_ENSURE:
            if not _table_exists(conn, table):
                # create_all cuida de criar a tabela do zero
                continue
            if _column_exists(conn, table, column):
                continue
            sql = f'ALTER TABLE "{table}" ADD COLUMN "{column}" {col_type}'
            print(f"migrate: {sql}")
            conn.execute(text(sql))
            added += 1

        # índices únicos úteis (ignora se já existirem)
        for idx_sql in [
            'CREATE UNIQUE INDEX IF NOT EXISTS ix_teams_discord_role_id ON teams (discord_role_id)',
            'CREATE UNIQUE INDEX IF NOT EXISTS ix_players_discord_id ON players (discord_id)',
        ]:
            try:
                conn.execute(text(idx_sql))
            except Exception as e:
                print(f"migrate: índice avisou: {e}")

        print(f"migrate: ok — {added} coluna(s) adicionada(s)")