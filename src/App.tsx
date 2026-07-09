import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { CartDrawer } from './components/ui/CartDrawer';
import { Header } from './components/ui/Header';
import { AccountPage } from './pages/AccountPage';
import { CollectionPage } from './pages/CollectionPage';
import { HomePage } from './pages/HomePage';
import { useAuthStore } from './store/useAuthStore';
import { useScentStore } from './store/useScentStore';

export default function App() {
  const theme = useScentStore((s) => s.theme);
  const initAuth = useAuthStore((s) => s.init);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <>
      <Header />
      <CartDrawer />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Routes>
      </main>
      <footer className="border-t border-ivory-line px-5 py-10 dark:border-night-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <span className="font-display text-sm tracking-luxe text-stone">ATELIER&nbsp;N°9</span>
          <span className="font-sans text-[10px] tracking-luxe text-stone-dim">
            HAND-MIXED TO YOUR FORMULA · PARIS
          </span>
        </div>
      </footer>
    </>
  );
}
