# Como usar o LPZ Statssheets

Guia rápido para quem vai **registrar as estatísticas de uma partida** de Volleyball Legends
no site. Não precisa saber nada de programação — é só seguir a ordem abaixo.

---

## 1. Antes de começar

Confirme com as duas equipes:
- Se a partida vai ser **melhor de 3 sets** ou **melhor de 5 sets**.
- Quem vai jogar em cada uma das 6 posições: **Ponteiro, Oposto, Líbero, Ds Spiker, Ds Tsk, Setter**.

> Dica: registre em tempo real, ponto a ponto, durante a partida — fica muito mais fácil
> do que tentar lembrar tudo no final.

---

## 2. A tela principal

No topo do site você sempre vê:

| Elemento | Para que serve |
|---|---|
| **Logo LPZ** | Identifica o site (não precisa clicar em nada aqui) |
| **UPDATE LOG** | Mostra as atualizações/mudanças feitas no sistema |
| **FEEDBACK** | Use para reportar bugs ou sugerir melhorias |
| **Placar (0 X 0)** | Marca o placar de sets da partida (não os pontos dentro do set) |
| **SALVAR PARTIDA** | Guarda os dados que você registrou |
| **RESET SET** | Zera todas as estatísticas do set que está aberto no momento — use com cuidado, essa ação não tem "desfazer" |

Logo abaixo ficam as **abas**: `SET 1`, `SET 2`, `SET 3` (e `SET 4`/`SET 5` se a partida for
melhor de 5), depois `FINAL` e `TIMES`.

---

## 3. Registrando as estatísticas de um set

1. Clique na aba do set que está sendo jogado (ex: `SET 1`).
2. Você verá **6 cards**, um para cada posição. Cada card mostra o **nome do jogador** e os
   campos que fazem sentido para aquela posição:

   | Posição | Campos que aparecem |
   |---|---|
   | Ponteiro / Oposto / Líbero / Ds Spiker | Pontos Feitos, Pontos Tomados, Erro Ofensivo, Erro Defensivo |
   | Ds Tsk | Assistências, Pontos Feitos, Pontos Tomados, Erro Ofensivo, Erro Defensivo |
   | Setter | Assistências, Block, Pontos Feitos, Erro Ofensivo, Erro Defensivo |

3. Toda vez que algo acontecer na partida, clique no **+** do campo correspondente
   (ex: jogador atacou e fez ponto → `+` em "Pontos Feitos"). Clicou errado? Use o **−**
   para corrigir na hora.
4. Embaixo de cada card, o site calcula sozinho, em tempo real:
   - **Rating** — nota geral do jogador naquele set (de 0 a 10).
   - **Eficiência** — % de ações positivas em relação ao total de ações do jogador.
   - **Consistência** — se o jogador está tendo um desempenho parelho (ALTA/MÉDIA/BAIXA).

Você não precisa calcular nada — só ir clicando nos + e − conforme a partida acontece.

---

## 4. Indicadores do set

Acima dos cards ficam 4 caixinhas com o resumo do set atual:

- **ERROS TOTAIS** — soma de todos os erros (ofensivos + defensivos) de todo mundo no set.
- **PONTO FRACO** — aponta automaticamente qual posição está sofrendo mais pontos/erros
  defensivos nesse set.
- **RATING MÉDIO** — média do rating de todos os jogadores que já têm alguma ação registrada.
- **DESEMPENHO** — classificação geral do time no set (RUIM / MÉDIO / BOM / EXCELENTE).

---

## 5. Fazendo uma substituição

Se um jogador saiu e outro entrou no meio da partida:

1. No card da posição, clique no botão **↔ SUB**.
2. Confirme a posição (**ROLE**) e quem está saindo (**SAI**).
3. Digite o nome de quem está **ENTRANDO**.
4. Escolha em quais sets essa troca vale, marcando as caixinhas `SET 1`, `SET 2`, `SET 3`
   (e `4`/`5` se houver) — ou use os atalhos:
   - **SÓ SET ATUAL** — a troca vale só para o set que está aberto agora.
   - **SET ATUAL + PRÓXIMOS** — vale do set atual em diante.
   - **TODOS** — vale para a partida inteira, desde o começo.
5. Clique em **APLICAR SUB**.

O card vai mostrar uma tag pequena tipo `SUB SET 1: Fulano → Ciclano`, indicando a troca.
Você não precisa reescrever nenhuma estatística manualmente.

---

## 6. Entendendo as caixinhas de "Mistake"

No final de cada aba de set (e na aba FINAL) aparecem 3 avisos fixos, que só explicam os
critérios usados pelo site — não exigem nenhuma ação sua:

- **MISTAKE DEF (GERAL)** — o que conta como erro defensivo (falha de recepção,
  posicionamento, cobertura ou leitura defensiva).
- **MISTAKE OF (SPIKERS)** — o que conta como erro ofensivo (ataque errado, bola fora,
  finalização mal executada).
- **MISTAKE OF (DS/SETTER)** — explica por que o rating do Setter e do Ds Tsk pune menos
  os pontos tomados/erros: essas posições têm função de suporte, então o cálculo valoriza
  mais as assistências e pontos feitos.

---

## 7. Aba FINAL

Depois que a partida (ou pelo menos um set) já tiver estatísticas registradas, abra a aba
**FINAL** para ver:

- Uma **tabela única** com todo mundo que jogou, somando os números de todos os sets.
- A tag **MVP** no jogador com o maior rating da partida.
- A tag **WORST** no jogador com o menor rating.
- A tag **SUB** em quem entrou como substituto durante a partida.
- Os mesmos indicadores gerais (Erros Totais, Ponto Fraco, Rating Médio, Desempenho),
  agora considerando a partida toda.

---

## 8. Aba TIMES

Por enquanto essa aba só mostra um aviso de "em breve" — é reservada para uma futura
função de histórico de jogos e desempenho por time.

---

## 9. Salvando e encerrando

- Clique em **SALVAR PARTIDA** sempre que quiser garantir que os dados não se percam.
- Use **RESET SET** apenas se quiser recomeçar o set do zero — ele apaga tudo que foi
  registrado naquele set específico, sem confirmação, então use com cuidado.

---

## Dicas rápidas

- Registre os pontos **na hora que acontecem** — é mais fácil e mais preciso do que tentar
  lembrar tudo depois.
- Se errar um clique, corrija imediatamente com o **−** — não deixe pra depois.
- Use o botão **FEEDBACK** sempre que achar que algum cálculo ou tela pode melhorar.
