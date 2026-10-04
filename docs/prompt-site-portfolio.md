# Prompt — Site portfolio photographe & vidéaste

> Remplace tout ce qui est entre `[crochets]` avant d'utiliser le prompt.
> Il est pensé pour un assistant de code (Claude Code, Cursor, etc.) qui crée le site de A à Z.

---

## Le prompt

```
Tu es un développeur front-end senior et un directeur artistique spécialisé dans les portfolios de photographes. Crée-moi un site portfolio complet, épuré et élégant.

## Qui je suis
- Nom / marque : [Prénom Nom ou nom de marque]
- Basé à : [Ville, région] — je me déplace [zone]
- Métier : photographe, spécialisé en sport à la base. Je fais aussi de la photo culinaire / restaurants, du portrait et de l'événementiel. Je débute la vidéo et je veux la développer.
- Positionnement en une phrase : "[ex. Photographe sport & lifestyle — l'instant, l'énergie, l'émotion.]"
- Langue(s) du site : [français uniquement / français + anglais]

## Objectif du site
1. Montrer mon travail de façon qualitative (la photo est la star, l'interface s'efface).
2. Obtenir des demandes de devis de : [clubs et athlètes, restaurants et chefs, entreprises et agences, particuliers].
3. Pouvoir être mis à jour TRÈS souvent et facilement, sans toucher au code : ajouter un projet, une catégorie (ex. "Vidéo" qui va grossir), des photos ou des vidéos.

## Direction artistique
- Style : minimaliste, beaucoup d'espace blanc (ou "gris"), typographie sobre, aucune surcharge. Rien de "too much".
- Palette (à respecter, le bleu reste un accent, jamais dominant) :
  - Fond : gris très clair #F4F5F6
  - Surfaces / cartes : #FFFFFF ou #E9ECEE
  - Texte principal : anthracite #1C2128
  - Texte secondaire : gris #6B7580
  - Accent bleu océan : #0B3C5D (liens, boutons, survols)
  - Bleu océan clair (survol / focus) : #1F5F85
  - Prévois aussi un mode sombre : fond #121619, texte #E6E9EC, accent #4F8FB8
- Typographie : une seule famille sans-serif moderne (ex. Inter, Manrope ou Satoshi), 2 graisses maximum. Titres en capitales légèrement espacées possible.
- Animations : uniquement des transitions douces (fondu, léger zoom au survol des images, 200–400 ms). Pas de parallaxe agressive, pas de carrousel automatique, pas de musique, pas de curseur personnalisé.

## Structure des pages
1. Accueil
   - En-tête minimal : logo/nom à gauche, menu à droite (Portfolio, Vidéo, À propos, Contact). Menu burger sur mobile.
   - Section d'intro courte : mon nom, ma phrase de positionnement, éventuellement une grande photo plein écran (ou une boucle vidéo muette de 5–10 s, optionnelle et désactivable).
   - Grille des catégories : une tuile par catégorie, chacune illustrée par UNE photo forte + le nom de la catégorie. Au survol : léger zoom et assombrissement, le nom apparaît/s'affirme. Ordre : Sport, Food & Restaurants, Portrait, Événements, Vidéo.
   - Les catégories sont générées automatiquement à partir du contenu (ajouter une catégorie = ajouter un fichier, pas modifier la page).
   - Un bloc "Ils m'ont fait confiance" discret (logos ou noms de clients) — optionnel.
   - Un appel à l'action final : "Un projet ? Parlons-en" → Contact.
2. Page catégorie (une par catégorie)
   - Titre + 1–2 phrases d'intro.
   - Liste des projets/séries de la catégorie (vignette + titre + client/lieu + année), OU galerie directe si la catégorie n'a pas de projets.
3. Page projet
   - Titre, client, lieu, date, courte description (contexte, brief).
   - Galerie en grille "masonry" ou alternance pleine largeur / 2 colonnes, avec visionneuse plein écran (lightbox) navigable au clavier et au swipe.
   - Peut contenir photos ET vidéos mélangées.
   - Liens "Projet précédent / suivant" et rappel Contact.
4. Vidéo
   - Page qui regroupe toutes les vidéos, quelle que soit leur catégorie (un projet sport avec une vidéo apparaît aussi ici).
   - Vidéos hébergées sur [Vimeo / YouTube / Bunny Stream], intégrées en "lazy" (image d'aperçu, le lecteur ne se charge qu'au clic).
5. À propos
   - Portrait de moi, texte court, mon approche, matériel (optionnel), quelques références clients.
6. Contact
   - Formulaire : nom, e-mail, téléphone (optionnel), type de prestation (liste déroulante reprenant les catégories), date et lieu, budget indicatif (optionnel), message.
   - E-mail, Instagram, [autres réseaux]. Pas de flux Instagram intégré.
7. Pages légales : mentions légales, politique de confidentialité (RGPD).

## Contenu évolutif (point le plus important)
- Tout le contenu doit vivre dans des fichiers (Markdown/MDX ou JSON) ou dans un CMS simple, séparé du code.
- Modèle de contenu :
  - Catégorie : titre, slug, description, image de couverture, ordre d'affichage, visible oui/non.
  - Projet : titre, slug, catégorie(s), date, client, lieu, description, image de couverture, liste de médias, mis en avant oui/non.
  - Média : type (photo | vidéo), fichier ou URL, texte alternatif, légende optionnelle.
- Ajouter un projet = créer un dossier avec les images + un fichier de description. Je veux un exemple de projet par catégorie et un fichier GUIDE.md qui m'explique pas à pas comment ajouter un projet, une catégorie et une vidéo.
- Ajoute une interface d'édition sans code : [Decap CMS / Sveltia CMS / Tina CMS], pour que je puisse publier depuis mon téléphone.

## Technique
- Framework : Astro (site statique, très rapide) avec les "content collections", TypeScript, CSS simple (ou Tailwind) avec les couleurs en variables CSS.
- Images : optimisation automatique (AVIF/WebP, plusieurs tailles via srcset, lazy loading, placeholder flou), suppression des données EXIF/GPS. Taille source max 2500 px côté long.
- Vidéos : jamais stockées dans le dépôt, uniquement via l'hébergeur vidéo.
- Hébergement : [Netlify / Vercel / Cloudflare Pages], déploiement automatique à chaque modification.
- Formulaire : [Netlify Forms / Formspree], avec anti-spam (honeypot).
- Statistiques : [Plausible / Umami] (sans cookies, donc pas de bandeau cookies).

## Qualité
- Mobile first : la majorité des visiteurs viennent d'Instagram sur téléphone.
- Performance : score Lighthouse ≥ 90 sur mobile, première image affichée en moins de 2 s.
- Accessibilité : contrastes AA, navigation clavier, textes alternatifs obligatoires, respect de "prefers-reduced-motion".
- SEO : balises title/description par page, image Open Graph par projet, sitemap, données structurées (Person + LocalBusiness), URLs propres (/sport/nom-du-projet).
- Pas de blocage du clic droit, pas de filigrane sur les photos.

## Ce que j'attends de toi
1. Propose d'abord l'arborescence du projet et le modèle de contenu, et attends ma validation.
2. Construis ensuite le site étape par étape (structure → accueil → catégories → projet → vidéo → à propos/contact → CMS → SEO/légal).
3. Utilise des images de remplacement neutres en attendant mes photos.
4. Termine par le GUIDE.md (ajout de contenu) et une checklist de mise en ligne.

Références de sites que j'aime : [2–3 liens de photographes dont tu aimes le site]
```

---

## Ce qui a été ajouté par rapport à ta demande initiale

| Ajout | Pourquoi |
|---|---|
| Objectif business + cibles clients | Le site doit d'abord faire venir des clients ; ça oriente le texte, l'ordre des catégories et le formulaire. |
| Codes couleur exacts (hex) | "Gris et bleu océan" peut donner 100 résultats différents. Des codes précis = un rendu fidèle. |
| Règle "bleu = accent" | Les photos doivent porter la couleur ; trop de bleu écrase les images (surtout la food). |
| Modèle de contenu (catégorie / projet / média) | C'est ce qui rend le site évolutif : la vidéo devient un simple *type de média*, utilisable dans toutes les catégories. |
| CMS sans code + GUIDE.md | Pour des mises à jour récurrentes sans dépendre d'un développeur ni de l'IA. |
| Liste de ce qu'il ne faut PAS faire | Le meilleur moyen d'obtenir un site "pas too much". |
| Exigences performance / mobile / SEO / RGPD | Un site photo lourd et lent fait fuir ; les obligations légales FR doivent être prévues dès le départ. |
| Construction par étapes avec validation | Évite qu'une IA livre tout d'un coup un résultat qui ne te ressemble pas. |
