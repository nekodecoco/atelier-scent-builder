import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { CartDrawer } from './components/ui/CartDrawer';
import { Header } from './components/ui/Header';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { BuilderPage } from './pages/BuilderPage';
import { CollectionPage } from './pages/CollectionPage';
import { LandingPage } from './pages/LandingPage';
import { useAuthStore } from './store/useAuthStore';
import { useCatalogStore } from './store/useCatalogStore';

export default function App() {
  const initAuth = useAuthStore((s) => s.init);
  const loadCatalog = useCatalogStore((s) => s.load);

  useEffect(() => {
    initAuth();
    loadCatalog();
  }, [initAuth, loadCatalog]);

  return (
    <>
      <Header />
      <CartDrawer />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/builder" element={<BuilderPage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      <footer className="border-t border-black/10 bg-bone px-5 py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <span className="font-caslon text-lg text-black">
            Atelier N°9
          </span>
          <nav className="flex flex-col gap-2 font-jetbrains text-[10px] font-medium uppercase tracking-[0.1em] text-graphite">
            <a href="/collection" className="transition-colors hover:text-black">SHOP</a>
            <a href="/builder" className="transition-colors hover:text-black">SCENT BUILDER</a>
            <a href="/account" className="transition-colors hover:text-black">ACCOUNT</a>
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
