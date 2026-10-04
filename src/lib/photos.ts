// Lit automatiquement le dossier src/photos :
//   src/photos/<categorie>/categorie.json        → titre, description, ordre, couverture
//   src/photos/<categorie>/*.jpg                 → "Sélection" (meilleures photos), affichée en premier
//   src/photos/<categorie>/<evenement>/*.jpg     → photos d'un événement
//   src/photos/<categorie>/<evenement>/infos.json → titre, date, lieu, description, videos
import type { ImageMetadata } from 'astro';

type CategorieInfos = {
  titre?: string;
  description?: string;
  ordre?: number;
  couverture?: string;
  visible?: boolean;
};

type EvenementInfos = {
  titre?: string;
  date?: string;
  lieu?: string;
  description?: string;
  ordre?: number;
  videos?: string[];
};

export type Photo = { image: ImageMetadata; nom: string };

export type Evenement = {
  slug: string;
  titre: string;
  date?: Date;
  lieu?: string;
  description?: string;
  ordre?: number;
  videos: string[];
  photos: Photo[];
};

export type Categorie = {
  slug: string;
  titre: string;
  description?: string;
  ordre: number;
  couverture?: ImageMetadata;
  selection: Photo[];
  evenements: Evenement[];
};

const ROOT = '/src/photos/';

const images = import.meta.glob<ImageMetadata>(
  '/src/photos/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true, import: 'default' },
);
const jsons = import.meta.glob<CategorieInfos & EvenementInfos>('/src/photos/**/*.json', {
  eager: true,
  import: 'default',
});

const joliTitre = (slug: string) => {
  const t = slug.replace(/[-_]+/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const parDate = (a: Evenement, b: Evenement) =>
  (a.ordre ?? Infinity) - (b.ordre ?? Infinity) ||
  (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) ||
  a.slug.localeCompare(b.slug, 'fr');

function construire(): Categorie[] {
  const categories = new Map<string, Categorie>();
  const obtenir = (slug: string) => {
    let c = categories.get(slug);
    if (!c) {
      c = { slug, titre: joliTitre(slug), ordre: 99, selection: [], evenements: [] };
      categories.set(slug, c);
    }
    return c;
  };
  const evenement = (cat: Categorie, slug: string) => {
    let e = cat.evenements.find((x) => x.slug === slug);
    if (!e) {
      e = { slug, titre: joliTitre(slug), videos: [], photos: [] };
      cat.evenements.push(e);
    }
    return e;
  };

  for (const [chemin, image] of Object.entries(images).sort(([a], [b]) => a.localeCompare(b, 'fr', { numeric: true }))) {
    const parts = chemin.slice(ROOT.length).split('/');
    const nom = parts[parts.length - 1];
    const cat = obtenir(parts[0]);
    if (parts.length === 2) cat.selection.push({ image, nom });
    else if (parts.length === 3) evenement(cat, parts[1]).photos.push({ image, nom });
  }

  const cachees = new Set<string>();
  for (const [chemin, infos] of Object.entries(jsons)) {
    const parts = chemin.slice(ROOT.length).split('/');
    if (parts.length === 2 && parts[1] === 'categorie.json') {
      const cat = obtenir(parts[0]);
      if (infos.visible === false) cachees.add(cat.slug);
      cat.titre = infos.titre ?? cat.titre;
      cat.description = infos.description;
      cat.ordre = infos.ordre ?? cat.ordre;
      if (infos.couverture) {
        const img = images[`${ROOT}${parts[0]}/${infos.couverture}`];
        if (img) cat.couverture = img;
        else console.warn(`[photos] Couverture introuvable pour "${parts[0]}" : ${infos.couverture}`);
      }
    } else if (parts.length === 3 && parts[2] === 'infos.json') {
      const ev = evenement(obtenir(parts[0]), parts[1]);
      ev.titre = infos.titre ?? ev.titre;
      ev.date = infos.date ? new Date(infos.date) : undefined;
      ev.lieu = infos.lieu;
      ev.description = infos.description;
      ev.ordre = infos.ordre;
      ev.videos = (infos.videos ?? []).filter(Boolean);
    }
  }

  return [...categories.values()]
    .filter((c) => !cachees.has(c.slug))
    .map((c) => {
      c.evenements = c.evenements.filter((e) => e.photos.length || e.videos.length).sort(parDate);
      c.couverture ??= c.selection[0]?.image ?? c.evenements.find((e) => e.photos.length)?.photos[0].image;
      return c;
    })
    .filter((c) => c.selection.length || c.evenements.length)
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
