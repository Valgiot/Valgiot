# Site V.A.L.G (portfolio photo, Astro)

- Le contenu est dans `src/photos/` (univers → sous-parties → photos), `src/portrait/` (portrait de Valentin) et
  `public/films/` (films de l'accueil). Le site est la refonte de novembre 2026 (pages dans `src/pages/`, composants
  `src/components/v2/`, styles `src/styles/v2*.css`, scripts `src/scripts/v2/`). Les anciennes adresses sont redirigées
  par `public/_redirects`.
  Le fonctionnement pour le photographe est décrit dans `GUIDE.md`, en français : garder ce guide à jour.
- **Hébergement Cloudflare Workers** (assets statiques, `wrangler.jsonc` → `dist`) : chaque push sur la branche
  `claude/photographer-portfolio-prompt-4hvfhi` construit et met en ligne le site (une construction à la fois,
  ~3-5 min à cause des images). Regrouper les changements en un seul push. Adresse officielle (https://valgstudiophotovideo.com) : `site` dans
  `astro.config.mjs` (modifiable par la variable SITE_URL). Netlify n'est plus utilisé.
- Photos : exports JPEG 2500 px sur le grand côté. Les envois arrivent souvent avec des noms `DSC…` ou au mauvais
  endroit : les renommer (`NN-description.jpg`, le nom sert de texte alternatif) et les ranger, en vérifiant le contenu.
- Vérifier avec `npm run build` avant de pousser.
