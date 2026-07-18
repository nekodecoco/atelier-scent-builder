import { useEffect, useLayoutEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { CartDrawer } from './components/ui/CartDrawer';
import { Header } from './components/ui/Header';
import { RouteTransition } from './components/ui/RouteTransition';
import { useCartSync } from './hooks/useCartSync';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { BuilderPage } from './pages/BuilderPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CollectionPage } from './pages/CollectionPage';
import { LandingPage } from './pages/LandingPage';
import { useAuthStore } from './store/useAuthStore';
import { useCatalogStore } from './store/useCatalogStore';

export default function App() {
  const location = useLocation();
  const initAuth = useAuthStore((s) => s.init);
  const loadCatalog = useCatalogStore((s) => s.load);

  useEffect(() => {
    initAuth();
    loadCatalog();
  }, [initAuth, loadCatalog]);

  // Reset scroll to the top on every route change. Without this, navigating from
  // a scrolled-down page leaves the next page at the old offset — which can land
  // you in an empty region so the page looks blank until a refresh. The route
  // transition's wave overlay masks the reset.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useCartSync();

  return (
    <>
      <Header />
      <CartDrawer />
      <main>
        <RouteTransition>
          {/* location prop keeps the outgoing page rendering during its exit */}
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </RouteTransition>
      </main>
      <footer className="border-t border-black/10 bg-bone px-5 py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <span className="font-caslon text-lg text-black">
            Atelier N°9
          </span>
          <nav className="flex flex-col gap-2 font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-graphite">
            <Link to="/collection" className="transition-colors hover:text-black">SHOP</Link>
            <Link to="/builder" className="transition-colors hover:text-black">SCENT BUILDER</Link>
            <Link to="/account" className="transition-colors hover:text-black">ACCOUNT</Link>
          </nav>
          <p className="font-hanken text-[13px] leading-relaxed text-graphite">
            Radical perfumery through hand-mixing, master formulation, and a formula that is
            entirely yours. Manila.
          </p>
        </div>
      </footer>
    </>
  );
}
