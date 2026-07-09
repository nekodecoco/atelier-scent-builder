import { KeyRound } from 'lucide-react';

export function SupabaseSetupNotice() {
  return (
    <div className="rounded-lg border border-ivory-line bg-white/60 p-5 dark:border-night-line dark:bg-night-card">
      <div className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-luxe text-gold-deep dark:text-gold">
        <KeyRound size={13} aria-hidden />
        Accounts not connected yet
      </div>
      <p className="mt-2 font-sans text-xs leading-relaxed text-stone">
        Sign-in and orders need a Supabase project. Add{' '}
        <code className="text-neutral-800 dark:text-cream">VITE_SUPABASE_URL</code> and{' '}
        <code className="text-neutral-800 dark:text-cream">VITE_SUPABASE_ANON_KEY</code> to{' '}
        <code className="text-neutral-800 dark:text-cream">.env.local</code>, then restart the dev
        server. Full steps are in <code className="text-neutral-800 dark:text-cream">SUPABASE_SETUP.md</code>.
      </p>
    </div>
  );
}
