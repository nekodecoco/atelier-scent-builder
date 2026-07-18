import { PREMADE_SCENTS } from '../data/premadeScents';
import { premadePriceFor } from './pricing';

/**
 * Canonical origin for links/OG/sitemap. PLACEHOLDER — swap for the real domain
 * when it's settled (also update public/sitemap.xml and public/robots.txt).
 * No trailing slash.
 */
export const SITE_URL = 'https://atelier-n9.vercel.app';

export interface RouteMeta {
  title: string;
  description: string;
  /** Private routes: crawlers are told to stay out, and they are not prerendered. */
  noindex?: boolean;
}

export const ROUTE_META: Record<string, RouteMeta> = {
  '/': {
    title: 'Atelier N°9 — Custom Perfume, Hand-Mixed in Manila',
    description:
      'Compose a fragrance no one else owns. Blend top, heart, and base notes in an interactive 3D scent builder, or shop signature blends — hand-mixed to order in Manila.',
  },
  '/builder': {
    title: 'Scent Builder — Compose Your Own Perfume | Atelier N°9',
    description:
      'Blend your own perfume in 3D — balance three layers of rare notes, watch the bottle fill live, name your creation, and order it hand-mixed to your formula.',
  },
  '/collection': {
    title: 'The Collection — Signature Blends | Atelier N°9',
    description:
      'House-composed signature perfumes, hand-mixed in Manila — plus every blend our customers have made their own. Remix any of them in the 3D builder.',
  },
  '/checkout': {
    title: 'Checkout | Atelier N°9',
    description: 'Place your Atelier N°9 order.',
    noindex: true,
  },
  '/account': {
    title: 'Your Account | Atelier N°9',
    description: 'Your orders, saved blends, and delivery details.',
    noindex: true,
  },
  '/admin': {
    title: 'Admin | Atelier N°9',
    description: 'Shop administration.',
    noindex: true,
  },
};

export function metaFor(pathname: string): RouteMeta {
  return ROUTE_META[pathname] ?? ROUTE_META['/'];
}

/** Canonical URL for a route — no query strings, ever. */
export function canonicalUrl(pathname: string): string {
  return pathname === '/' ? `${SITE_URL}/` : SITE_URL + pathname;
}

/**
 * schema.org Product list for the collection page, from the built-in premades.
 * Deterministic at module scope: admin premades/prices aren't loaded yet when
 * this runs at build time, and the built-ins are the stable, linkable catalog.
 */
export function collectionJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: PREMADE_SCENTS.map((scent, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: scent.name,
        description: scent.description,
        brand: { '@type': 'Brand', name: 'Atelier N°9' },
        url: `${SITE_URL}/collection`,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'PHP',
          price: premadePriceFor(scent.id, 30),
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  };
}

/** Create-or-update a head tag identified by `selector`. */
function upsert(selector: string, create: () => HTMLElement, set: (el: HTMLElement) => void): void {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  set(el);
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  upsert(
    `meta[${attr}="${key}"]`,
    () => {
      const el = document.createElement('meta');
      el.setAttribute(attr, key);
      return el;
    },
    (el) => el.setAttribute('content', content),
  );
}

/**
 * Client-side head management, run on every route change (App's effect).
 * Prerendered pages ship the same tags baked in (src/prerender.tsx derives them
 * from the same ROUTE_META); this keeps them correct as the SPA navigates.
 */
export function applySeo(pathname: string): void {
  const meta = metaFor(pathname);

  document.title = meta.title;
  upsertMeta('name', 'description', meta.description);
  upsertMeta('property', 'og:title', meta.title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:url', canonicalUrl(pathname));
  upsert(
    'link[rel="canonical"]',
    () => {
      const el = document.createElement('link');
      el.setAttribute('rel', 'canonical');
      return el;
    },
    (el) => el.setAttribute('href', canonicalUrl(pathname)),
  );

  // noindex on private routes; remove the tag entirely on public ones.
  const robots = document.head.querySelector('meta[name="robots"]');
  if (meta.noindex) {
    upsertMeta('name', 'robots', 'noindex, nofollow');
  } else if (robots) {
    robots.remove();
  }

  // Structured data only where it applies.
  const JSONLD_ID = 'seo-jsonld';
  const existing = document.getElementById(JSONLD_ID);
  if (pathname === '/collection') {
    const script = existing ?? document.createElement('script');
    script.id = JSONLD_ID;
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(collectionJsonLd());
    if (!existing) document.head.appendChild(script);
  } else if (existing) {
    existing.remove();
  }
}
