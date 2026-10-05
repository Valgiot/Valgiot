# Site V.A.L.G (portfolio photo, Astro)

- Le contenu est dans `src/photos/` (univers → sous-parties → photos), `src/accueil/` (diaporama) et `src/clients/`.
  Le fonctionnement pour le photographe est décrit dans `GUIDE.md`, en français : garder ce guide à jour.
- **Mise en ligne Netlify** : `netlify.toml` lance `scripts/netlify-publier.sh`, qui n'autorise une mise en ligne
  que si un message de commit contient « publier » depuis la dernière. Ajouter « publier » au message de commit
  uniquement quand l'utilisateur veut que la modification soit en ligne ; regrouper les changements en un seul envoi.
- Photos : exports JPEG 2500 px sur le grand côté. Les envois arrivent souvent avec des noms `DSC…` ou au mauvais
  endroit : les renommer (`NN-description.jpg`, le nom sert de texte alternatif) et les ranger, en vérifiant le contenu.
- Vérifier avec `npm run build` avant de pousser.
