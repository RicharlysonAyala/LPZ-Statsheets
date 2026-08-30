const ITEMS = [
  {
    title: 'MISTAKE DEF (GERAL)',
    accent: 'from-danger to-transparent',
    text: 'Erro Defensivo: ponto sofrido por falha de recepção, posicionamento, cobertura ou leitura defensiva.',
  },
  {
    title: 'MISTAKE OF (SPIKERS)',
    accent: 'from-primary to-transparent',
    text: 'Erro Ofensivo: ataque errado, bola fora, finalização mal executada ou jogada ofensiva desperdiçada.',
  },
  {
    title: 'MISTAKE OF (DS/SETTER)',
    accent: 'from-magenta to-transparent',
    text: 'Setter/DS TSK: rating valoriza pontos feitos e reduz punição de pontos tomados/erros para refletir função de suporte.',
  },
];

export default function MistakeInfoBar() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {ITEMS.map((item) => (
        <div key={item.title} className="glass-panel relative overflow-hidden rounded-xl px-4 py-3">
          <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${item.accent}`} />
          <p className="font-tech text-xs font-bold tracking-wide text-white mb-1">{item.title}</p>
          <p className="text-[11px] text-slate-400 leading-snug">{item.text}</p>
        </div>
      ))}
    </div>
  );
}
