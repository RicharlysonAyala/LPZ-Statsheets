import os
import discord
from dotenv import load_dotenv
from discord import app_commands
from discord.ext import commands
from sqlalchemy.orm import Session

# Reaproveita EXATAMENTE os mesmos models do backend (mesma pasta "app").
# Por isso o bot mora dentro de backend/bot: ele importa de ../app
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from app.core.database import SessionLocal, Base, engine  # noqa: E402
from app.models.models import Team, Player  # noqa: E402

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
GUILD_ID = int(os.getenv("DISCORD_GUILD_ID", "0"))  # ID do seu servidor

intents = discord.Intents.default()
intents.members = True  # obrigatório: sem isso o bot não enxerga os cargos de cada um

bot = commands.Bot(command_prefix="!", intents=intents)


def get_db() -> Session:
    return SessionLocal()


def upsert_player_from_member(db: Session, member: discord.Member, team: Team | None):
    """Cria ou atualiza o jogador com base no membro do Discord.
    A chave de identidade é sempre discord_id — nunca o nickname."""
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
    await bot.tree.sync(guild=discord.Object(id=GUILD_ID))
    print(f"Bot conectado como {bot.user}. Slash commands sincronizados.")


# ---------------------------------------------------------------------------
# /vincular-time — roda UMA VEZ por time, pra dizer "esse cargo == esse time"
# ---------------------------------------------------------------------------
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
            f"✅ Cargo **{cargo.name}** vinculado ao time **{nome_time}**.", ephemeral=True
        )
    finally:
        db.close()


# ---------------------------------------------------------------------------
# /sync-membros — varre TODO o servidor e realinha quem está em qual time
# agora (útil pra rodar manualmente depois de mexer em cargos em lote)
# ---------------------------------------------------------------------------
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

        await interaction.followup.send(f"✅ {atualizados} membros sincronizados.", ephemeral=True)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Evento automático: sempre que alguém GANHA ou PERDE um cargo de time,
# atualiza na hora — sem precisar rodar comando nenhum.
# ---------------------------------------------------------------------------
@bot.event
async def on_member_update(before: discord.Member, after: discord.Member):
    if before.roles == after.roles:
        return  # nada de cargo mudou, ignora (evita rodar à toa em qualquer update)

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
        print(f"[sync automático] {after.display_name} -> {matched_team.name if matched_team else 'sem time'}")
    finally:
        db.close()


if __name__ == "__main__":
    if not DISCORD_TOKEN:
        raise SystemExit("Defina DISCORD_TOKEN no .env antes de rodar o bot.")
    bot.run(DISCORD_TOKEN)