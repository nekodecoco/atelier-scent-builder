import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

type Mode = 'signin' | 'signup';

export function AuthForm() {
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (result.error) setError(result.error);
    if (result.info) setInfo(result.info);
  };

  const tabClass = (active: boolean) =>
    `flex-1 border-b-2 pb-2.5 font-sans text-[10px] tracking-luxe transition-colors ${
      active
        ? 'border-gold-deep text-gold-deep dark:border-gold dark:text-gold'
        : 'border-transparent text-stone-dim hover:text-stone'
    }`;

  return (
    <div className="mx-auto max-w-sm rounded-lg border border-ivory-line bg-white/60 p-7 dark:border-night-line dark:bg-night-soft">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode('signin')} className={tabClass(mode === 'signin')}>
          SIGN IN
        </button>
        <button type="button" onClick={() => setMode('signup')} className={tabClass(mode === 'signup')}>
          CREATE ACCOUNT
        </button>
      </div>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <label className="font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 w-full rounded border border-ivory-line bg-white/70 px-3.5 py-2.5 font-sans text-sm tracking-normal text-neutral-900 outline-none placeholder:text-stone/50 focus:border-gold-deep dark:border-night-line dark:bg-night-card dark:text-cream dark:focus:border-gold"
          />
        </label>
        <label className="font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
          Password
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="mt-1.5 w-full rounded border border-ivory-line bg-white/70 px-3.5 py-2.5 font-sans text-sm tracking-normal text-neutral-900 outline-none placeholder:text-stone/50 focus:border-gold-deep dark:border-night-line dark:bg-night-card dark:text-cream dark:focus:border-gold"
          />
        </label>

        {error && (
          <p className="font-sans text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
        {info && <p className="font-sans text-xs text-gold-deep dark:text-gold">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded bg-gold-deep px-4 py-3 font-sans text-[10px] tracking-luxe text-ivory transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-gold dark:text-night"
        >
          {busy && <Loader2 size={13} className="animate-spin" aria-hidden />}
          {mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
        </button>
      </form>
    </div>
  );
}
