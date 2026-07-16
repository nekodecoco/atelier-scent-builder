import { ShoppingBag, User } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { cartCount, useCartStore } from '../../store/useCartStore';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `transition-colors hover:text-black ${isActive ? 'text-black underline underline-offset-4' : ''}`;

export function Header() {
  const count = useCartStore((s) => cartCount(s.items));
  const openCart = useCartStore((s) => s.openCart);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-black/10 bg-bone/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-5 py-3.5 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-caslon text-lg text-black">
            Atelier N°9
          </Link>
          <nav className="hidden items-center gap-5 font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-graphite md:flex">
            <NavLink to="/collection" className={navClass}>
              SHOP
            </NavLink>
            <NavLink to="/builder" className={navClass}>
              SCENT BUILDER
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-5 font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-graphite">
          <span className="hidden sm:inline">PHP</span>
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
            className="relative transition-colors hover:text-black"
          >
            <ShoppingBag size={15} aria-hidden />
            {count > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center bg-black px-1 font-jetbrains text-[9px] font-medium text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      <nav className="flex items-center gap-5 border-t border-black/10 px-5 py-2 font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-graphite md:hidden">
        <NavLink to="/collection" className={navClass}>
          SHOP
        </NavLink>
        <NavLink to="/builder" className={navClass}>
          SCENT BUILDER
        </NavLink>
      </nav>
    </header>
  );
}
