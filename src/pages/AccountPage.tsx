import { LogOut } from 'lucide-react';
import { AuthForm } from '../components/ui/AuthForm';
import { OrderList } from '../components/ui/OrderList';
import { ProfileForm } from '../components/ui/ProfileForm';
import { SavedBlendList } from '../components/ui/SavedBlendList';
import { SupabaseSetupNotice } from '../components/ui/SupabaseSetupNotice';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <p className="font-sans text-[10px] font-medium tracking-[0.2em] text-muted">YOUR ATELIER</p>
      <h1 className="mt-2 font-grotesk text-4xl font-extrabold uppercase tracking-tightest text-ink sm:text-5xl">
        Account
      </h1>

      <div className="mt-12">
        {!isSupabaseConfigured ? (
          <div className="max-w-md">
            <SupabaseSetupNotice />
          </div>
        ) : loading ? (
          <p className="font-sans text-xs text-stone-dim">Checking your session…</p>
        ) : !user ? (
          <>
            <p className="mb-8 max-w-md font-sans text-sm leading-relaxed text-stone">
              Sign in to place orders and revisit every blend you've commissioned.
            </p>
            <AuthForm />
          </>
        ) : (
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-ivory-line bg-white/60 px-5 py-4 dark:border-night-line dark:bg-night-soft">
              <div>
                <div className="font-sans text-[10px] uppercase tracking-luxe text-stone-dim">
                  Signed in as
                </div>
                <div className="mt-0.5 font-display text-lg text-neutral-900 dark:text-cream">
                  {user.email}
                </div>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="flex items-center gap-2 rounded border border-ivory-line px-4 py-2.5 font-sans text-[10px] tracking-luxe text-stone transition-colors hover:border-gold-deep hover:text-gold-deep dark:border-night-line dark:hover:border-gold dark:hover:text-gold"
              >
                <LogOut size={12} aria-hidden />
                SIGN OUT
              </button>
            </div>

            <h2 className="mb-4 mt-10 font-display text-2xl text-neutral-900 dark:text-cream">
              Delivery details
            </h2>
            <ProfileForm />

            <h2 className="mb-4 mt-10 font-display text-2xl text-neutral-900 dark:text-cream">
              Saved blends
            </h2>
            <SavedBlendList />

            <h2 className="mb-4 mt-10 font-display text-2xl text-neutral-900 dark:text-cream">
              Order history
            </h2>
            <OrderList />
          </div>
        )}
      </div>
    </section>
  );
}
