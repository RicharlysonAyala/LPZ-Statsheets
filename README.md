# Statssheets — Volleyball Legends

Sistema de estatísticas de partidas (React + FastAPI + PostgreSQL).
Este guia assume que você **nunca fez isso antes** — vá seguindo na ordem.

```
statssheets/
├── frontend/     ← o site (React) — o que o jogador/staff vê e clica
└── backend/      ← a API (Python/FastAPI) — onde os dados são calculados e salvos
```

O front-end já funciona sozinho (com os dados guardados só na memória do navegador),
pra você ver a tela funcionando rapidinho. O backend é o próximo passo, para os dados
ficarem salvos de verdade num banco.

---

## PARTE 1 — O que instalar no computador (uma vez só)

Baixe e instale, nesta ordem:

1. **Node.js** (versão 20 ou mais nova) → https://nodejs.org (baixe a versão "LTS")
   - Isso já instala o `npm` junto, que é o gerenciador de pacotes do JavaScript.
2. **Python** (versão 3.11 ou mais nova) → https://www.python.org/downloads/
   - No instalador do Windows, marque a caixinha **"Add Python to PATH"**.
3. **VS Code** (editor de código) → https://code.visualstudio.com
4. **Git** → https://git-scm.com/downloads

Para confirmar que tudo instalou certo, abra o terminal (no VS Code: menu `Terminal → New Terminal`)
e rode:
```bash
node -v
npm -v
python --version
git --version
```
Se cada comando devolver um número de versão (em vez de erro), está tudo certo.

> Você **não** precisa instalar Tailwind, React, FastAPI etc. manualmente — isso já está
> configurado nos arquivos deste projeto. Você só instala as dependências com um comando
> (`npm install` e `pip install`), mostrado abaixo.

---

## PARTE 2 — Rodando o FRONT-END na sua máquina

```bash
cd statssheets/frontend
npm install
npm run dev
```

O terminal vai mostrar um endereço tipo `http://localhost:5173`. Abra no navegador —
essa é a tela do sistema, já com placar, sets, cards de jogador, substituição e tabela final,
tudo funcionando com clique (o estado fica salvo em memória enquanto a aba estiver aberta).

**Onde mexer em cada coisa** (para não se perder nas pastas):

| Quero mudar...                                   | Arquivo                                          |
|---------------------------------------------------|---------------------------------------------------|
| Cores do site (dark/azul)                          | `frontend/src/index.css` (bloco `@theme`)          |
| Placar e botões do topo                            | `frontend/src/components/Scoreboard.tsx`           |
| Abas (SET 1, SET 2, FINAL...)                      | `frontend/src/components/SetTabs.tsx`              |
| Card de cada jogador (pontos, erros, rating)       | `frontend/src/components/PlayerStatCard.tsx`       |
| Fórmula de rating/eficiência                       | `frontend/src/lib/scoring.ts`                      |
| Modal de substituição                              | `frontend/src/components/SubstitutionModal.tsx`    |
| Tabela final (MVP/WORST)                           | `frontend/src/components/FinalTable.tsx`           |
| Textos dos "Mistake" (avisos de erro)              | `frontend/src/components/MistakeInfoBar.tsx`       |
| Estado da partida (placar, sets, jogadores)        | `frontend/src/store/matchStore.ts`                 |
| Página que junta tudo                              | `frontend/src/pages/MatchPage.tsx`                 |

---

## PARTE 3 — Rodando o BACK-END na sua máquina

O backend guarda os dados num banco. Para começar, ele já vem configurado para usar
**SQLite** (um banco simples, que é só um arquivo — zero configuração). Depois, na hora
de publicar de verdade, trocamos para PostgreSQL gratuito na nuvem (Parte 5).

```bash
cd statssheets/backend

# cria um "ambiente isolado" do Python (evita bagunçar outros projetos)
python -m venv venv

# ativa o ambiente:
# Windows (PowerShell):
venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

# instala as dependências do projeto
pip install -r requirements.txt

# sobe o servidor
uvicorn app.main:app --reload
```

Abra `http://127.0.0.1:8000/docs` — o FastAPI gera automaticamente uma tela onde você
testa cada rota da API (criar time, criar partida, atualizar estatística, etc.) clicando,
sem precisar escrever nenhum código extra pra testar.

**Onde mexer em cada coisa no backend:**

| Quero mudar...                                | Arquivo                                     |
|-------------------------------------------------|-----------------------------------------------|
| Tabelas do banco de dados                        | `backend/app/models/models.py`                |
| Formato dos dados que entram/saem da API         | `backend/app/schemas/schemas.py`              |
| Fórmula de rating/eficiência                     | `backend/app/services/scoring.py`             |
| Rotas de times/jogadores                         | `backend/app/api/teams_players.py`            |
| Rotas de partidas/estatísticas/substituição      | `backend/app/api/matches.py`                  |
| Configuração do banco (SQLite/Postgres)          | `backend/app/core/database.py`                |
| Arquivo principal (liga tudo)                    | `backend/app/main.py`                         |

> Hoje o front-end e o back-end ainda não estão "conversando" (o front usa dados locais
> para você já ver funcionando). Ligar os dois é trocar as chamadas do `matchStore.ts`
> por chamadas `fetch`/`axios` para `http://127.0.0.1:8000`. Se quiser, me chame de novo
> que eu faço essa ligação com você — é um passo à parte, mais avançado.

---

## PARTE 4 — Subindo pro GitHub (necessário para o deploy gratuito)

1. Crie uma conta em https://github.com (se ainda não tiver).
2. Crie um repositório novo (botão verde "New").
3. No terminal, dentro da pasta `statssheets`:
```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

---

## PARTE 5 — Deploy 100% gratuito

Ideia: **front-end na Vercel**, **backend no Render**, **banco no Neon**. Os três têm
plano gratuito o suficiente para um projeto como esse.

### 5.1 Banco de dados gratuito (Neon)
1. Crie conta em https://neon.tech (tem plano free).
2. Crie um projeto novo → ele te dá uma **connection string** parecida com:
   `postgresql://usuario:senha@ep-xxxxx.neon.tech/neondb?sslmode=require`
3. Guarde essa string, você vai usar no próximo passo.

*(Alternativa igualmente boa e gratuita: https://supabase.com)*

### 5.2 Backend gratuito (Render)
1. Crie conta em https://render.com e conecte com seu GitHub.
2. Clique em **New → Web Service** e escolha o repositório.
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Em **Environment Variables**, adicione:
   - `DATABASE_URL` = (cole a connection string do Neon que você guardou)
5. Clique em **Create Web Service**. Em alguns minutos você recebe uma URL tipo
   `https://statssheets-backend.onrender.com`.

> No plano gratuito do Render, o serviço "dorme" depois de um tempo sem uso e demora
> uns 30-60s para acordar na primeira visita do dia — normal, não é erro.

### 5.3 Front-end gratuito (Vercel)
1. Crie conta em https://vercel.com e conecte com seu GitHub.
2. Clique em **Add New → Project** e escolha o repositório.
3. Configure:
   - **Root Directory:** `frontend`
   - Framework preset: **Vite** (ele detecta sozinho)
4. Se/quando o front já estiver falando com o backend, adicione a variável de ambiente
   `VITE_API_URL` apontando pra URL do Render (ex: `https://statssheets-backend.onrender.com`).
5. Clique em **Deploy**. Você recebe uma URL tipo `https://statssheets.vercel.app` —
   esse é o link que você compartilha com o pessoal.

---

## PARTE 6 — Checklist rápido do dia a dia

- Mudou algo no código? Salve o arquivo → se estiver com `npm run dev`/`uvicorn --reload`
  rodando, a tela atualiza sozinha.
- Terminou uma parte e quer publicar a atualização?
  ```bash
  git add .
  git commit -m "descreva o que mudou"
  git push
  ```
  A Vercel e o Render **atualizam sozinhos** o site publicado sempre que você faz `push`
  no GitHub — não precisa repetir a configuração.

---

## Dúvidas comuns

- **"Port already in use"**: já tem outro `npm run dev` ou `uvicorn` rodando em outro
  terminal. Feche o outro terminal ou troque a porta.
- **Tailwind não aplicou as cores**: confirme que está editando `frontend/src/index.css`
  e que salvou o arquivo — o Vite recarrega sozinho.
- **Erro de CORS no navegador** (quando ligar front + back): confira se a URL do seu
  front-end publicado está na lista `allow_origins` em `backend/app/main.py`.
