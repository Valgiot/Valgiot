import type { APIRoute } from 'astro';
import { categories } from '../lib/photos';

// Plan du site pour Google : à déclarer dans Google Search Console.
export const GET: APIRoute = ({ site }) => {
  const pages = [
    '/',
    ...categories.flatMap((c) => [
      ...(c.photos.length || c.sousCategories.length ? [`/${c.slug}/`] : []),
      ...c.sousCategories.filter((s) => s.photos.length || s.videos.length).map((s) => `/${c.slug}/${s.slug}/`),
    ]),
    '/mentions-legales',
  ];
  const urls = pages.map((p) => `  <url><loc>${new URL(p, site)}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
