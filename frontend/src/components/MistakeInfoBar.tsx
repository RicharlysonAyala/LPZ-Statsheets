const ITEMS = [
  {
    title: 'MISTAKE DEF (GERAL)',
    accent: 'bg-danger',
    text: 'Erro Defensivo: ponto sofrido por falha de recepção, posicionamento, cobertura ou leitura defensiva.',
  },
  {
    title: 'MISTAKE OF (SPIKERS)',
    accent: 'bg-primary',
    text: 'Erro Ofensivo: ataque errado, bola fora, finalização mal executada ou jogada ofensiva desperdiçada.',
  },
  {
    title: 'MISTAKE OF (DS/SETTER)',
    accent: 'bg-magenta',
    text: 'Setter/DS TSK: rating valoriza pontos feitos e reduz punição de pontos tomados/erros para refletir função de suporte.',
  },
];

export default function MistakeInfoBar() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3" data-print-hide="true">
      {ITEMS.map((item) => (
        <div
          key={item.title}
          className="hud-panel relative overflow-hidden rounded-[18px] px-4 py-3.5 pl-5"
        >
          <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${item.accent}`} />
          <p className="font-tech mb-1 text-xs font-bold tracking-wide text-ink">{item.title}</p>
          <p className="text-[11px] leading-relaxed text-muted">{item.text}</p>
        </div>
      ))}
    </div>
  );
}