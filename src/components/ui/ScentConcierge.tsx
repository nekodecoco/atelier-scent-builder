import { useRef, useState, type FormEvent } from 'react';
import { ChevronDown, Send, Sparkles } from 'lucide-react';
import { getCustomIngredients, getIngredient, INGREDIENTS, NOTE_KEYS, type NoteKey } from '../../data/ingredients';
import { formatPeso, priceFor } from '../../lib/pricing';
import { concentrationTier } from '../../lib/recipe';
import { useCatalogStore } from '../../store/useCatalogStore';
import { useScentStore } from '../../store/useScentStore';

interface Suggestion {
  selected: Record<NoteKey, string>;
  percentages: Record<NoteKey, number>;
  concentration: number;
  name: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  suggestion?: Suggestion;
}

type Status = 'idle' | 'thinking' | 'resting';

export function ScentConcierge() {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);

  const bottleSize = useScentStore((s) => s.bottleSize);
  useCatalogStore((s) => s.pricing);

  const availableIngredients = () => {
    const { availability } = useCatalogStore.getState();
    const forNote = (note: NoteKey) =>
      [...INGREDIENTS[note], ...getCustomIngredients(note)]
        .filter((i) => availability[i.id] !== false)
        .map((i) => ({ id: i.id, name: i.name, description: i.description }));
    return { top: forNote('top'), heart: forNote('heart'), base: forNote('base') };
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || status === 'thinking') return;

    const history = [...messages, { role: 'user' as const, text }];
    setMessages(history);
    setInput('');
    setStatus('thinking');
    setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 50);

    try {
      const response = await fetch('/api/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(({ role, text: t }) => ({ role, text: t })),
          ingredients: availableIngredients(),
        }),
      });

      if (response.status === 503 || response.status === 404) {
        setStatus('resting');
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as { reply: string; suggestion?: Suggestion };
      setMessages((m) => [...m, { role: 'assistant', text: data.reply, suggestion: data.suggestion }]);
      setStatus('idle');
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'Forgive me — my nose needs a moment. Try that once more?' },
      ]);
      setStatus('idle');
    } finally {
      setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 80);
    }
  };

  const apply = (suggestion: Suggestion) => {
    const { loadFormula, setConcentration } = useScentStore.getState();
    loadFormula(
      { selected: { ...suggestion.selected }, percentages: { ...suggestion.percentages } },
      suggestion.name,
    );
    setConcentration(suggestion.concentration);
  };

  return (
    <div className="rounded-lg border border-gold-deep/40 bg-white/60 dark:border-gold/30 dark:bg-night-soft">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <span className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-luxe text-gold-deep dark:text-gold">
          <Sparkles size={13} aria-hidden />
          Scent concierge
        </span>
        <span className="flex items-center gap-3">
          <span className="hidden font-display text-sm italic text-stone sm:inline">
            Describe a feeling. We'll compose it.
          </span>
          <ChevronDown
            size={14}
            aria-hidden
            className={`text-stone-dim transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {open && (
        <div className="border-t border-ivory-line/70 px-5 pb-5 dark:border-night-line">
          {status === 'resting' ? (
            <p className="py-4 font-sans text-xs leading-relaxed text-stone-dim">
              The concierge is resting at the moment — compose freely with the sliders below, or
              try the Surprise me button.
            </p>
          ) : (
            <>
              <div ref={scrollRef} className="max-h-64 overflow-y-auto py-3">
                {messages.length === 0 && (
                  <p className="font-sans text-xs leading-relaxed text-stone-dim">
                    Try: <em>"something that smells like rain on a cool Baguio morning, but elegant
                    enough for a dinner date"</em>
                  </p>
                )}
                {messages.map((message, i) => (
                  <div key={i} className={`mt-2.5 flex ${message.role === 'user' ? 'justify-end' : ''}`}>
                    <div className={message.role === 'user' ? 'max-w-[85%]' : 'w-full'}>
                      <div
                        className={`rounded-lg px-3.5 py-2.5 font-sans text-xs leading-relaxed ${
                          message.role === 'user'
                            ? 'bg-ivory-soft text-neutral-800 dark:bg-night-line dark:text-cream'
                            : 'border border-ivory-line/70 text-stone dark:border-night-line'
                        }`}
                      >
                        {message.text}
                      </div>

                      {message.suggestion && (
                        <div className="mt-2 rounded-lg border border-gold-deep/40 p-3 dark:border-gold/40">
                          <div className="flex flex-wrap gap-1.5">
                            {NOTE_KEYS.map((note) => {
                              const ingredient = getIngredient(note, message.suggestion!.selected[note]);
                              return (
                                <span
                                  key={note}
                                  className="rounded-full px-2.5 py-1 font-sans text-[10px] font-medium text-night"
                                  style={{ backgroundColor: ingredient.color }}
                                >
                                  {ingredient.name} {message.suggestion!.percentages[note]}%
                                </span>
                              );
                            })}
                            <span className="rounded-full border border-ivory-line px-2.5 py-1 font-sans text-[10px] text-stone dark:border-night-line">
                              {message.suggestion.concentration}% oil ·{' '}
                              {concentrationTier(message.suggestion.concentration)}
                            </span>
                          </div>
                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            <span className="font-display text-sm italic text-neutral-900 dark:text-cream">
                              "{message.suggestion.name}" ·{' '}
                              {formatPeso(priceFor(bottleSize, message.suggestion.concentration))}
                            </span>
                            <button
                              type="button"
                              onClick={() => apply(message.suggestion!)}
                              className="rounded bg-gold-deep px-3 py-1.5 font-sans text-[9px] tracking-luxe text-ivory transition-opacity hover:opacity-90 dark:bg-gold dark:text-night"
                            >
                              APPLY TO BUILDER →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {status === 'thinking' && (
                  <div className="mt-2.5 flex items-center gap-1.5 px-1 py-2" aria-label="Concierge is thinking">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-deep dark:bg-gold"
                        style={{ animationDelay: `${i * 200}ms` }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={send} className="mt-1 flex gap-2">
                <input
                  value={input}
                  maxLength={300}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tell me a feeling, a memory, an occasion…"
                  aria-label="Message the scent concierge"
                  className="flex-1 rounded border border-ivory-line bg-white/70 px-3.5 py-2.5 font-sans text-xs text-neutral-900 outline-none placeholder:text-stone/50 focus:border-gold-deep dark:border-night-line dark:bg-night-card dark:text-cream dark:focus:border-gold"
                />
                <button
                  type="submit"
                  disabled={status === 'thinking' || !input.trim()}
                  aria-label="Send"
                  className="rounded border border-gold-deep px-4 text-gold-deep transition-colors hover:bg-gold-deep hover:text-ivory disabled:opacity-50 dark:border-gold dark:text-gold dark:hover:bg-gold dark:hover:text-night"
                >
                  <Send size={13} aria-hidden />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
