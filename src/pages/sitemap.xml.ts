import type { APIRoute } from 'astro';
import { univers, projets } from '../lib/v2';

// Plan du site pour Google : à déclarer dans Google Search Console.
export const GET: APIRoute = ({ site }) => {
  const pages = [
    '/',
    '/collection/',
    // Une collection qui ne contient qu'un projet n'a pas de page à elle : on va directement au projet.
    ...univers.filter((u) => u.projets.length > 1).map((u) => `/collection/${u.slug}/`),
    ...projets.map((p) => `/projet/${p.id}/`),
    '/a-propos/',
    '/contact/',
    '/mentions-legales/',
  ];
  const urls = pages.map((p) => `  <url><loc>${new URL(p, site)}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
