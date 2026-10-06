// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Adresse officielle du site (liens pour Google, plan du site, aperçus de partage).
  // SITE_URL peut la remplacer sans toucher au code ; URL est fournie par Netlify.
  site: process.env.SITE_URL ?? process.env.URL ?? 'https://valg-studio.netlify.app',
});
