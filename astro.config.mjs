// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Adresse du site : fournie automatiquement par Netlify (adresse en .netlify.app, puis ton nom de domaine
  // dès qu'il est relié). La valeur après ?? ne sert qu'en local.
  site: process.env.URL ?? 'https://valg-studio.fr',
});
