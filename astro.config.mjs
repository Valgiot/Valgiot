// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Adresse officielle du site (liens pour Google, plan du site, aperçus de partage).
  // À remplacer par le nom de domaine quand il sera relié (ou via la variable SITE_URL).
  site: process.env.SITE_URL ?? 'https://valg-studio.crazy-gamer50700.workers.dev',
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      // Encodage WebP plus rapide (effort 2 au lieu de 4) : même qualité et même poids, constructions ~35 % plus courtes.
      config: { webp: { effort: 2 } },
    },
  },
});
