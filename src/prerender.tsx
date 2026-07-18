/**
 * Build-time prerender entry for vite-prerender-plugin (see vite.config.ts).
 * Runs in Node during `vite build` and writes real HTML into dist/<route>/index.html
 * for the public routes, so crawlers see content instead of an empty #root.
 *
 * main.tsx uses createRoot().render(), NOT hydrateRoot — the browser simply
 * replaces this static DOM at boot, so hydration mismatches cannot happen and
 * the markup only has to satisfy crawlers.
 *
 * Constraints this file relies on (breaking them fails the build loudly):
 * - Public-route components must not touch window/document at render time
 *   (effects are fine — renderToString never runs them).
 * - Nothing may fetch during render; catalog loading is effect-only, so the
 *   built-in defaults are what gets prerendered. `loaded: true` below makes
 *   CollectionPage render the real cards instead of loading skeletons.
 * - three.js must stay behind the lazy Scene import: renderToString emits its
 *   Suspense fallback, so the 3D stack never executes in Node.
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App';
import { canonicalUrl, collectionJsonLd, metaFor } from './lib/seo';
import { useCatalogStore } from './store/useCatalogStore';

interface HeadElement {
  type: string;
  props: Record<string, string>;
}

export async function prerender({ url }: { url: string }) {
  useCatalogStore.setState({ loaded: true });

  const html = renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  );

  const meta = metaFor(url);
  const elements = new Set<HeadElement>([
    { type: 'meta', props: { name: 'description', content: meta.description } },
    { type: 'meta', props: { property: 'og:title', content: meta.title } },
    { type: 'meta', props: { property: 'og:description', content: meta.description } },
    { type: 'meta', props: { property: 'og:type', content: 'website' } },
    { type: 'meta', props: { property: 'og:url', content: canonicalUrl(url) } },
    { type: 'link', props: { rel: 'canonical', href: canonicalUrl(url) } },
  ]);
  if (url === '/collection') {
    elements.add({
      type: 'script',
      props: { type: 'application/ld+json', children: JSON.stringify(collectionJsonLd()) },
    });
  }

  return { html, head: { lang: 'en', title: meta.title, elements } };
}
