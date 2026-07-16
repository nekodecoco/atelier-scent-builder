import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { AdminOrders } from '../components/ui/admin/AdminOrders';
import { CostingCalculator } from '../components/ui/admin/CostingCalculator';
import { HeroEditor } from '../components/ui/admin/HeroEditor';
import { IngredientToggles } from '../components/ui/admin/IngredientToggles';
import { NoteEditor } from '../components/ui/admin/NoteEditor';
import { PerfumeEditor } from '../components/ui/admin/PerfumeEditor';
import { PricingEditor } from '../components/ui/admin/PricingEditor';
import { StockEditor } from '../components/ui/admin/StockEditor';
import { SupabaseSetupNotice } from '../components/ui/SupabaseSetupNotice';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl text-neutral-900 dark:text-cream">{title}</h2>
      <p className="mb-4 mt-1 font-sans text-xs text-stone">{hint}</p>
      {children}
    </section>
  );
}

export function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const loading = useAuthStore((s) => s.loading);

  let body: ReactNode;
  if (!isSupabaseConfigured) {
    body = (
      <div className="max-w-md">
        <SupabaseSetupNotice />
      </div>
    );
  } else if (loading) {
    body = <p className="font-sans text-xs text-stone-dim">Checking your session…</p>;
  } else if (!user || !isAdmin) {
    body = (
      <div className="max-w-md rounded-lg border border-ivory-line bg-white/60 p-6 dark:border-night-line dark:bg-night-card">
        <div className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-luxe text-gold-deep dark:text-gold">
          <ShieldAlert size={13} aria-hidden />
          Restricted
        </div>
        <p className="mt-2 font-sans text-xs leading-relaxed text-stone">
          {user
            ? 'This account is not an administrator. The admin bootstrap SQL in SUPABASE_SETUP.md grants access.'
            : 'Sign in with the administrator account to manage the shop.'}
        </p>
        {!user && (
          <Link
            to="/account"
            className="mt-4 inline-block rounded border border-gold-deep px-5 py-2.5 font-sans text-[10px] tracking-luxe text-gold-deep hover:bg-gold-deep hover:text-ivory dark:border-gold dark:text-gold dark:hover:bg-gold dark:hover:text-night"
          >
            GO TO SIGN IN
          </Link>
        )}
      </div>
    );
  } else {
    body = (
      <>
        <Section
          title="Custom blend prices"
          hint="What the scent builder charges per bottle size at 15% oil, plus the surcharge for stronger blends. Premades have their own prices below."
        >
          <PricingEditor />
        </Section>

        <Section
          title="Hero images"
          hint="Full-bleed photos for the three landing-page hero slides, plus the blurred background behind the signature section. Each blank slot falls back to its generative visual. Recommended: wide, high-resolution shots (landscape)."
        >
          <HeroEditor />
        </Section>

        <Section
          title="My perfumes"
          hint="Create house blends of your own — they appear in the collection beside the built-ins. Set each perfume's price per bottle size; blank fields fall back to the builder price. Built-in blends can be hidden without deleting them."
        >
          <PerfumeEditor />
        </Section>

        <Section
          title="My notes"
          hint="Add your own ingredients to the scent builder. Custom notes show a ★ and work everywhere — 3D liquid, recipe, and cart."
        >
          <NoteEditor />
        </Section>

        <Section
          title="Premade stock"
          hint="Scents without a saved count are treated as in stock. Setting 0 shows an out-of-stock badge and disables buying (remix stays enabled)."
        >
          <StockEditor />
        </Section>

        <Section
          title="Builder ingredients"
          hint="Disabled ingredients appear greyed-out and unselectable in the scent builder. If a customer had one selected, the builder moves them to the first available option."
        >
          <IngredientToggles />
        </Section>

        <Section
          title="Costing & margins"
          hint="What-if calculator using your Chemworld supplier rates — see cost, taxes, and profit for any size, strength, solvent, and oil grade."
        >
          <CostingCalculator />
        </Section>

        <Section
          title="Orders"
          hint="Every order across all customers. Status changes are visible in the customer's order history immediately. Costs assume regular-grade oil."
        >
          <AdminOrders />
        </Section>
      </>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 pt-32">
      <p className="font-sans text-[10px] font-medium tracking-[0.2em] text-muted">BACK OF HOUSE</p>
      <h1 className="mt-2 font-grotesk text-4xl font-extrabold uppercase tracking-tightest text-ink sm:text-5xl">
        Admin
      </h1>
      <div className="mt-4">{body}</div>
    </section>
  );
}
