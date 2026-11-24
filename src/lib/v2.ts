// Données de la refonte (v2) : la liste à plat des projets, tirée du dossier src/photos.
import type { ImageMetadata } from 'astro';
import { categories, type Photo } from './photos';

export type Projet = {
  id: string;
  titre: string;
  categorie: string;
  catSlug: string;
  lieu?: string;
  couverture: ImageMetadata;
  photos: Photo[];
};

export const projets: Projet[] = categories.flatMap((c) => {
  const liste: Projet[] = c.sousCategories
    .filter((s) => s.photos.length > 0)
    .map((s) => ({
      id: `${c.slug}-${s.slug}`,
      titre: s.titre,
      categorie: c.titre,
      catSlug: c.slug,
      lieu: s.lieu,
      couverture: s.couverture ?? s.photos[0].image,
      photos: s.photos,
    }));
  // Univers sans sous-partie (ex. Portrait) : il compte comme un projet.
  if (c.photos.length > 0) {
    liste.push({
      id: c.slug,
      titre: c.titre,
      categorie: c.titre,
      catSlug: c.slug,
      couverture: c.couverture ?? c.photos[0].image,
      photos: c.photos,
    });
  }
  return liste;
});

export const univers = categories
  .map((c) => {
    const siens = projets.filter((p) => p.catSlug === c.slug);
    return {
      slug: c.slug,
      titre: c.titre,
      // Textes écrits dans src/photos/<collection>/categorie.json
      description: c.description,
      titreSeo: c.titreSeo,
      descriptionSeo: c.descriptionSeo,
      nb: siens.reduce((n, p) => n + p.photos.length, 0),
      couverture: c.couverture ?? siens[0]?.couverture,
      projets: siens,
    };
  })
  .filter((u) => u.nb > 0);

/** Adresse d'une collection : sa page, ou directement son projet quand elle n'en contient qu'un (pas d'étape pour rien). */
export const adresseCollection = (u: { slug: string; projets: Projet[] }) =>
  u.projets.length === 1 ? `/projet/${u.projets[0].id}/` : `/collection/${u.slug}/`;

export const totalPhotos = projets.reduce((n, p) => n + p.photos.length, 0);

/** Variation pseudo-aléatoire stable, entre -1 et 1, pour désordonner l'anneau sans hasard au rechargement. */
export const alea = (i: number, graine: number) => {
  const x = Math.sin((i + 1) * 127.1 + graine * 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

export const deuxChiffres = (n: number) => String(n).padStart(2, '0');
