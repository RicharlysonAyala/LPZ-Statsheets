import { Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  label: string;
  value: number;
  onInc: () => void;
  onDec: () => void;
  onSet: (value: number) => void;
}

export default function StatCounter({ label, value, onInc, onDec, onSet }: Props) {
  // Estado local do texto digitado, pra deixar a caixa "editável" enquanto
  // a pessoa digita, sem travar em cada tecla.
  const [text, setText] = useState(String(value));

  // Se o valor mudar por fora (ex: clicou no + / -), sincroniza o texto.
  useEffect(() => {
    setText(String(value));
  }, [value]);

  function commit() {
    const parsed = parseInt(text, 10);
    onSet(Number.isNaN(parsed) ? 0 : parsed);
  }

  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[10px] font-bold tracking-[0.14em] text-muted">{label.toUpperCase()}</p>
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onDec}
          className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20"
          aria-label={`Diminuir ${label}`}
        >
          <Minus size={16} />
        </button>

        {/* Campo agora é um input de verdade: clica, apaga e digita o número.
            min-w-0 é essencial aqui: sem ele, o navegador dá uma largura mínima
            própria pro <input type="number"> e ele "estoura" pra fora do card. */}
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          onFocus={(e) => e.target.select()}
          className="stat-well font-tech h-11 w-full min-w-0 flex-1 rounded-xl text-center text-lg font-bold tabular-nums text-ink outline-none focus:ring-2 focus:ring-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label={label}
        />

        <button
          type="button"
          onClick={onInc}
          className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-success/30 bg-success/10 text-success hover:bg-success/20"
          aria-label={`Aumentar ${label}`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}