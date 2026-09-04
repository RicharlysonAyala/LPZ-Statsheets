import os
import sys

# 1) Carrega o .env ANTES de qualquer import do app/database
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# 2) Só agora importa o backend (aí DATABASE_URL do .env já está no ambiente)
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from app.core.database import SessionLocal, Base, engine, DATABASE_URL  # noqa: E402
from app.models.models import Team, Player  # noqa: E402
from app.core.migrate import run_migrations  # noqa: E402

import discord
from discord import app_commands
from discord.ext import commands
from sqlalchemy.orm import Session

DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
GUILD_ID = int(os.getenv("DISCORD_GUILD_ID", "0"))

intents = discord.Intents.default()
intents.members = True

bot = commands.Bot(command_prefix="!", intents=intents)


def get_db() -> Session:
    return SessionLocal()


def upsert_player_from_member(db: Session, member: discord.Member, team: Team | None):
    """Cria ou atualiza o jogador. Identidade = discord_id."""
    player = db.query(Player).filter(Player.discord_id == str(member.id)).first()

    if not player:
        player = Player(
            discord_id=str(member.id),
            nickname=member.display_name,
            discord_avatar_url=str(member.display_avatar.url),
            current_team_id=team.id if team else None,
        )
        db.add(player)
    else:
        player.nickname = member.display_name
        player.discord_avatar_url = str(member.display_avatar.url)
        player.current_team_id = team.id if team else None

    db.commit()
    return player


@bot.event
async def on_ready():
    Base.metadata.create_all(bind=engine)
    try:
        run_migrations()
    except Exception as e:
        print(f"[migrate] aviso: {e}")

    await bot.tree.sync(guild=discord.Object(id=GUILD_ID))
    scheme = DATABASE_URL.split("://", 1)[0]
    # Não imprime senha — só o tipo de banco
    print(f"Bot conectado como {bot.user}.")
    print(f"Banco em uso: scheme={scheme}")
    if scheme == "sqlite":
        print("⚠️  ATENÇÃO: bot está no SQLITE local, não no Neon!")
        print("   Coloque DATABASE_URL do Neon no bot/.env e reinicie.")
    else:
        print("✅ Bot apontando para Postgres/Neon (mesmo banco do site).")


@bot.tree.command(
    name="vincular-time",
    description="Vincula um cargo do Discord a um time do site (rodar uma vez por time).",
    guild=discord.Object(id=GUILD_ID),
)
@app_commands.describe(cargo="O cargo que representa o time", nome_time="Nome do time no site")
@app_commands.checks.has_permissions(administrator=True)
async def vincular_time(interaction: discord.Interaction, cargo: discord.Role, nome_time: str):
    db = get_db()
    try:
        team = db.query(Team).filter(Team.discord_role_id == str(cargo.id)).first()
        if not team:
            team = db.query(Team).filter(Team.name == nome_time).first()

        if team:
            team.name = nome_time
            team.discord_role_id = str(cargo.id)
        else:
            team = Team(name=nome_time, discord_role_id=str(cargo.id))
            db.add(team)

        db.commit()
        await interaction.response.send_message(
            f"✅ Cargo **{cargo.name}** (`{cargo.id}`) vinculado ao time **{nome_time}**.\n"
            f"Banco: `{DATABASE_URL.split('://', 1)[0]}`",
            ephemeral=True,
        )
    finally:
        db.close()


@bot.tree.command(
    name="sync-membros",
    description="Sincroniza todos os membros do servidor com os times do site.",
    guild=discord.Object(id=GUILD_ID),
)
@app_commands.checks.has_permissions(administrator=True)
async def sync_membros(interaction: discord.Interaction):
    await interaction.response.defer(ephemeral=True)
    db = get_db()
    atualizados = 0
    try:
        teams = db.query(Team).filter(Team.discord_role_id.isnot(None)).all()
        role_to_team = {int(t.discord_role_id): t for t in teams}

        guild = interaction.guild
        async for member in guild.fetch_members(limit=None):
            if member.bot:
                continue
            member_role_ids = {r.id for r in member.roles}
            matched_team = next(
                (team for role_id, team in role_to_team.items() if role_id in member_role_ids),
                None,
            )
            upsert_player_from_member(db, member, matched_team)
            atualizados += 1

        await interaction.followup.send(
            f"✅ {atualizados} membros sincronizados. Times com cargo: {len(teams)}.",
            ephemeral=True,
        )
    finally:
        db.close()


@bot.tree.command(
    name="listar-times",
    description="Lista os times gravados no banco que o bot está usando agora.",
    guild=discord.Object(id=GUILD_ID),
)
@app_commands.checks.has_permissions(administrator=True)
async def listar_times(interaction: discord.Interaction):
    db = get_db()
    try:
        teams = db.query(Team).all()
        if not teams:
            await interaction.response.send_message(
                f"Nenhum time no banco (`{DATABASE_URL.split('://', 1)[0]}`).",
                ephemeral=True,
            )
            return
        lines = [
            f"• **{t.name}** — role `{t.discord_role_id or '—'}`"
            for t in teams
        ]
        await interaction.response.send_message(
            f"Banco: `{DATABASE_URL.split('://', 1)[0]}`\n" + "\n".join(lines),
            ephemeral=True,
        )
    finally:
        db.close()


@bot.event
async def on_member_update(before: discord.Member, after: discord.Member):
    if before.roles == after.roles:
        return

    db = get_db()
    try:
        teams = db.query(Team).filter(Team.discord_role_id.isnot(None)).all()
        role_to_team = {int(t.discord_role_id): t for t in teams}
        member_role_ids = {r.id for r in after.roles}

        matched_team = next(
            (team for role_id, team in role_to_team.items() if role_id in member_role_ids),
            None,
        )
        upsert_player_from_member(db, after, matched_team)
        print(
            f"[sync automático] {after.display_name} -> "
            f"{matched_team.name if matched_team else 'sem time'}"
        )
    finally:
        db.close()


if __name__ == "__main__":
    if not DISCORD_TOKEN:
        raise SystemExit("Defina DISCORD_TOKEN no .env antes de rodar o bot.")
    bot.run(DISCORD_TOKEN)