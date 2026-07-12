import { useEffect } from 'react';
import { ScentBuilder } from '../components/ui/ScentBuilder';

export function BuilderPage() {
  useEffect(() => window.scrollTo(0, 0), []);

  return (
    <div className="pt-[88px] md:pt-[53px]">
      <ScentBuilder />
    </div>
  );
}
