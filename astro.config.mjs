// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Adresse officielle du site (liens pour Google, plan du site, aperçus de partage).
  // Nom de domaine du site (la variable SITE_URL peut le remplacer sans toucher au code).
  site: process.env.SITE_URL ?? 'https://valgstudiophotovideo.com',
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      // Encodage WebP plus rapide (effort 2 au lieu de 4) : même qualité et même poids, constructions ~35 % plus courtes.
      config: { webp: { effort: 2 } },
    },
  },
});
