import { Moon, ShoppingBag, Sun, User } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { cartCount, useCartStore } from '../../store/useCartStore';
import { useScentStore } from '../../store/useScentStore';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `transition-colors hover:text-gold-deep dark:hover:text-gold ${
    isActive
      ? 'text-gold-deep underline decoration-1 underline-offset-8 dark:text-gold'
      : ''
  }`;

export function Header() {
  const theme = useScentStore((s) => s.theme);
  const toggleTheme = useScentStore((s) => s.toggleTheme);
  const count = useCartStore((s) => cartCount(s.items));
  const openCart = useCartStore((s) => s.openCart);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-ivory-line/70 bg-ivory/80 backdrop-blur-md dark:border-night-line dark:bg-night/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="font-display text-lg tracking-luxe text-neutral-900 dark:text-cream">
          ATELIER&nbsp;N°9
        </Link>

        <nav className="flex items-center gap-6 font-sans text-[11px] tracking-luxe text-stone">
          <NavLink to="/collection" className={navClass}>
            COLLECTION
          </NavLink>
          <Link
            to="/#builder"
            className="hidden transition-colors hover:text-gold-deep dark:hover:text-gold sm:block"
          >
            SCENT BUILDER
          </Link>
          {isAdmin && (
            <NavLink to="/admin" className={navClass}>
              ADMIN
            </NavLink>
          )}
          <NavLink to="/account" className={navClass} aria-label="Account">
            <User size={15} aria-hidden />
          </NavLink>
          <button
            type="button"
            onClick={openCart}
            aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
            className="relative flex items-center gap-1.5 transition-colors hover:text-gold-deep dark:hover:text-gold"
          >
            <ShoppingBag size={15} aria-hidden />
            {count > 0 && (
              <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-deep px-1 font-sans text-[9px] font-medium text-ivory dark:bg-gold dark:text-night">
                {count}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-full border border-ivory-line p-2 text-neutral-700 transition-colors hover:border-gold-deep hover:text-gold-deep dark:border-night-line dark:text-cream dark:hover:border-gold dark:hover:text-gold"
          >
            {theme === 'dark' ? <Sun size={14} aria-hidden /> : <Moon size={14} aria-hidden />}
          </button>
        </nav>
      </div>
    </header>
  );
}
