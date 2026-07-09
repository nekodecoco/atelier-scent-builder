import { MAX_NAME_LENGTH, useScentStore } from '../../store/useScentStore';

export function CustomNameInput() {
  const customName = useScentStore((s) => s.customName);
  const setCustomName = useScentStore((s) => s.setCustomName);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label
          htmlFor="custom-name"
          className="font-sans text-[10px] uppercase tracking-luxe text-stone-dim"
        >
          Name your creation
        </label>
        <span className="font-sans text-[10px] text-stone-dim">
          {customName.length}/{MAX_NAME_LENGTH}
        </span>
      </div>
      <input
        id="custom-name"
        type="text"
        value={customName}
        maxLength={MAX_NAME_LENGTH}
        onChange={(e) => setCustomName(e.target.value)}
        placeholder="Golden Hour"
        className="mt-2 w-full rounded border border-ivory-line bg-white/70 px-4 py-3 font-display text-xl italic text-neutral-900 outline-none transition-colors placeholder:text-stone/50 focus:border-gold-deep dark:border-night-line dark:bg-night-card dark:text-cream dark:focus:border-gold"
      />
    </div>
  );
}
