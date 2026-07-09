import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Hero } from '../components/ui/Hero';
import { ScentBuilder } from '../components/ui/ScentBuilder';

export function HomePage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <>
      <Hero />
      <ScentBuilder />
    </>
  );
}
