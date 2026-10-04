// Lit automatiquement le dossier src/photos :
//   src/photos/<categorie>/categorie.json           → titre, description, ordre, couverture, titreSeo, descriptionSeo
//   src/photos/<categorie>/*.jpg                    → photos affichées directement sur la page de l'univers
//   src/photos/<categorie>/<sous-partie>/*.jpg      → photos d'une sous-partie (un carré sur la page de l'univers)
//   src/photos/<categorie>/<sous-partie>/infos.json → titre, lieu, date, description, ordre, couverture, videos
import type { ImageMetadata } from 'astro';

type CategorieInfos = {
  titre?: string;
  description?: string;
  ordre?: number;
  couverture?: string;
  visible?: boolean;
  titreSeo?: string;
  descriptionSeo?: string;
};

type SousCategorieInfos = CategorieInfos & {
  date?: string;
  lieu?: string;
  videos?: string[];
};

export type Photo = { image: ImageMetadata; nom: string; alt?: string };

export type SousCategorie = {
  slug: string;
  titre: string;
  date?: Date;
  lieu?: string;
  description?: string;
  titreSeo?: string;
  descriptionSeo?: string;
  ordre?: number;
  couverture?: ImageMetadata;
  videos: string[];
  photos: Photo[];
};

export type Categorie = {
  slug: string;
  titre: string;
  description?: string;
  titreSeo?: string;
  descriptionSeo?: string;
  ordre: number;
  couverture?: ImageMetadata;
  /** Photos posées directement dans le dossier de l'univers. */
  photos: Photo[];
  sousCategories: SousCategorie[];
};

const ROOT = '/src/photos/';

const images = import.meta.glob<ImageMetadata>(
  '/src/photos/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true, import: 'default' },
);
const jsons = import.meta.glob<SousCategorieInfos>('/src/photos/**/*.json', {
  eager: true,
  import: 'default',
});

const joliTitre = (slug: string) => {
  const t = slug.replace(/[-_]+/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

// "02-stade-sm-caen.jpg" → "Stade sm caen" ; "01.jpg" → rien (nom sans description).
const altDepuisNom = (nom: string) => {
  const t = nom.replace(/\.[^.]+$/, '').replace(/^[\d\s_-]+/, '');
  return t ? joliTitre(t) : undefined;
};

const trier = (a: SousCategorie, b: SousCategorie) =>
  (a.ordre ?? Infinity) - (b.ordre ?? Infinity) ||
  (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) ||
  a.slug.localeCompare(b.slug, 'fr');

const couvertureDepuis = (dossier: string, fichier: string | undefined) => {
  if (!fichier) return undefined;
  const img = images[`${ROOT}${dossier}/${fichier}`];
  if (!img) console.warn(`[photos] Couverture introuvable dans "${dossier}" : ${fichier}`);
  return img;
};

function construire(): Categorie[] {
  const categories = new Map<string, Categorie>();
  const obtenir = (slug: string) => {
    let c = categories.get(slug);
    if (!c) {
      c = { slug, titre: joliTitre(slug), ordre: 99, photos: [], sousCategories: [] };
      categories.set(slug, c);
    }
    return c;
  };
  const sousCategorie = (cat: Categorie, slug: string) => {
    let s = cat.sousCategories.find((x) => x.slug === slug);
    if (!s) {
      s = { slug, titre: joliTitre(slug), videos: [], photos: [] };
      cat.sousCategories.push(s);
    }
    return s;
  };

  for (const [chemin, image] of Object.entries(images).sort(([a], [b]) => a.localeCompare(b, 'fr', { numeric: true }))) {
    const parts = chemin.slice(ROOT.length).split('/');
    const nom = parts[parts.length - 1];
    const photo = { image, nom, alt: altDepuisNom(nom) };
    if (parts.length === 2) obtenir(parts[0]).photos.push(photo);
    else if (parts.length === 3) sousCategorie(obtenir(parts[0]), parts[1]).photos.push(photo);
  }

  const cachees = new Set<string>();
  for (const [chemin, infos] of Object.entries(jsons)) {
    const parts = chemin.slice(ROOT.length).split('/');
    if (parts.length === 2 && parts[1] === 'categorie.json') {
      const cat = obtenir(parts[0]);
      if (infos.visible === false) cachees.add(cat.slug);
      cat.titre = infos.titre ?? cat.titre;
      cat.description = infos.description;
      cat.titreSeo = infos.titreSeo;
      cat.descriptionSeo = infos.descriptionSeo;
      cat.ordre = infos.ordre ?? cat.ordre;
      cat.couverture = couvertureDepuis(parts[0], infos.couverture);
    } else if (parts.length === 3 && parts[2] === 'infos.json') {
      const cat = obtenir(parts[0]);
      const s = sousCategorie(cat, parts[1]);
      if (infos.visible === false) cachees.add(`${cat.slug}/${s.slug}`);
      s.titre = infos.titre ?? s.titre;
      s.date = infos.date ? new Date(infos.date) : undefined;
      s.lieu = infos.lieu;
      s.description = infos.description;
      s.titreSeo = infos.titreSeo;
      s.descriptionSeo = infos.descriptionSeo;
      s.ordre = infos.ordre;
      s.videos = (infos.videos ?? []).filter(Boolean);
      s.couverture = couvertureDepuis(`${parts[0]}/${parts[1]}`, infos.couverture);
    }
  }

  return [...categories.values()]
    .filter((c) => !cachees.has(c.slug))
    .map((c) => {
      c.sousCategories = c.sousCategories.filter((s) => !cachees.has(`${c.slug}/${s.slug}`)).sort(trier);
      for (const s of c.sousCategories) s.couverture ??= s.photos[0]?.image;
      c.couverture ??= c.photos[0]?.image ?? c.sousCategories.find((s) => s.couverture)?.couverture;
      return c;
    })
    .sort((a, b) => a.ordre - b.ordre || a.titre.localeCompare(b.titre, 'fr'));
}

export const categories = construire();

export const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);

// Transforme un lien YouTube ou Vimeo en lien intégrable.
export function lienVideo(url: string): string {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?dnt=1`;
  return url;
}
