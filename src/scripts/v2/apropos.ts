// Page « À propos » : le récit au défilement.
// Les scènes sont épinglées en CSS (position: sticky, voir v2-apropos.css) ; ce script lit seulement l'avancement
// du défilement dans chaque scène et règle quelques variables. Rien ici ne change la hauteur de la page.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const html = document.documentElement;
const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const borne = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
/** Part de 0 quand p vaut a, arrive à 1 quand p vaut b. */
const etale = (p: number, a: number, b: number) => borne((p - a) / (b - a), 0, 1);
const doux = gsap.parseEase('power2.inOut');
const sortie = gsap.parseEase('power3.out');
const entree = gsap.parseEase('power2.in');
const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

let parti = false;

/* ───────── La barre suit le ton de ce qui passe sous elle (papier ou nuit) ───────── */
let zones: HTMLElement[] = [];
function majTon() {
  if (parti) return;
  let ton = 'papier';
  for (const z of zones) {
    const r = z.getBoundingClientRect();
    if (r.top <= 44 && r.bottom > 44) { ton = z.dataset.apTon ?? 'papier'; break; }
  }
  if (html.dataset.scene !== ton) html.dataset.scene = ton;
}

/* ───────── Départ vers un projet : le papier s'effondre sur la photo choisie (même passage que sur l'accueil) ───────── */
function partir(el: HTMLElement, url: string) {
  if (parti) return;
  const page = $('.page');
  const r = el.getBoundingClientRect();
  const cx = borne(r.left + r.width / 2, 0, innerWidth), cy = borne(r.top + r.height / 2, 0, innerHeight);
  try { sessionStorage.setItem('valg-arrivee', JSON.stringify({ x: cx / innerWidth, y: cy / innerHeight })); } catch { /* navigation privée */ }
  if (calme || !page) { location.href = url; return; }
  parti = true;
  (window as unknown as { valgDefile?: { stop: () => void } }).valgDefile?.stop();
  html.dataset.scene = 'nuit';
  const haut = page.getBoundingClientRect().top;
  const o = { r: Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 40 };
  gsap.to(o, {
    r: 0, duration: 0.95, ease: 'expo.in',
    onUpdate: () => { page.style.clipPath = `circle(${o.r.toFixed(1)}px at ${cx.toFixed(1)}px ${(cy - haut).toFixed(1)}px)`; },
    onComplete: () => { location.href = url; },
  });
}

/* ───────── Compteur à rouleaux (même réglage que dans site.ts) ───────── */
function regleCompteur(el: HTMLElement | null, n: number) {
  if (!el) return;
  const rubans = $$('.cpt__ruban', el);
  const texte = String(n).padStart(rubans.length, '0').slice(-rubans.length);
  rubans.forEach((r, k) => {
    r.style.transitionDelay = `${k * 70}ms`;
    r.style.transform = `translateY(-${Number(texte[k]) * 10}%)`;
  });
  const lu = $('[data-cpt-txt]', el);
  if (lu) lu.textContent = String(n);
}

/* ───────── 1. Le terrain : la fenêtre s'ouvre jusqu'à remplir l'écran ───────── */
function initTerrain() {
  const section = $('[data-ap-terrain]');
  const fixe = section && $('[data-ap-fixe]', section);
  if (!section || !fixe) return;
  ScrollTrigger.create({
    trigger: section, start: 'top top', end: 'bottom bottom',
    onUpdate: (st) => {
      const p = st.progress;
      const o = doux(etale(p, 0.04, 0.6));
      fixe.style.setProperty('--o', o.toFixed(4));
      fixe.style.setProperty('--s', sortie(etale(p, 0.64, 0.84)).toFixed(3));
      section.dataset.apTon = o > 0.9 ? 'nuit' : 'papier';
      majTon();
    },
  });
}

/* ───────── 2. L'instant : une image par cran de défilement, un coup d'obturateur entre deux ───────── */
function initInstant() {
  const section = $('[data-ap-instant]');
  const fixe = section && $('[data-ap-fixe]', section);
  if (!section || !fixe) return;
  const vues = $$('[data-ap-vue]', fixe), mots = $$('[data-ap-mot]', fixe), lames = $$('[data-ap-lame]', fixe);
  const cadre = $('[data-ap-cadre]', fixe), chute = $('[data-ap-chute]', fixe), papier = $('[data-ap-papier]', fixe);
  const ou = $('[data-ap-ou]', fixe), rang = $('[data-ap-rang]', fixe);
  if (!vues.length || !cadre || !papier) return;
  const N = vues.length;
  let courant = 0, ferme = false;

  const montrer = (i: number, anime = true) => {
    vues.forEach((v, k) => v.classList.toggle('est-la', k === i));
    mots.forEach((m, k) => m.classList.toggle('est-la', k === i));
    if (ou) ou.textContent = vues[i].dataset.nom ?? '';
    regleCompteur(rang, i + 1);
    const lettre = mots[i] && $('b span', mots[i]);
    if (lettre && anime) gsap.fromTo(lettre, { yPercent: 108 }, { yPercent: 0, duration: 0.6, ease: 'power4.out', overwrite: true });
  };
  // Les lames se ferment, l'image change dans le noir, elles se rouvrent.
  const declencher = (i: number) => {
    courant = i;
    gsap.killTweensOf([lames, cadre]);
    gsap.timeline()
      .to(lames, { scaleY: 1, duration: 0.07, ease: 'power2.in' })
      .add(() => montrer(i))
      .to(lames, { scaleY: 0, duration: 0.26, ease: 'power3.out' });
    gsap.fromTo(cadre, { scale: 1.022 }, { scale: 1, duration: 0.5, ease: 'power3.out' });
  };
  // Après la dernière image, l'obturateur reste fermé : il ne reste que la phrase.
  const fermer = (f: boolean) => {
    ferme = f;
    fixe.classList.toggle('est-ferme', f);
    gsap.killTweensOf([lames, chute]);
    if (f) {
      // Une fois les lames jointes, le cadre s'éteint pour de bon : il ne reste aucun liseré autour.
      gsap.to(lames, { scaleY: 1, duration: 0.16, ease: 'power2.in', onComplete: () => fixe.classList.add('est-eteint') });
      gsap.fromTo(chute, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.14 });
    } else {
      fixe.classList.remove('est-eteint');
      gsap.to(chute, { opacity: 0, duration: 0.2 });
      gsap.to(lames, { scaleY: 0, duration: 0.3, ease: 'power3.out' });
    }
  };

  ScrollTrigger.create({
    trigger: section, start: 'top top', end: 'bottom bottom',
    onUpdate: (st) => {
      const p = st.progress;
      const i = borne(Math.floor(etale(p, 0.02, 0.7) * N), 0, N - 1);
      const f = p > 0.72;
      if (f !== ferme) {
        if (!f && i !== courant) { courant = i; montrer(i, false); }
        fermer(f);
      } else if (!f && i !== courant) declencher(i);
      // Le papier revient par le centre.
      const e = entree(etale(p, 0.86, 0.995));
      const max = Math.hypot(innerWidth, innerHeight) / 2 + 30;
      papier.style.setProperty('--rayon', `${(e * max).toFixed(1)}px`);
      // La barre (en haut, au centre) repasse au papier quand le cercle l'a recouverte.
      section.dataset.apTon = e * max > innerHeight / 2 - 40 ? 'papier' : 'nuit';
      majTon();
    },
  });
}

/* ───────── 4. La lumière : le papier se referme sur un point, la lumière rouvre les photos depuis leur source ───────── */
function initLumiere() {
  const section = $('[data-ap-lumiere]');
  const fixe = section && $('[data-ap-fixe]', section);
  if (!section || !fixe) return;
  const papier = $('[data-ap-papier]', fixe), txt = $('[data-ap-txt]', fixe), cadre = $('[data-ap-cadre]', fixe);
  const vues = $$('[data-ap-vue]', fixe), sources = $$('[data-ap-source]', fixe);
  if (!papier || !cadre || !vues.length) return;
  const geo = { cx: 0, cy: 0, grand: 0, barre: 0, rayons: [] as number[] };
  const mesurer = () => {
    const f = fixe.getBoundingClientRect(), c = cadre.getBoundingClientRect();
    const loin = (x: number, y: number, w: number, h: number) => Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
    geo.rayons = vues.map((v) => loin((Number(v.dataset.ox) / 100) * c.width, (Number(v.dataset.oy) / 100) * c.height, c.width, c.height) + 4);
    // Le point où le papier disparaît : la source de lumière de la première photo.
    geo.cx = c.left - f.left + (Number(vues[0].dataset.ox) / 100) * c.width;
    geo.cy = c.top - f.top + (Number(vues[0].dataset.oy) / 100) * c.height;
    geo.grand = loin(geo.cx, geo.cy, f.width, f.height) + 30;
    // Rayon en dessous duquel le papier ne passe plus sous la barre (en haut de l'écran, au centre).
    geo.barre = Math.hypot(geo.cx - f.width / 2, geo.cy - 40);
    papier.style.setProperty('--cx', `${geo.cx.toFixed(1)}px`);
    papier.style.setProperty('--cy', `${geo.cy.toFixed(1)}px`);
  };
  mesurer();
  ScrollTrigger.addEventListener('refreshInit', mesurer);
  const debuts = [0.24, 0.48, 0.72];
  let allumee = -2;

  ScrollTrigger.create({
    trigger: section, start: 'top top', end: 'bottom bottom',
    onRefresh: mesurer,
    onUpdate: (st) => {
      const p = st.progress;
      const r = geo.grand * (1 - doux(etale(p, 0.02, 0.2)));
      papier.style.setProperty('--rayon', `${r.toFixed(1)}px`);
      papier.style.visibility = r <= 0.5 ? 'hidden' : '';
      if (txt) txt.style.opacity = etale(p, 0.15, 0.23).toFixed(3);
      let derniere = -1;
      vues.forEach((v, k) => {
        const e = etale(p, debuts[k] ?? 1, (debuts[k] ?? 1) + 0.2);
        v.style.setProperty('--rayon', `${(sortie(e) * geo.rayons[k]).toFixed(1)}px`);
        if (e > 0.12) derniere = k;
      });
      if (derniere !== allumee) {
        allumee = derniere;
        sources.forEach((s, k) => s.classList.toggle('est-la', k === derniere));
      }
      section.dataset.apTon = r > geo.barre ? 'papier' : 'nuit';
      majTon();
    },
  });
}

/* ───────── 5. Le bruit : les lettres du titre ondulent, d'autant plus fort qu'on défile vite ───────── */
function initBruit() {
  const el = $('[data-ap-egal]');
  if (!el) return;
  const texte = el.textContent ?? '';
  el.setAttribute('aria-label', texte);
  el.textContent = '';
  const lettres = [...texte].map((c) => {
    const i = document.createElement('i');
    i.textContent = c === ' ' ? ' ' : c;
    i.setAttribute('aria-hidden', 'true');
    el.appendChild(i);
    return i;
  });
  let visible = false, force = 0.2, dernier = scrollY;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '10% 0px' }).observe(el);
  gsap.ticker.add((t) => {
    const vitesse = Math.abs(scrollY - dernier);
    dernier = scrollY;
    if (!visible) return;
    force += (borne(vitesse / 26, 0.16, 1) - force) * 0.07;
    lettres.forEach((l, k) => l.style.setProperty('--wdth', (93.5 + 31.5 * force * Math.sin(t * 5.4 + k * 1.15)).toFixed(1)));
  });
}

/* ───────── Photos : celles qui dérivent, celles qui se lèvent ───────── */
function initPhotos() {
  $$('[data-ap-derive]').forEach((el) => {
    const v = Number(el.dataset.apDerive) || 80;
    gsap.fromTo(el, { y: v }, { y: -v, ease: 'none', scrollTrigger: { trigger: el.closest('section') ?? el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // Un rideau qui se lève : la photo se découvre de bas en haut pendant qu'elle se resserre légèrement. Ni flou ni fondu.
  $$('[data-ap-leve]').forEach((el) => {
    const img = $('img', el);
    const declencheur = { trigger: el, start: 'top 90%' };
    gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'power4.out', scrollTrigger: declencheur, onComplete: () => { el.style.clipPath = ''; } });
    if (img) gsap.fromTo(img, { scale: 1.2 }, { scale: 1, duration: 1.6, ease: 'power3.out', scrollTrigger: declencheur, onComplete: () => { img.style.transform = ''; img.style.scale = ''; } });
  });
}

function init() {
  const page = $('[data-page="a-propos"]');
  if (!page) return;
  // Toute photo qui mène à un projet part en implosion, comme sur l'accueil.
  $$<HTMLAnchorElement>('a[data-vers-projet]', page).forEach((a) =>
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      partir(a, a.href);
    }),
  );
  if (calme) return;
  zones = $$('[data-ap-ton]', page);
  initTerrain();
  initInstant();
  initLumiere();
  initBruit();
  initPhotos();
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: majTon, onRefresh: majTon });
  ScrollTrigger.refresh();
  majTon();
}

// Une fois les polices prêtes et le script commun passé (il découpe les textes), pour mesurer des positions justes.
document.fonts.ready.then(() => requestAnimationFrame(init));
