# Guide — mettre à jour le site V.A.L.G

Tout le contenu du site se trouve dans le dossier **`src/photos/`**. Tu n'as jamais besoin de toucher au code :
le site lit ce dossier et construit les pages tout seul.

Le site a trois niveaux :

1. **Accueil** : un rectangle vertical par **univers** (Sport, Entreprises, Portrait, Événements, Marques).
2. **Page d'un univers** : un carré par **sous-partie** (Football, Ski, Padel…), et/ou directement des photos.
3. **Page d'une sous-partie** : la galerie photo (et les vidéos).

```
src/photos/
├── sport/                        ← un univers = un dossier (un rectangle sur l'accueil)
│   ├── categorie.json            ← titre, texte, ordre, photo du rectangle
│   ├── football/                 ← une sous-partie = un sous-dossier (un carré sur la page Sport)
│   │   ├── infos.json            ← titre, lieu, date, texte, ordre, vidéos
│   │   └── 01-stade-sm-caen.jpg  ← les photos de la sous-partie
│   ├── ski/
│   └── …
├── evenements/
│   ├── 30-ans-mnk/
│   └── …
├── entreprises/
├── marques/
│   └── craft/
└── portrait/                     ← pas de sous-dossier : les photos s'affichent directement
    └── 01-portrait-plage.jpg
```

## Ajouter des photos en un clic

1. Clique sur le lien du bon dossier ci-dessous (connecte-toi à GitHub si on te le demande).
2. Glisse tes photos dans la zone « Drag files here » (ou clique sur « choose your files »).
3. Clique sur le bouton vert **« Commit changes »**.
4. Attends 3 à 5 minutes : le site en ligne se met à jour tout seul (voir « Mise en ligne » plus bas).

| Où | Lien pour ajouter des photos |
|---|---|
| Diaporama de l'accueil | [Envoyer](https://github.com/valgiot/valgiot/upload/claude/photographer-portfolio-prompt-4hvfhi/src/accueil) |
| Sport → Football | [Envoyer](https://github.com/valgiot/valgiot/upload/claude/photographer-portfolio-prompt-4hvfhi/src/photos/sport/football) |
| Sport → Ski | [Envoyer](https://github.com/valgiot/valgiot/upload/claude/photographer-portfolio-prompt-4hvfhi/src/photos/sport/ski) |
| Sport → Padel | [Envoyer](https://github.com/valgiot/valgiot/upload/claude/photographer-portfolio-prompt-4hvfhi/src/photos/sport/padel) |
| Sport → MMA | [Envoyer](https://github.com/valgiot/valgiot/upload/claude/photographer-portfolio-prompt-4hvfhi/src/photos/sport/mma) |
| Sport → Athlétisme | [Envoyer](https://github.com/valgiot/valgiot/upload/claude/photographer-portfolio-prompt-4hvfhi/src/photos/sport/athletisme) |
| Sport → Cyclisme | [Envoyer](https://github.com/valgiot/valgiot/upload/claude/photographer-portfolio-prompt-4hvfhi/src/photos/sport/cyclisme) |
| Entreprises → Abeille Assurance | [Envoyer](https://github.com/valgiot/valgiot/upload/claude/photographer-portfolio-prompt-4hvfhi/src/photos/entreprises/abeille-assurance) |
| Entreprises → Le Club Porticcio | [Envoyer](https://github.com/valgiot/valgiot/upload/claude/photographer-portfolio-prompt-4hvfhi/src/photos/entreprises/le-club-porticcio) |
| Portrait | [Envoyer](https://github.com/valgiot/valgiot/upload/claude/photographer-portfolio-prompt-4hvfhi/src/photos/portrait) |
| Événements → Nuit des Combattants | [Envoyer](https://github.com/valgiot/valgiot/upload/claude/photographer-portfolio-prompt-4hvfhi/src/photos/evenements/nuit-des-combattants) |
| Événements → 30 ans MNK | [Envoyer](https://github.com/valgiot/valgiot/upload/claude/photographer-portfolio-prompt-4hvfhi/src/photos/evenements/30-ans-mnk) |
| Événements → French Dart Festival | [Envoyer](https://github.com/valgiot/valgiot/upload/claude/photographer-portfolio-prompt-4hvfhi/src/photos/evenements/french-dart-festival) |
| Événements → Padel X Live | [Envoyer](https://github.com/valgiot/valgiot/upload/claude/photographer-portfolio-prompt-4hvfhi/src/photos/evenements/padel-x-live) |
| Marques → Craft | [Envoyer](https://github.com/valgiot/valgiot/upload/claude/photographer-portfolio-prompt-4hvfhi/src/photos/marques/craft) |
| Logos clients | [Envoyer](https://github.com/valgiot/valgiot/upload/claude/photographer-portfolio-prompt-4hvfhi/src/clients) |

Pense à exporter tes photos en 2500 px avant l'envoi (voir « Préparer ses photos » plus bas) : au-delà de 25 Mo,
GitHub refuse le fichier. Pour **remplacer** une photo, envoie la nouvelle avec exactement le même nom de fichier. Les photos s'affichent dans
l'ordre de leur nom (`01-…`, `02-…`) et la première devient la photo du carré.
Sur téléphone, ouvre ces liens dans le navigateur (pas dans l'application GitHub).

## Les photos du diaporama de l'accueil

Dossier **`src/accueil/`** : mets-y 3 à 6 photos **horizontales** (format paysage), nommées `01.jpg`, `02.jpg`…
Elles défilent en boucle en plein écran, une toutes les 8 secondes. Le délai, le grand titre, la phrase en dessous
et le texte du bouton se changent dans `src/site.ts` (`diaporamaSecondes`, `slogan`, `sloganSousTitre`, `boutonAccueil`).

Le titre s'affiche dans le bas de la photo, sur un léger voile sombre : garde le sujet plutôt au centre ou en haut.
Exporte-les en 2500 px de large minimum pour qu'elles restent nettes sur les grands écrans.

## Les logos "Ils m'ont fait confiance"

Dossier **`src/clients/`** : dépose les logos de tes clients (SVG ou PNG à fond transparent de préférence).
Le nom du fichier sert de nom du client (ex. `sm-caen.png`). Ils s'affichent en gris et prennent leur couleur au survol.
Tant qu'il n'y a aucun logo dans ce dossier, la section n'apparaît pas sur le site.

Ne mets que des clients qui sont d'accord pour apparaître.

## Ajouter des photos dans une sous-partie (le plus courant)

Ouvre le dossier de la sous-partie (ex. `src/photos/sport/football/`) et dépose tes photos (JPG, PNG ou WebP).
Elles s'affichent dans l'ordre de leur nom : nomme-les `01-…`, `02-…`. La première sert de photo du carré.

Une sous-partie sans photo s'affiche quand même, avec un carré bleu et « Les photos arrivent bientôt » :
Google ne la référence pas tant qu'elle est vide.

## Créer une nouvelle sous-partie (un nouveau carré)

1. Crée un dossier dans le bon univers, en minuscules, sans espaces ni accents : `src/photos/evenements/tournoi-de-noel/`
2. Ajoute un fichier `infos.json` :

```json
{
  "titre": "Tournoi de Noël",
  "lieu": "Caen",
  "date": "2026-12-14",
  "description": "Une phrase sur l'événement, le client ou le contexte.",
  "ordre": 5
}
```

3. Mets-y tes photos.

Tout est facultatif sauf le dossier lui-même. Les carrés sont classés selon `ordre`, puis du plus récent au plus ancien
(selon la `date`). Le `lieu` s'affiche en petit sous le nom du carré (ex. « Porticcio, Corse »).
Pour choisir la photo du carré : `"couverture": "03-nom-de-la-photo.jpg"`. Pour cacher un carré : `"visible": false`.

## Ajouter une vidéo

Mets ta vidéo sur **YouTube** ou **Vimeo** (jamais directement dans le dossier), puis colle le lien dans `infos.json` :

```json
{
  "titre": "Padel X Live",
  "videos": ["https://vimeo.com/123456789", "https://youtu.be/abcdefghijk"]
}
```

Les vidéos s'affichent au-dessus des photos. Une sous-partie peut ne contenir que des vidéos.

## Univers sans sous-partie (ex. Portrait)

Dépose les photos directement dans le dossier de l'univers (ex. `src/photos/portrait/`) : elles s'affichent en galerie
sur sa page. Si un univers a des sous-parties **et** des photos directes, les photos s'affichent sous les carrés,
dans une partie « Sélection ».

## Changer la photo d'un rectangle de l'accueil

Dans `categorie.json`, indique le chemin de la photo à partir du dossier de l'univers :

```json
{
  "titre": "Sport",
  "ordre": 1,
  "couverture": "ski/01-ski-freestyle.jpg"
}
```

Sans `couverture`, le site prend la première photo trouvée. Une photo **verticale** (format portrait) rend le mieux,
avec le sujet au centre ou en haut : le nom s'affiche en bas du rectangle.

Astuce : donne des noms parlants à tes fichiers (`02-padel.jpg` plutôt que `IMG_4521.jpg`). Le nom sert de
description de la photo pour Google et l'accessibilité.

## Ajouter un univers (ex. Vidéo, Mariage, Immobilier…)

Crée un nouveau dossier dans `src/photos/` avec un `categorie.json` (titre, description, ordre, titreSeo,
descriptionSeo) : un nouveau rectangle apparaît sur l'accueil, avec sa page. Le champ `ordre` règle sa position.
Pour masquer un univers sans le supprimer : `"visible": false`.

## Préparer ses photos (important)

GitHub refuse tout fichier de plus de **25 Mo** (message « The file is too large »). Les originaux de l'appareil
sont souvent plus lourds : il faut donc **exporter** les photos avant de les envoyer. Le site n'a de toute façon pas
besoin de plus de 2500 px.

**Réglages d'export dans Lightroom Classic** (Fichier → Exporter) :

- **Paramètres du fichier** : JPEG, qualité **85**, espace colorimétrique **sRGB**
- **Dimensionnement de l'image** : cocher « Redimensionner », **Bord long : 2500 pixels**
- **Netteté de sortie** : Écran, standard
- **Métadonnées** : « Copyright uniquement », et cocher « Supprimer les infos de lieu »
- **Nom du fichier** (facultatif) : un nom parlant, ex. `padel-x-live-01` : il sert de description pour Google

Clique sur « Ajouter » en bas à gauche pour l'enregistrer en paramètre prédéfini « Site V.A.L.G » : la prochaine
fois, un clic suffit. Dans Lightroom (version mobile/cloud) : Exporter → JPG, Bord long 2500 px, qualité 85.

Chaque photo pèse alors 1 à 4 Mo : tu peux en envoyer une dizaine d'un coup sans problème.

## Modifier les informations générales

E-mail, Instagram, accroche et texte de présentation : fichier `src/site.ts`.
Couleurs : en haut du fichier `src/styles/global.css`.
Mentions légales : rubrique `mentions` dans `src/site.ts` (nom, statut, SIRET, adresse). Une ligne laissée vide
n'apparaît pas sur le site : ajoute ton SIRET dès que tu l'as reçu.

## Ajouter des photos sans ordinateur de développement

Sur github.com, ouvre le dossier voulu dans `src/photos/`, puis "Add file" → "Upload files" et glisse tes photos.
Pour créer une sous-partie, utilise "Add file" → "Create new file" et tape `nom-du-dossier/infos.json`.
Le site en ligne se met à jour tout seul quelques minutes après.

## Référencement Google (SEO)

Déjà en place sur le site :

- Titre de l'onglet et des résultats Google : « Photographe & vidéaste à Caen, Normandie — V.A.L.G » sur l'accueil,
  et un titre par univers (« Photographe sport à Caen et en Normandie », « Photographe entreprise, restaurant et food
  à Caen », etc.).
- Description Google de chaque page, grand titre (h1) avec métier + ville, court texte de présentation sur l'accueil.
- Fiche d'identité pour Google (activité, Caen, Normandie, e-mail, Instagram) et plan du site (`/sitemap.xml`).
- Texte descriptif des photos tiré du nom des fichiers.

Où modifier :

- Titre et description de l'accueil, texte de présentation : `src/site.ts` (`accroche`, `description`, `presentation`).
- Titre et description Google d'un univers : `titreSeo` et `descriptionSeo` dans son `categorie.json`.

Les « mots-clés » cachés ne servent plus à rien pour Google : ce qui compte, ce sont les mots **visibles** dans
les titres et les textes (photographe, vidéaste, Caen, Normandie, sport, restaurant, food, portrait, événementiel…).
Reste naturel : une phrase écrite pour un humain vaut mieux qu'une liste de mots.

À faire une fois le site en ligne (c'est ce qui compte le plus pour « photographe Caen ») :

1. **Google Business Profile** (gratuit) : crée ta fiche « V.A.L.G — Photographe & vidéaste », catégorie
   « Photographe », zone desservie Caen / Normandie, avec le lien du site et des photos. Demande des avis à tes clients.
2. **Google Search Console** : ajoute ton site et déclare le plan du site `https://ton-domaine.fr/sitemap.xml`.
3. Mets le lien du site dans ta bio Instagram, et demande aux clubs, restaurants et clients de te créditer avec un
   lien vers ton site quand ils publient tes photos.
4. Ajoute régulièrement des sous-parties avec un titre et un lieu précis (ex. « SM Caen — Stade d'Ornano ») :
   chaque nouveau contenu aide le référencement.

## Voir le site sur ton ordinateur

Il faut [Node.js](https://nodejs.org) (version 22 ou plus), puis dans un terminal, dans le dossier du site :

```
npm install
npm run dev
```

Le site s'ouvre sur http://localhost:4321 et se met à jour dès que tu ajoutes une photo.

## Mise en ligne (Cloudflare, gratuit)

Le site est hébergé gratuitement par **Cloudflare** : https://valg-studio.crazy-gamer50700.workers.dev
Les visites sont illimitées et il n'y a pas de crédits à surveiller.

- **Chaque envoi sur GitHub remet le site en ligne tout seul**, en 3 à 5 minutes (le temps de préparer les photos).
- Pour suivre une mise en ligne : sur [dash.cloudflare.com](https://dash.cloudflare.com), **Workers & Pages** →
  **valg-studio** → **Deployments**. Quand les étapes sont vertes, c'est en ligne.
- Une seule mise en ligne se fait à la fois : si tu envoies plusieurs paquets de photos d'affilée, les mises en
  ligne attendent leur tour. Mieux vaut envoyer un gros paquet que dix petits.
- Une étape en rouge ? Le site précédent reste en ligne, rien n'est cassé : envoie une capture du journal à Claude.

Réglages du projet Cloudflare (déjà faits, pour mémoire) : commande de construction `npm run build`, commande de
mise en ligne `npx wrangler deploy` (elle lit le fichier `wrangler.jsonc`), branche de production
`claude/photographer-portfolio-prompt-4hvfhi`.

### Ton propre nom de domaine (environ 10 € par an)

Comme le site est chez Cloudflare, le domaine doit être géré par Cloudflare :

1. Achète le domaine (ex. `valgstudio.fr`) chez OVH ou Gandi, **sans aucune option** (pas d'hébergement).
2. Dans Cloudflare : **Domains** → **Add a domain** → tape ton domaine → offre **Free**. Cloudflare te donne
   2 « serveurs de noms » (nameservers).
3. Chez OVH : ton domaine → **Serveurs DNS** → **Modifier** → remplace par les 2 serveurs de Cloudflare.
4. Une fois le domaine actif dans Cloudflare (quelques heures) : **Workers & Pages** → **valg-studio** →
   **Settings** → **Domains & Routes** → **Add** → **Custom domain** → tape ton domaine.
5. Demande ensuite à Claude de mettre la nouvelle adresse comme adresse officielle du site.
