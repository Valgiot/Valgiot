# Guide — mettre à jour le site V.A.L.G

Tout le contenu du site se trouve dans le dossier **`src/photos/`**. Tu n'as jamais besoin de toucher au code :
le site lit ce dossier et construit les pages tout seul.

```
src/photos/
├── sport/                         ← une catégorie = un dossier (un rectangle sur l'accueil)
│   ├── categorie.json             ← titre, texte, ordre, photo du rectangle
│   ├── 01.jpg, 02.jpg…            ← "Sélection" : tes meilleures photos, affichées en premier
│   └── match-sm-caen/             ← un événement = un sous-dossier
│       ├── infos.json             ← titre, date, lieu, texte, vidéos (facultatif)
│       └── 01.jpg, 02.jpg…        ← les photos de l'événement
├── entreprises/
├── portrait/
└── evenements/
```

## Les photos du diaporama de l'accueil

Dossier **`src/accueil/`** : mets-y 3 à 6 photos **horizontales** (format paysage), nommées `01.jpg`, `02.jpg`…
Elles défilent en boucle en plein écran, une toutes les 8 secondes. Le délai, le grand titre, la phrase en dessous
et le texte du bouton se changent dans `src/site.ts` (`diaporamaSecondes`, `slogan`, `sloganSousTitre`, `boutonAccueil`).

Choisis des photos avec une zone calme au centre (ciel, fond flou) : le titre s'affiche par-dessus.

## Les logos "Ils m'ont fait confiance"

Dossier **`src/clients/`** : dépose les logos de tes clients (SVG ou PNG à fond transparent de préférence).
Le nom du fichier sert de nom du client (ex. `sm-caen.png`). Ils s'affichent en gris et prennent leur couleur au survol.
Supprime les fichiers `exemple-logo-…`. S'il n'y a aucun logo, la section disparaît toute seule.

Ne mets que des clients qui sont d'accord pour apparaître.

## Ajouter un événement (le plus courant)

1. Crée un dossier dans la bonne catégorie, en minuscules et sans espaces ni accents : `src/photos/sport/match-sm-caen-2026/`
2. Mets-y tes photos (JPG, PNG ou WebP). Elles s'affichent dans l'ordre de leur nom : nomme-les `01.jpg`, `02.jpg`…
3. Ajoute un fichier `infos.json` (facultatif mais conseillé) :

```json
{
  "titre": "SM Caen — Stade d'Ornano",
  "date": "2026-10-12",
  "lieu": "Caen",
  "description": "Une phrase sur le match, le client ou le contexte."
}
```

Les événements sont classés du plus récent au plus ancien (selon la `date`). Pour forcer un ordre, ajoute `"ordre": 1`, `"ordre": 2`…

## Ajouter une vidéo

Mets ta vidéo sur **YouTube** ou **Vimeo** (jamais directement dans le dossier), puis colle le lien dans `infos.json` :

```json
{
  "titre": "Course de la Paix",
  "videos": ["https://vimeo.com/123456789", "https://youtu.be/abcdefghijk"]
}
```

Un événement peut contenir des photos et des vidéos, ou seulement des vidéos.

## Mettre à jour ses meilleures photos

Dépose les photos directement dans le dossier de la catégorie, par exemple `src/photos/sport/01.jpg`.
Elles apparaissent tout en haut de la page de la catégorie.

## Changer la photo d'un rectangle de l'accueil

Dans `categorie.json`, indique le chemin de la photo à partir du dossier de la catégorie :

```json
{
  "titre": "Sport",
  "description": "Matchs, courses, athlètes…",
  "ordre": 1,
  "couverture": "match-sm-caen-2026/04.jpg"
}
```

Sans `couverture`, le site prend la première photo trouvée. Une photo **verticale** (format portrait) rend le mieux,
avec le sujet au centre : le nom de la catégorie s'affiche au milieu du rectangle.

## Ajouter une catégorie (ex. Vidéo, Mariage, Immobilier…)

Crée un nouveau dossier dans `src/photos/` avec un `categorie.json` et des photos : un nouveau rectangle apparaît
sur l'accueil, avec sa page. Le champ `ordre` règle sa position. Pour masquer une catégorie sans la supprimer :
`"visible": false`.

## Préparer ses photos

- Exporte en JPG, **2500 px maximum** sur le grand côté, qualité 80–85 % (le site recrée ensuite les tailles adaptées).
- Le site supprime automatiquement les données EXIF/GPS des images affichées.
- Supprime les dossiers `exemple-…` quand tu as mis tes vraies photos.

## Modifier les informations générales

E-mail, Instagram, accroche et texte de présentation : fichier `src/site.ts`.
Couleurs : en haut du fichier `src/styles/global.css`.
Mentions légales (SIRET, adresse, hébergeur à compléter) : `src/pages/mentions-legales.astro`.

## Ajouter des photos sans ordinateur de développement

Sur github.com, ouvre le dossier voulu dans `src/photos/`, puis "Add file" → "Upload files" et glisse tes photos.
Pour créer un nouveau dossier, utilise "Add file" → "Create new file" et tape `nom-du-dossier/infos.json`.
Une fois le site relié à Netlify (voir plus bas), il se met à jour tout seul.

## Voir le site sur ton ordinateur

Il faut [Node.js](https://nodejs.org) (version 22 ou plus), puis dans un terminal, dans le dossier du site :

```
npm install
npm run dev
```

Le site s'ouvre sur http://localhost:4321 et se met à jour dès que tu ajoutes une photo.

## Mettre le site en ligne (Netlify, gratuit)

1. Crée un compte sur [netlify.com](https://www.netlify.com) avec ton compte GitHub.
2. "Add new site" → "Import an existing project" → choisis ce dépôt GitHub.
3. Les réglages sont déjà prêts (fichier `netlify.toml`) : clique sur "Deploy".
4. Ensuite, chaque photo ajoutée sur GitHub met le site à jour automatiquement en 1 à 2 minutes.
5. Achète ton nom de domaine (ex. `valg-studio.fr`), relie-le dans Netlify, et remplace l'adresse dans `astro.config.mjs`.
