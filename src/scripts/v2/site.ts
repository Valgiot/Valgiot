// Comportements de la refonte (v2) : défilement adouci, curseur, barre, boutons aimantés,
// récit de l'accueil, anneau 3D, implosion vers le noir, mur calme et visionneuse.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger, SplitText);

const html = document.documentElement;
const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sourisFine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const mod = (a: number, n: number) => ((a % n) + n) % n;
const borne = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
// Hasard reproductible entre -1 et 1 : le même désordre à chaque visite.
const alea = (i: number, graine: number) => { const x = Math.sin((i + 1) * 127.1 + graine * 311.7) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };
const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const memo = {
  lire: (cle: string) => { try { return sessionStorage.getItem(cle); } catch { return null; } },
  ecrire: (cle: string, v: string) => { try { sessionStorage.setItem(cle, v); } catch { /* navigation privée */ } },
  oter: (cle: string) => { try { sessionStorage.removeItem(cle); } catch { /* idem */ } },
};

/* ───────── Défilement adouci ───────── */
let lenis: Lenis | undefined;
if (!calme) {
  lenis = new Lenis({ lerp: 0.11 });
  lenis.on('scroll', ScrollTrigger.update);
  // Quand les sections épinglées changent la hauteur de la page, le défilement adouci doit reprendre ses mesures,
  // sinon il s'arrête avant la fin de la page.
  ScrollTrigger.addEventListener('refresh', () => lenis!.resize());
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  // Accès de mise au point : permet d'aller à un endroit précis de la page depuis la console.
  (window as unknown as { valgDefile?: Lenis }).valgDefile = lenis;
}

/* ───────── Page prête ─────────
   Les passages d'arrivée (le papier qui renaît, l'onde) attendent que la page soit installée (polices, sections, mesures)
   et affichée : ils partent alors sans à-coup. Au plus tard 1,2 s après l'arrivée, pour ne jamais faire attendre. */
let signalerPrete: () => void = () => undefined;
const pagePrete = new Promise<void>((ok) => { signalerPrete = ok; window.setTimeout(ok, 1200); });
pagePrete.then(() => html.classList.remove('attend-page')); // les animations d'arrivée en CSS (volets, porte) partent à ce moment

/* ───────── Économies : ce qui n'est pas à l'écran ne travaille pas ───────── */
// Suit la présence d'un élément à l'écran. Hors de l'écran, il reçoit la classe « au-repos » (ses animations sans fin s'arrêtent)
// et les boucles qui le dessinent peuvent se taire.
function suivreVue(el: Element) {
  const etat = { vu: true };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { etat.vu = e.isIntersecting; el.classList.toggle('au-repos', !etat.vu); }, { rootMargin: '10% 0px' }).observe(el);
  }
  return etat;
}
// Téléphone ou tablette : pas de souris, un écran plus modeste. Certains effets coûteux y sont allégés.
const tactile = !sourisFine;

/* ───────── Compteur à rouleaux ───────── */
function regleCompteur(el: HTMLElement | null | undefined, n: number) {
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

/* ───────── Curseur : il reste toujours le même petit viseur. Un cadre à part se pose sur les images. ───────── */
function initCurseur() {
  const vis = $('.vis'), cadrage = $('.cadrage');
  if (!vis || !sourisFine || calme) return;
  const legende = cadrage ? $('.cadrage__txt', cadrage) : null;
  let mx = -100, my = -100, cible: HTMLElement | null = null, etat = 'libre';
  const c = { x: -100, y: -100 };
  const k = { x: 0, y: 0, w: 0, h: 0 };
  let cadrePose = false;
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    mx = e.clientX; my = e.clientY;
    html.classList.add('vis-on');
    const t = e.target as HTMLElement | null;
    const image = t?.closest?.<HTMLElement>('[data-cadre]') ?? null;
    const lien = image ? null : t?.closest?.<HTMLElement>('a, button, [role="button"]') ?? null;
    const neuf = image ? 'image' : lien ? 'lien' : 'libre';
    if (neuf !== etat) { etat = neuf; vis.dataset.etat = neuf; }
    if (image !== cible) {
      cible = image;
      if (legende) legende.textContent = image?.dataset.legende ?? '';
      if (image && !cadrePose) {
        // Le cadre part du curseur : il s'ouvre depuis l'endroit où est la souris.
        k.x = mx; k.y = my; k.w = 0; k.h = 0;
      }
    }
  }, { passive: true });
  document.addEventListener('mouseleave', () => html.classList.remove('vis-on'));
  gsap.ticker.add(() => {
    c.x += (mx - c.x) * 0.55; c.y += (my - c.y) * 0.55;
    vis.style.setProperty('--x', `${c.x.toFixed(1)}px`);
    vis.style.setProperty('--y', `${c.y.toFixed(1)}px`);
    if (!cadrage) return;
    let pose = false;
    if (cible?.isConnected) {
      const r = cible.getBoundingClientRect();
      const dedans = mx >= r.left - 10 && mx <= r.right + 10 && my >= r.top - 10 && my <= r.bottom + 10;
      const g = Math.max(r.left - 8, 6), h = Math.max(r.top - 8, 6);
      const d = Math.min(r.right + 8, innerWidth - 6), b = Math.min(r.bottom + 8, innerHeight - 6);
      if (dedans && d - g > 24 && b - h > 24) {
        pose = true;
        k.x += (g - k.x) * 0.2; k.y += (h - k.y) * 0.2; k.w += (d - g - k.w) * 0.2; k.h += (b - h - k.h) * 0.2;
        cadrage.style.setProperty('--x', `${k.x.toFixed(1)}px`);
        cadrage.style.setProperty('--y', `${k.y.toFixed(1)}px`);
        cadrage.style.setProperty('--w', `${k.w.toFixed(1)}px`);
        cadrage.style.setProperty('--h', `${k.h.toFixed(1)}px`);
      } else cible = null;
    }
    if (pose !== cadrePose) { cadrePose = pose; cadrage.classList.toggle('est-la', pose); }
  });
}

/* ───────── Boutons (encre) et liens ───────── */
function initBoutons() {
  $$('[data-aimant]').forEach((b) => {
    const placer = (e: PointerEvent) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(1)}px`);
      b.style.setProperty('--my', `${(e.clientY - r.top).toFixed(1)}px`);
      return r;
    };
    // Les boutons ne suivent plus la souris (demande de Lélio, 16/11/2026) : seule l'encre part de l'endroit où elle entre
    // et de celui où elle sort.
    b.addEventListener('pointerenter', placer);
    b.addEventListener('pointermove', placer);
    b.addEventListener('pointerleave', placer);
  });
  $$('.lien').forEach((l) =>
    l.addEventListener('pointerenter', (e) => {
      const r = l.getBoundingClientRect();
      l.style.setProperty('--origine', e.clientX - r.left < r.width / 2 ? 'right' : 'left');
    }),
  );
  // Démonstration du compteur (page Atelier).
  $$('[data-cpt-pas]').forEach((b) =>
    b.addEventListener('click', () => {
      const el = $(b.dataset.cptCible ?? '');
      if (!el) return;
      const max = Number(el.dataset.max) || 99;
      const ici = Number($('[data-cpt-txt]', el)?.textContent) || 1;
      regleCompteur(el, mod(ici - 1 + Number(b.dataset.cptPas), max) + 1);
    }),
  );
}

/* ───────── Barre vivante ───────── */
function initBarre() {
  const barre = $('[data-barre]');
  if (!barre) return;
  const bouton = $('.barre__menu', barre)!, panneau = $('.barre__panneau', barre)!, cartes = $$('.carte-menu', barre);
  let ouvert = false, dernier = scrollY;
  const ouvrir = (o: boolean) => {
    ouvert = o;
    bouton.setAttribute('aria-expanded', String(o));
    barre.classList.remove('est-compacte');
    gsap.killTweensOf([panneau, ...cartes]);
    if (o) {
      barre.dataset.ouvert = 'oui';
      gsap.to(panneau, { height: 'auto', duration: calme ? 0 : 0.75, ease: 'power4.out' });
      gsap.fromTo(cartes, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: calme ? 0 : 0.7, ease: 'power3.out', stagger: 0.07, delay: 0.06 });
    } else {
      // Fermeture en fondu, comme l'ouverture à l'envers : les cartes s'effacent l'une après l'autre, puis le panneau se replie.
      // La barre garde son fond jusqu'au bout (elle ne devient pas transparente d'un coup).
      gsap.to(cartes, { y: 18, opacity: 0, duration: calme ? 0 : 0.42, ease: 'power2.in', stagger: { each: 0.05, from: 'end' } });
      gsap.to(panneau, { height: 0, duration: calme ? 0 : 0.6, ease: 'power3.inOut', delay: calme ? 0 : 0.2, onComplete: () => { barre.dataset.ouvert = 'non'; } });
    }
  };
  bouton.addEventListener('click', () => ouvrir(!ouvert));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && ouvert) ouvrir(false); });
  document.addEventListener('pointerdown', (e) => { if (ouvert && !barre.contains(e.target as Node)) ouvrir(false); });
  panneau.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) ouvrir(false); });
  // Elle ne disparaît jamais : elle se resserre quand on descend, et se rallonge :
  // - tout en haut de la page ;
  // - au survol de la souris (ou d'un toucher sur la barre, sur téléphone) ;
  // - quand on remonte, mais seulement hors des scènes animées (sections épinglées : anneau, défilé, films…),
  //   où l'on remonte souvent pour rejouer l'animation sans vouloir le menu.
  const HAUT = 80;
  let survolee = false;
  const enScene = () => ScrollTrigger.getAll().some((st) => st.pin && st.isActive);
  const resserrer = () => { if (!ouvert && scrollY > HAUT) barre.classList.add('est-compacte'); };
  barre.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    survolee = true;
    barre.classList.remove('est-compacte');
  });
  barre.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    survolee = false;
    resserrer();
  });
  barre.addEventListener('click', (e) => {
    if (!barre.classList.contains('est-compacte') || (e.target as HTMLElement).closest('a, button')) return;
    barre.classList.remove('est-compacte');
  });
  addEventListener('scroll', () => {
    const y = scrollY;
    if (ouvert || survolee) { dernier = y; return; }
    if (y <= HAUT) { barre.classList.remove('est-compacte'); dernier = y; return; }
    if (Math.abs(y - dernier) < 8) return;
    if (y > dernier) barre.classList.add('est-compacte');
    else if (!enScene()) barre.classList.remove('est-compacte');
    dernier = y;
  }, { passive: true });
  // La barre épouse son contenu, ouverte comme resserrée : pas de grand vide entre le logo et le reste.
  // - ouverte (grand écran) : logo, un écart normal, les liens, l'heure, le bouton ;
  // - resserrée (partout) : logo, un écart normal, le bouton.
  // Ses largeurs sont mesurées (et non « automatiques ») pour qu'elle puisse toujours glisser en douceur de l'une à l'autre.
  const rang = $('.barre__rang', barre), logo = $('.barre__logo', barre), liens = $('.barre__liens', barre), zoneHeure = $('.barre__heure', barre);
  const ECART = 28, ECART_SERRE = 24; // entre le logo et ce qui le suit
  const epouser = () => {
    if (!rang || !logo || !liens || !zoneHeure) return;
    const r = getComputedStyle(rang), h = getComputedStyle(zoneHeure), espace = parseFloat(r.columnGap) || 0;
    const tel = getComputedStyle(liens).display === 'none'; // téléphone : ni liens ni heure dans la barre
    const bords = (parseFloat(r.paddingLeft) || 0) + (parseFloat(r.paddingRight) || 0) + 2;
    // Vide visible entre le logo et le bouton : ECART_SERRE + un espacement (les liens repliés, de largeur nulle, sont dans ce vide).
    const serree = bords + logo.offsetWidth + ECART_SERRE + bouton.offsetWidth + espace;
    let large = '';
    if (!tel) {
      // L'heure perd ses marges intérieures (12 px de chaque côté) quand la barre est resserrée : on les compte toujours.
      const heureLarge = zoneHeure.scrollWidth - (parseFloat(h.paddingLeft) || 0) - (parseFloat(h.paddingRight) || 0) + 24;
      large = `${Math.ceil(bords + logo.offsetWidth + ECART + liens.scrollWidth + heureLarge + bouton.offsetWidth + espace * 3)}px`;
    }
    const s = `${Math.ceil(serree)}px`;
    if (barre.style.getPropertyValue('--barre-large') === large && barre.style.getPropertyValue('--barre-serree') === s) return;
    const transition = barre.style.transition;
    barre.style.transition = 'none'; // un simple réglage : la barre ne doit pas glisser pour ça
    if (large) barre.style.setProperty('--barre-large', large); else barre.style.removeProperty('--barre-large'); // téléphone : pleine largeur
    barre.style.setProperty('--barre-serree', s);
    void barre.offsetWidth;
    barre.style.transition = transition;
  };
  epouser();
  document.fonts.ready.then(epouser);
  let attenteBarre = 0;
  addEventListener('resize', () => { clearTimeout(attenteBarre); attenteBarre = window.setTimeout(epouser, 150); });
  const heure = $('[data-heure]', barre);
  const format = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
  const tictac = () => {
    if (!heure) return;
    const [h, m] = format.format(new Date()).split(':');
    heure.innerHTML = `${h}<i>:</i>${m}`;
  };
  tictac();
  setInterval(tictac, 15000);
  $$<HTMLAnchorElement>('.pastille', barre).forEach((a) => {
    const u = new URL(a.href);
    if (!u.hash && u.pathname === location.pathname) a.setAttribute('aria-current', 'page');
  });
}

/* ───────── Départ vers un projet : le papier s'effondre sur l'image choisie, il ne reste que le noir ───────── */
let parti = false;
function partir(el: HTMLElement, url: string, avant?: gsap.core.Timeline) {
  if (parti) return;
  parti = true;
  const r = el.getBoundingClientRect();
  const cx = borne(r.left + r.width / 2, 0, innerWidth), cy = borne(r.top + r.height / 2, 0, innerHeight);
  memo.ecrire('valg-arrivee', JSON.stringify({ x: cx / innerWidth, y: cy / innerHeight }));
  const page = $('.page');
  if (calme || !page) { location.href = url; return; }
  lenis?.stop();
  html.dataset.scene = 'nuit';
  const haut = page.getBoundingClientRect().top;
  const o = { r: Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 40 };
  const tl = gsap.timeline({ onComplete: () => { location.href = url; } });
  tl.to(o, { r: 0, duration: 0.95, ease: 'expo.in', onUpdate: () => { page.style.clipPath = `circle(${o.r.toFixed(1)}px at ${cx.toFixed(1)}px ${(cy - haut).toFixed(1)}px)`; } }, 0);
  if (avant) tl.add(avant, 0);
}

/* ───────── Accueil : le récit au défilement ───────── */
function initAccueil() {
  const ciel = $('[data-ciel]');
  if (!ciel) return;

  // Toute image qui mène à un projet déclenche l'implosion.
  $$<HTMLAnchorElement>('[data-vers-projet]').forEach((a) =>
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      partir(a, a.href);
    }),
  );
  if (calme) return;

  /* Acte 1 — Le ciel. Le nom rétrécit jusqu'à devenir le logo de la barre ; les photos s'envolent, les proches plus vite. */
  const noms = $$('[data-nom]', ciel), nom = noms[0], devant = $('[data-nom-devant]', ciel), logo = $('.barre__logo');
  const photos = $$('.ciel__photo', ciel);
  html.classList.add('nom-libre');
  const amarre = () => {
    if (!logo) return { x: 0, y: -innerHeight * 0.4, s: 0.1 };
    const l = logo.getBoundingClientRect(), n = nom.getBoundingClientRect();
    // La barre est centrée dans la largeur utile de la fenêtre, sans la barre de défilement (visible sur ordinateur avec une souris) :
    // compter cette dernière décalait le nom de quelques pixels, et il sautait à l'apparition de la barre.
    const utile = document.documentElement.clientWidth;
    const barre = logo.closest<HTMLElement>('.barre'), rang = barre ? $('.barre__rang', barre) : null;
    // Largeur de la barre resserrée (mesurée sur son contenu, voir « épouser » dans la barre).
    const large = Math.min(parseFloat(barre ? getComputedStyle(barre).getPropertyValue('--barre-serree') : '') || 250, utile - 24);
    // Du bord de la barre au début du logo : son contour, puis sa marge intérieure.
    const avantLogo = (barre ? parseFloat(getComputedStyle(barre).borderLeftWidth) || 0 : 1) + (rang ? parseFloat(getComputedStyle(rang).paddingLeft) || 0 : 20);
    return {
      x: (utile - large) / 2 + avantLogo + l.width / 2 - (n.left + n.width / 2),
      y: l.top + l.height / 2 - (n.top + n.height / 2),
      s: parseFloat(getComputedStyle(logo).fontSize) / parseFloat(getComputedStyle(nom).fontSize),
    };
  };
  const acte1 = gsap.timeline({
    scrollTrigger: {
      trigger: ciel, start: 'top top', end: '+=120%', pin: true, scrub: 0.5, invalidateOnRefresh: true,
      onUpdate: (s) => {
        const fait = s.progress > 0.985;
        html.classList.toggle('nom-libre', !fait);
        noms.forEach((n) => { n.style.visibility = fait ? 'hidden' : ''; });
      },
    },
  });
  // Le nom passe de devant à derrière les photos : sa copie de devant se dissout doucement, celle de derrière reste.
  if (devant) acte1.to(devant, { opacity: 0, ease: 'power1.inOut', duration: 0.2 }, 0.01);
  acte1.to(noms, { x: () => amarre().x, y: () => amarre().y, scale: () => amarre().s, ease: 'power2.inOut', duration: 1 }, 0);
  acte1.to($$('.ciel__sous, .ciel__aide', ciel), { opacity: 0, duration: 0.2 }, 0);
  photos.forEach((p, i) => {
    const d = Number(p.style.getPropertyValue('--d')) || 1;
    acte1.to(p, { y: () => -innerHeight * (0.75 + d * 0.85), rotation: (i % 2 ? 1 : -1) * (4 + d * 5), scale: 1 + d * 0.25, ease: 'power1.in', duration: 1 }, 0);
  });
  let px = 0, py = 0, sx = 0, sy = 0;
  // Seule la souris fait bouger le ciel (un doigt qui fait défiler ne doit pas le secouer).
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5; }, { passive: true });
  const cielVu = suivreVue(ciel);
  let ecrit = '';
  gsap.ticker.add(() => {
    if (!cielVu.vu) return; // hors de l'écran : rien à calculer
    sx += (px - sx) * 0.06; sy += (py - sy) * 0.06;
    const v = `${sx.toFixed(4)} ${sy.toFixed(4)}`;
    if (v === ecrit) return; // immobile : on ne touche pas aux styles
    ecrit = v;
    ciel.style.setProperty('--px', sx.toFixed(4));
    ciel.style.setProperty('--py', sy.toFixed(4));
  });

  /* Acte 2 — Le manifeste. Les mots s'allument un à un (voir « data-lit » dans initTextes) ; les photos dérivent à leur rythme. */
  $$('[data-derive]').forEach((el) => {
    const v = Number(el.dataset.derive) || 100;
    gsap.fromTo(el, { y: v }, { y: -v, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* Acte 4 — Le passage. Les photos sortent du centre, grandissent et nous frôlent, comme si on avançait dans un couloir d'images.
     L'écran est découpé en couloirs (des parts de tarte autour du centre). Chaque photo reste dans le sien, sa taille est
     proportionnelle à sa distance au centre, et deux photos d'un même couloir gardent toujours le même rapport de distance :
     elles ne peuvent donc jamais se toucher, ni au départ, ni en passant. Pas de flou, pas de déformation : juste un zoom. */
  const nuage = $('[data-nuage]');
  if (nuage) {
    const grains = $$('.nuage__grain', nuage), titre = $('.nuage__titre', nuage);
    const DEMI = [33, 26, 31, 25, 36, 29]; // demi-angle de chaque couloir, en degrés (total : 180)
    const REMPLI = 0.84, R0 = 60, RAD = Math.PI / 180, ALLURE = 2.3; // ALLURE : zoom (en log) par hauteur d'écran défilée
    const Z_TITRE = 0.9; // moment où le titre commence à apparaître (les premières photos sont déjà parties)
    const axes: number[] = [];
    let angle = -118;
    DEMI.forEach((d) => { angle += d; axes.push(angle); angle += d; });
    const rang = DEMI.map((_, k) => 0.45 * (alea(k, 21) + 1)), qAvant = DEMI.map(() => 0);
    const liste = grains.map((el, i) => {
      const k = i % DEMI.length, a = DEMI[k] * RAD;
      const q = REMPLI * Math.sin(a) * (0.8 + 0.1 * (alea(i, 22) + 1)); // rayon de la photo, en fraction de sa distance au centre
      // Écart minimal avec la photo précédente du couloir (partie avant elle, donc plus loin du centre), plus un peu d'air.
      if (i >= DEMI.length) rang[k] += Math.log((1 + q) / (1 - qAvant[k])) + 0.05 + 0.1 * (alea(i, 23) + 1);
      qAvant[k] = q;
      const t = axes[k] * RAD + Math.max(0, a - Math.asin(q) - 1.5 * RAD) * 0.9 * alea(i, 24);
      return { el, dx: Math.cos(t), dy: Math.sin(t), q, u: rang[k], pli: 3 * alea(i, 25), ar: Number(el.dataset.ar) || 0.8, w0: 0, vu: false, clic: true };
    });
    let cx = 0, cy = 0, D = 1, ex = 1, ey = 1, zFin = 1;
    const mesurer = () => {
      const w = nuage.clientWidth, h = nuage.clientHeight;
      cx = w / 2; cy = h / 2; D = Math.hypot(cx, cy);
      ex = borne(Math.sqrt(w / h), 1, 1.3); ey = borne(Math.sqrt(h / w), 1, 1.3);
      liste.forEach((g) => { g.w0 = (2 * g.q * D) / Math.hypot(1, 1 / g.ar); g.el.style.width = `${g.w0.toFixed(1)}px`; });
      // Le passage se termine quand la dernière photo a quitté l'écran : son bord intérieur (à r × (1 − q) du centre)
      // doit avoir dépassé le coin de l'écran, sinon un morceau de photo reste coincé au bord à la fin.
      zFin = Math.max(...liste.map((g) => g.u + Math.log((1.1 * D) / (R0 * (1 - g.q)))));
    };
    // Le passage commence un peu avant que la section ne soit épinglée : quand son centre (d'où sortent les photos) entre
    // en bas de l'écran, elles se mettent à approcher, d'abord à peine, puis de plus en plus vite (accélération douce),
    // jusqu'à atteindre l'allure normale au moment où la section se fixe. On les voit donc toujours arriver de loin.
    const AVANCE = 0.5; // hauteur d'écran défilée avant l'épinglage pendant laquelle le passage a déjà commencé
    const Z_AVANT = (ALLURE * AVANCE) / 2; // zoom parcouru pendant ce temps (moitié de l'allure : on part de l'arrêt)
    const etat = { avant: 0, t: 0 };
    let nx = 0, ny = 0, sale = true;
    const rendre = () => {
      const z = Z_AVANT * etat.avant + etat.t * (zFin - Z_AVANT);
      liste.forEach((g) => {
        const r = R0 * Math.exp(z - g.u), e = r / D, b = g.q * r;
        const x = cx + r * (g.dx * ex + nx * 0.05), y = cy + r * (g.dy * ey + ny * 0.05);
        const o = borne((g.w0 * e - 12) / 16, 0, 1);
        const vu = o > 0 && x + b > -30 && x - b < 2 * cx + 30 && y + b > -30 && y - b < 2 * cy + 30;
        if (vu) {
          g.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${e.toFixed(4)}) rotate(${g.pli.toFixed(2)}deg)`;
          g.el.style.opacity = o.toFixed(3);
          // Trop petite, une photo ne se clique pas : on ne vise que celles qu'on voit vraiment.
          const clic = g.w0 * e > 46;
          if (g.clic !== clic) { g.clic = clic; g.el.style.pointerEvents = clic ? 'auto' : 'none'; }
        }
        if (g.vu !== vu) { g.vu = vu; g.el.style.visibility = vu ? 'visible' : 'hidden'; }
      });
      // Le titre vient du fond lui aussi, un peu après les premières photos et toujours derrière elles :
      // minuscule au départ, il s'approche comme elles, ralentit, et s'arrête à sa taille quand les dernières sont passées.
      if (titre) {
        const t = borne((z - Z_TITRE) / Math.max(0.001, zFin - 0.3 - Z_TITRE), 0, 1);
        const approche = 1 - Math.pow(1 - t, 3);
        titre.style.transform = `scale(${(1 / (1 + (1 - approche) * 9)).toFixed(4)})`;
        titre.style.opacity = borne(t / 0.1, 0, 1).toFixed(3);
      }
    };
    mesurer();
    ScrollTrigger.addEventListener('refreshInit', mesurer);
    ScrollTrigger.addEventListener('refresh', () => { sale = true; });
    gsap.to(etat, {
      avant: 1, ease: 'power1.in', duration: 1, onUpdate: () => { sale = true; },
      scrollTrigger: { trigger: nuage, start: `top ${Math.round(AVANCE * 100)}%`, end: 'top top', scrub: 0.7 },
    });
    const passage = gsap.to(etat, {
      t: 1, ease: 'none', duration: 1, onUpdate: () => { sale = true; },
      scrollTrigger: { trigger: nuage, start: 'top top', end: () => `+=${Math.round(((zFin - Z_AVANT) / ALLURE) * 100)}%`, pin: true, scrub: 0.7 },
    });
    gsap.ticker.add(() => {
      if (passage.scrollTrigger?.isActive) {
        const ax = nx + (px - nx) * 0.06, ay = ny + (py - ny) * 0.06;
        if (Math.abs(ax - nx) + Math.abs(ay - ny) > 0.0004) sale = true;
        nx = ax; ny = ay;
      }
      if (sale) { sale = false; rendre(); }
    });
  }
}

/* ───────── Anneau 3D ───────── */
function initAnneau() {
  const section = $('[data-anneau]');
  if (!section) return;
  const monde = $('[data-monde]', section)!, scene = $('.anneau__scene', section)!;
  const cartes = $$('[data-carte]', section);
  const N = cartes.length, PAS = 360 / N;
  const elTitre = $('[data-info-titre]', section)!, elCat = $('[data-info-cat]', section)!, elPos = $('[data-position]', section);
  const info = $('.anneau__info', section), gHaut = $('[data-gabarit-haut]', section), gBas = $('[data-gabarit-bas]', section);
  const etat = { defile: 0, libre: 0, rot: 0 };
  let face = 0, glisse = false, x0 = 0, bouge = 0, elan = 0, repos = 0;
  let px = 0, py = 0, sx = 0, sy = 0;
  let decoupe: SplitText | undefined;
  const cible = () => etat.defile + etat.libre;

  // Cadre l'anneau. L'œil est au centre du cercle, avec un champ d'environ 60° (un grand-angle : les photos des bords grandissent).
  // On resserre ou on élargit ce champ pour que la photo la plus haute passe sous la barre et que la plus basse laisse la place au titre.
  const placer = () => {
    if (!gHaut || !gBas) return;
    const s = section.getBoundingClientRect(), paysage = s.width >= s.height;
    const haut = 90, bas = (info?.offsetHeight ?? 120) + 34;
    const dispo = Math.max(s.height - haut - bas, 170);
    const p0 = paysage ? s.height * 0.866 : s.width * 1.12;
    scene.style.perspectiveOrigin = '50% 50%';
    scene.style.setProperty('--decal', '0px');
    section.style.setProperty('--p', `${p0.toFixed(1)}px`);
    const etendue = gBas.getBoundingClientRect().bottom - gHaut.getBoundingClientRect().top;
    const p = paysage
      ? borne((p0 * dispo) / etendue, Math.max(s.height * 0.6, s.width * 0.27), s.height * 1.02)
      : borne((p0 * dispo) / etendue, s.width * 0.7, s.width * 1.12);
    section.style.setProperty('--p', `${p.toFixed(1)}px`);
    const a = gHaut.getBoundingClientRect(), b = gBas.getBoundingClientRect();
    scene.style.setProperty('--decal', `${(haut + (dispo - (b.bottom - a.top)) / 2 - (a.top - s.top)).toFixed(1)}px`);
  };
  placer();
  let attente = 0, largeurVue = innerWidth;
  addEventListener('resize', () => {
    // Sur téléphone, la barre d'adresse qui se replie en défilant change la hauteur de la fenêtre à tout moment :
    // tout recalculer à ce moment-là fait sauter la page. On ne recalcule que si la largeur change (on a tourné l'écran).
    if (tactile && innerWidth === largeurVue) return;
    largeurVue = innerWidth;
    clearTimeout(attente);
    attente = window.setTimeout(() => { placer(); ScrollTrigger.refresh(); }, 180);
  });

  const annoncer = (i: number) => {
    const c = cartes[i];
    cartes.forEach((x, k) => x.classList.toggle('est-face', k === i));
    elCat.textContent = `(${c.dataset.cat})`;
    regleCompteur(elPos, i + 1);
    decoupe?.revert();
    elTitre.textContent = c.dataset.titre ?? '';
    if (calme) return;
    decoupe = SplitText.create(elTitre, { type: 'words,chars', mask: 'chars' });
    gsap.from(decoupe.chars, { yPercent: 118, duration: 0.8, ease: 'power4.out', stagger: 0.014 });
    // Les lettres qui s'élargissent obligent à recomposer le titre à chaque image : réservé à l'ordinateur.
    if (!tactile) gsap.fromTo(elTitre, { '--wdth': 64 }, { '--wdth': 125, duration: 1.1, ease: 'power3.out' });
  };
  const majFace = () => {
    const i = mod(Math.round(-cible() / PAS), N);
    if (i !== face) { face = i; annoncer(i); }
  };
  // Au repos, la photo la plus proche du centre vient se placer en face.
  const caler = () => {
    clearTimeout(repos);
    repos = window.setTimeout(() => {
      if (glisse || parti) return;
      const c = cible();
      gsap.to(etat, { libre: etat.libre + Math.round(c / PAS) * PAS - c, duration: 1, ease: 'power3.out', overwrite: true, onUpdate: majFace });
    }, 240);
  };
  const allerA = (i: number) => {
    const ici = Math.round(-cible() / PAS);
    let d = mod(i - mod(ici, N), N);
    if (d > N / 2) d -= N;
    gsap.to(etat, { libre: -(ici + d) * PAS - etat.defile, duration: 1.2, ease: 'power3.out', overwrite: true, onUpdate: majFace });
  };
  const entrer = (c: HTMLElement) => {
    const r = c.getBoundingClientRect(), s = scene.getBoundingClientRect();
    const avant = gsap.timeline();
    avant.to(scene, { scale: 0.8, duration: 0.95, ease: 'expo.in', transformOrigin: `${(r.left + r.width / 2 - s.left).toFixed(0)}px ${(r.top + r.height / 2 - s.top).toFixed(0)}px` }, 0);
    if (info) avant.to(info, { opacity: 0, duration: 0.25 }, 0);
    partir(c, `/v2/projet/${c.dataset.id}/`, avant);
  };

  cartes[0]?.classList.add('est-face');
  // Entrée : les photos montent à leur place l'une après l'autre, puis le survol redevient immédiat.
  const poser = () => { section.classList.add('est-la'); window.setTimeout(() => section.classList.add('est-posee'), 1800); };
  if (calme) section.classList.add('est-la', 'est-posee');
  else ScrollTrigger.create({ trigger: section, start: 'top 55%', once: true, onEnter: poser });
  ScrollTrigger.create({
    trigger: section, start: 'top top', end: '+=240%', pin: true, anticipatePin: 1,
    onUpdate: (s) => { etat.defile = -s.progress * 360; majFace(); caler(); },
  });

  scene.addEventListener('pointerdown', (e) => {
    if (e.button) return;
    glisse = true; x0 = e.clientX; bouge = 0; elan = 0;
    gsap.killTweensOf(etat);
  });
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') { px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5; }
    if (!glisse) return;
    const dx = e.clientX - x0; x0 = e.clientX; bouge += Math.abs(dx);
    const d = dx * (120 / Math.max(innerWidth, 480));
    etat.libre += d; elan = d; majFace();
  }, { passive: true });
  const lacher = () => {
    if (!glisse) return;
    glisse = false;
    etat.libre += elan * 8; majFace(); caler();
  };
  addEventListener('pointerup', lacher);
  addEventListener('pointercancel', lacher);
  scene.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    etat.libre -= e.deltaX * 0.08; majFace(); caler();
  }, { passive: false });
  section.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { allerA(face + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { allerA(face - 1); e.preventDefault(); }
  });
  cartes.forEach((c, i) => {
    c.addEventListener('click', () => { if (bouge > 8) return; if (i === face) entrer(c); else allerA(i); });
    c.addEventListener('focus', () => { if (c.matches(':focus-visible') && i !== face) allerA(i); });
  });

  const anneauVu = suivreVue(section);
  let rotEcrite = '', origineEcrite = '';
  gsap.ticker.add((_t, dt) => {
    if (!anneauVu.vu) return; // hors de l'écran : l'anneau ne se dessine pas
    etat.rot += (cible() - etat.rot) * (calme ? 1 : 1 - Math.exp(-dt / 130));
    // La rotation est écrite sur le seul « monde » (et pas en variable, que toutes les photos devraient relire),
    // et seulement quand elle change : à l'arrêt, plus aucun travail.
    const rot = etat.rot.toFixed(3);
    if (rot !== rotEcrite) { rotEcrite = rot; monde.style.transform = `translateZ(var(--p)) rotateX(-15deg) rotateY(${rot}deg)`; }
    // La souris fait pencher légèrement toute la scène : on a l'impression de tourner la tête.
    sx += (px - sx) * 0.05; sy += (py - sy) * 0.05;
    const origine = `${(50 + sx * 10).toFixed(2)}% ${(50 + sy * 8).toFixed(2)}%`;
    if (origine !== origineEcrite) { origineEcrite = origine; scene.style.perspectiveOrigin = origine; }
    cartes.forEach((c, i) => {
      const a = mod(i * PAS + etat.rot + 180, 360) - 180;
      const vu = Math.abs(a) < 76 ? '1' : '0'; // au-delà, la photo est sur le côté ou derrière nous
      if (c.dataset.vu !== vu) { c.dataset.vu = vu; c.style.visibility = vu === '1' ? '' : 'hidden'; }
    });
  });
}

/* ───────── Suite de l'accueil : le mot final ───────── */
function initFinAccueil() {
  if (calme) return;
  /* Films — un écran 16/9 posé sur le papier, sous le mot géant. En défilant : il s'ouvre en plein écran et la salle
     s'éteint (la barre passe en noir) ; puis il se range à gauche et le second film, en hauteur, prend le centre.
     Seul le film regardé tourne ; le compteur en haut à droite donne son temps réel. */
  const films = $('[data-films]');
  if (films) {
    const vids = $$<HTMLVideoElement>('[data-film]', films), motFilms = $('[data-films-mot]', films);
    const tc = $('[data-tc]', films), elNum = $('[data-film-num]', films), elTitre = $('[data-film-titre]', films);
    const elRang = $('[data-film-rang]', films), son = $('[data-son]', films), plein = $('[data-vue-films]', films);
    const etat = { o: 0, t: 0 }; // o : ouverture de l'écran ; t : passage du premier au second film
    let haut = 0, cote = 0, hautFin = 0, courant = -1, visible = false, dernierTon = 'papier', seance: gsap.core.Timeline | undefined;
    const deux = (n: number) => String(Math.floor(n)).padStart(2, '0');
    const code = (s: number) => `00:${deux(s / 60)}:${deux(s % 60)}:${deux((s % 1) * 25)}`;
    const mesurer = () => {
      const w = films.clientWidth, h = films.clientHeight;
      const large = Math.min(w * (w < 720 ? 0.84 : 0.46), ((h * 0.5) * 16) / 9); // l'écran au repos : un 16/9 au milieu
      haut = (h - (large * 9) / 16) / 2; cote = (w - large) / 2;
      hautFin = w < h ? (h - (w * 9) / 16) / 2 : 0; // écran en hauteur (téléphone) : le film garde son format, avec du noir autour
    };
    // La salle : éteinte tant que l'écran est ouvert et qu'on est dans la scène. Seul le film regardé tourne.
    const salle = () => {
      const dedans = !!seance?.scrollTrigger?.isActive;
      const voulu = etat.o > 0.5 && dedans ? 'nuit' : 'papier';
      if (dernierTon !== voulu) { dernierTon = voulu; if (!parti) html.dataset.scene = voulu; }
      const joue = visible ? (etat.t > 0.5 ? 1 : 0) : -1;
      vids.forEach((v, i) => {
        if (i === joue) { if (v.paused) v.play().catch(() => undefined); } else if (!v.paused) v.pause();
      });
    };
    const rendre = () => {
      const bord = haut + (hautFin - haut) * etat.o;
      films.style.setProperty('--et', `${bord.toFixed(1)}px`);
      films.style.setProperty('--em', `${(bord * (1 - etat.t)).toFixed(1)}px`); // les mentions vont aux bords de la fenêtre quand le second film arrive
      films.style.setProperty('--ec', `${(cote * (1 - etat.o)).toFixed(1)}px`);
      films.style.setProperty('--o', etat.o.toFixed(3));
      films.style.setProperty('--t', etat.t.toFixed(3));
      const k = etat.t > 0.5 && vids[1] ? 1 : 0;
      if (k !== courant) {
        courant = k;
        if (elNum) elNum.textContent = `(Film ${deux(k + 1)})`;
        if (elTitre) elTitre.textContent = vids[k]?.dataset.titre ?? '';
        regleCompteur(elRang, k + 1);
        if (plein) plein.dataset.vueFilms = String(k); // « Plein écran » ouvre le film regardé
      }
      salle();
    };
    // Pendant que la visionneuse montre les films en grand, ceux de la page se taisent ; ils reprennent à sa fermeture.
    addEventListener('valg-vue', (e) => {
      if ((e as CustomEvent<boolean>).detail) vids.forEach((v) => v.pause());
      else salle();
    });
    mesurer();
    rendre();
    ScrollTrigger.addEventListener('refreshInit', mesurer);
    ScrollTrigger.addEventListener('refresh', rendre);
    seance = gsap.timeline({ scrollTrigger: { trigger: films, start: 'top top', end: '+=300%', pin: true, scrub: 0.6, onLeave: salle, onLeaveBack: salle } });
    seance.to(etat, { o: 1, ease: 'power2.inOut', duration: 0.22, onUpdate: rendre }, 0);
    if (vids[1]) seance.to(etat, { t: 1, ease: 'power2.inOut', duration: 0.2, onUpdate: rendre }, 0.5);
    seance.to({}, { duration: 0.001 }, 1);
    // Les films ne tournent (et le second ne se charge) que lorsque la scène est à l'écran.
    ScrollTrigger.create({
      trigger: films, start: 'top bottom', end: '+=500%', // une hauteur pour entrer, trois épinglées, une pour sortir
      onToggle: (s) => {
        visible = s.isActive;
        if (visible) vids.forEach((v) => { if (v.preload === 'none') { v.preload = 'auto'; v.load(); } });
        salle();
      },
    });
    let tcEcrit = '';
    gsap.ticker.add(() => {
      if (!visible || !tc || !vids[courant]) return;
      const v = code(vids[courant].currentTime);
      if (v !== tcEcrit) { tcEcrit = v; tc.textContent = v; } // le texte n'est touché que s'il change
    });
    son?.addEventListener('click', () => {
      const muet = !vids[0]?.muted;
      vids.forEach((v) => { v.muted = muet; });
      son.textContent = muet ? 'Son coupé' : 'Son activé';
      son.setAttribute('aria-pressed', String(!muet));
    });
    if (motFilms) gsap.fromTo(motFilms, { '--wdth': 62 }, { '--wdth': 125, ease: 'none', scrollTrigger: { trigger: films, start: 'top 95%', end: 'top top', scrub: true } });
  }
  const mot = $('[data-fin]');
  if (mot) gsap.fromTo(mot, { '--wdth': 62 }, { '--wdth': 125, ease: 'none', scrollTrigger: { trigger: mot, start: 'top 96%', end: 'top 38%', scrub: true } });
}

/* ───────── Mur calme (collection et projets) ───────── */
// Le mur range ses photos en colonnes (la moins haute d'abord) : on retrouve leur ordre d'origine grâce à data-i.
const enOrdre = (els: HTMLElement[]) => els.slice().sort((a, b) => Number(a.dataset.i) - Number(b.dataset.i));
function initCollection() {
  const items = $$('.mur__item');
  if (!items.length) return;
  // Les photos apparaissent en fondu quand elles entrent dans l'écran.
  const veille = new IntersectionObserver((entrees) => {
    let n = 0;
    entrees.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target as HTMLElement;
      el.style.transitionDelay = `${Math.min(n++ * 45, 360)}ms`;
      el.classList.add('est-vu');
      veille.unobserve(el);
    });
  }, { rootMargin: '0px 0px -5% 0px' });
  items.forEach((i) => veille.observe(i));

  const page = $('[data-page="collection"]');
  if (page) initPageCollection(page, items);
}

/* ───────── Collections : le mur de photos, ses repères fixes et le bouton « Chercher » ───────── */
type Choix = { type: string; nom: string; cat: string; nb: number; href: string };
function initPageCollection(page: HTMLElement, items: HTMLElement[]) {
  const zoneMur = $('[data-mur-zone]', page) ?? $('.mur', page);
  const hud = $('[data-hud]', page), elRang = $('[data-rang]', page), goo = $('[data-goo]', page);
  const fin = $('.suite', page) ?? $('.pied', page);
  if (!zoneMur) return;
  // Le compteur suit la photo survolée : il dit toujours « où on est » dans le mur.
  items.forEach((it, k) => it.addEventListener('pointerenter', () => regleCompteur(elRang, Number(it.dataset.i ?? k) + 1)));
  $('[data-vers-haut]', page)?.addEventListener('click', (e) => {
    e.preventDefault();
    if (lenis) lenis.scrollTo(0, { duration: 1.1, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
    else scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Les repères n'apparaissent qu'une fois dans le mur, et s'effacent à la fin de la page.
  let fermerRecherche = () => {}; // défini plus bas, avec le bouton « Chercher »
  let auMur = false, auBout = false;
  const majHud = () => {
    const loin = !auMur || auBout;
    hud?.classList.toggle('est-loin', loin);
    if (loin) fermerRecherche();
  };
  ScrollTrigger.create({ trigger: zoneMur, start: 'top 58%', onEnter: () => { auMur = true; majHud(); }, onLeaveBack: () => { auMur = false; majHud(); } });
  if (fin) ScrollTrigger.create({ trigger: fin, start: 'top bottom', onEnter: () => { auBout = true; majHud(); }, onLeaveBack: () => { auBout = false; majHud(); } });

  /* ── Le bouton « Chercher » : une pilule qui s'étire en champ de saisie, et d'où les choix sortent comme des gouttes
     (le filtre SVG « goo » les fait fusionner avec elle). Sans rien taper : les collections. En tapant : collections et projets.
     Un choix emmène directement à sa page : on change de collection ou de projet sans remonter. */
  if (!goo) return;
  let choix: Choix[] = [];
  try { choix = JSON.parse(goo.dataset.choix ?? '[]'); } catch { /* liste illisible : pas de recherche */ }
  const pilule = $('[data-goo-pilule]', goo)!, bouton = $<HTMLButtonElement>('[data-goo-ouvrir]', goo)!;
  const champ = $<HTMLInputElement>('.goo__champ', goo)!, bulle = $('[data-goo-bulle]', goo)!, liste = $('[data-goo-liste]', goo)!;
  const ua = navigator.userAgent.toLowerCase();
  if ((ua.includes('safari') && !/chrome|chromium|android|firefox/.test(ua)) || ua.includes('crios')) goo.classList.add('sans-goo'); // Safari rend mal ce filtre
  const simple = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const ici = (c: Choix) => c.href === location.pathname;
  const aller = (c: Choix, depuis: HTMLElement) => {
    if (ici(c)) { fermerRecherche(); return; }
    if (c.href.startsWith('/v2/projet/')) partir(depuis, c.href); // vers un projet : le papier implose vers le noir
    else location.href = c.href;
  };
  let ouvert = false, attente = 0, proposes: Choix[] = [];
  const proposer = (resultats: Choix[]) => {
    proposes = resultats;
    ([...liste.children] as HTMLElement[]).forEach((el) => {
      el.style.pointerEvents = 'none';
      gsap.to(el, { y: 0, scale: 0.5, opacity: 0, duration: 0.28, ease: 'power2.in', overwrite: true, onComplete: () => el.remove() });
    });
    resultats.forEach((c, i) => {
      const b = document.createElement('button'), nom = document.createElement('span'), nb = document.createElement('i');
      b.type = 'button';
      b.className = 'goo__choix';
      b.setAttribute('role', 'option');
      if (ici(c)) b.setAttribute('aria-selected', 'true');
      nom.textContent = c.nom;
      nb.textContent = c.cat ? `${c.cat} · ${c.nb}` : String(c.nb);
      b.append(nom, nb);
      b.addEventListener('click', () => aller(c, b));
      liste.appendChild(b);
      gsap.fromTo(b, { y: 0, scale: 0.3 }, { y: -(i + 1) * 46, scale: 1, duration: calme ? 0 : 0.95, ease: 'elastic.out(1, 0.7)', delay: calme ? 0 : i * 0.07 });
    });
  };
  const chercher = () => {
    const q = simple(champ.value);
    proposer(q ? choix.filter((c) => simple(c.nom).includes(q) || simple(c.cat).includes(q)).slice(0, 6) : choix.filter((c) => c.type !== 'projet'));
  };
  const ouvrir = () => {
    if (ouvert) return;
    ouvert = true;
    hud?.classList.add('filtre-ouvert');
    bouton.hidden = true;
    champ.hidden = false;
    champ.value = '';
    bouton.setAttribute('aria-expanded', 'true');
    gsap.to(pilule, { width: 232, duration: calme ? 0 : 0.75, ease: 'back.out(1.5)', overwrite: true });
    gsap.fromTo(bulle, { x: -46, opacity: 0 }, { x: 0, opacity: 1, duration: calme ? 0 : 0.85, ease: 'back.out(1.7)', delay: 0.1, overwrite: true });
    champ.focus({ preventScroll: true });
    chercher();
  };
  fermerRecherche = () => {
    if (!ouvert) return;
    ouvert = false;
    hud?.classList.remove('filtre-ouvert');
    clearTimeout(attente);
    proposer([]);
    bouton.setAttribute('aria-expanded', 'false');
    gsap.to(bulle, { x: -46, opacity: 0, duration: 0.4, ease: 'power3.in', overwrite: true });
    gsap.to(pilule, { width: 112, duration: 0.6, ease: 'power3.inOut', delay: 0.12, overwrite: true, onComplete: () => { champ.hidden = true; bouton.hidden = false; } });
    champ.blur();
  };
  bouton.addEventListener('click', ouvrir);
  champ.addEventListener('input', () => { clearTimeout(attente); attente = window.setTimeout(chercher, 140); });
  champ.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { fermerRecherche(); bouton.focus({ preventScroll: true }); }
    if (e.key === 'Enter' && proposes[0]) aller(proposes[0], pilule);
  });
  document.addEventListener('pointerdown', (e) => { if (ouvert && !goo.contains(e.target as Node)) fermerRecherche(); });
}

/* ───────── Volets : la couleur revient autour du curseur ; un clic ouvre la porte ───────── */
function initVolets() {
  $$('.volets').forEach((groupe) => {
    $$<HTMLAnchorElement>('a.volet', groupe).forEach((v) => {
      v.addEventListener('pointermove', (e) => {
        const r = v.getBoundingClientRect();
        v.style.setProperty('--sx', `${(e.clientX - r.left).toFixed(0)}px`);
        v.style.setProperty('--sy', `${(e.clientY - r.top).toFixed(0)}px`);
      });
      v.addEventListener('click', (e) => {
        if (calme || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        e.preventDefault();
        if (new URL(v.href).pathname.startsWith('/v2/projet/')) { partir(v, v.href); return; } // vers un projet : le papier implose vers le noir
        // Vers une collection : le volet choisi s'ouvre en grand, en couleur, les autres se referment, puis on entre.
        if (groupe.classList.contains('part')) return;
        groupe.classList.add('part');
        v.classList.add('est-choisi');
        // La page suivante s'ouvre sur ce même volet en grand, au même endroit : pour que les deux se superposent,
        // on remonte en haut de la page et les textes de l'en-tête s'effacent.
        $('.entete')?.classList.add('sort');
        if (scrollY > 2) { if (lenis) lenis.scrollTo(0, { duration: 0.55 }); else scrollTo({ top: 0, behavior: 'smooth' }); }
        memo.ecrire('valg-porte', '1');
        window.setTimeout(() => { location.href = v.href; }, 700);
      });
    });
  });
}

/* ───────── Page projet : le défilé ─────────
   Une photo de face au centre, ses voisines plus petites, en retrait et tournées vers elle, les suivantes qui s'effacent.
   Ce sont les cinq poses exactes de perappelgren.de (caméra à 8,8 unités, champ de 36°), mises à l'échelle de notre écran.
   Ici c'est le défilement de la page qui fait avancer la file ; à l'arrêt, la photo la plus proche revient se placer de face. */
function initProjet() {
  const page = $('[data-page="projet"]');
  const section = page ? $('[data-defile]', page) : null;
  if (!page || !section) return;
  const boutons = $$('[data-vue-choix]', page);
  if (calme) { page.dataset.vue = 'mur'; return; } // sans animation : le mur, simplement
  const scene = $('[data-scene]', section)!, photos = $$('[data-photo]', section);
  const hud = $('[data-hud]', page), elRang = $('[data-rang]', page);
  const mur = $('.mur', page), murs = enOrdre($$('.mur__item', page)), suite = $('.suite', page), visionneuse = $('.vue');
  const N = photos.length, formats = photos.map((p) => Number(p.dataset.ar) || 0.8);
  // x et z en unités de scène, s = hauteur en part d'écran, ry = rotation, o = opacité, b = luminosité.
  const POSES = [
    { x: -8.2, z: -3.2, s: 0.34, ry: 0.52, o: 0, b: 0.72 },
    { x: -4.15, z: -1.65, s: 0.46, ry: 0.34, o: 1, b: 0.86 },
    { x: 0, z: 0, s: 0.78, ry: 0, o: 1, b: 1 },
    { x: 4.15, z: -1.65, s: 0.46, ry: -0.34, o: 1, b: 0.86 },
    { x: 8.2, z: -3.2, s: 0.34, ry: -0.52, o: 0, b: 0.72 },
  ];
  const pose = (t: number) => {
    const c = borne(t, -2, 2) + 2, i = Math.min(3, Math.floor(c)), f = c - i, a = POSES[i], b = POSES[i + 1];
    const m = (u: number, v: number) => u + (v - u) * f;
    return { x: m(a.x, b.x), z: m(a.z, b.z), s: m(a.s, b.s), ry: m(a.ry, b.ry), o: m(a.o, b.o), b: m(a.b, b.b) };
  };

  // Toutes les mesures partent de la fenêtre et des repères du bas (pas de la scène) : elles restent justes même quand le défilé est masqué.
  let large = 1, hScene = 1, hc = 1, unite = 1, serre = 1, pas = 200, marge = 150, ajusts: number[] = [], surplus: number[] = [];
  const mesurer = () => {
    large = document.documentElement.clientWidth;
    // Place à garder sous la scène pour les repères du bas (sans compter le voile qui dépasse au-dessus du texte).
    marge = hud ? hud.offsetHeight - (parseFloat(getComputedStyle(hud).paddingTop) || 0) + 18 : 150;
    section.style.setProperty('--bas', `${marge.toFixed(0)}px`);
    hScene = Math.max(420, innerHeight) - 84 - marge;
    hc = hScene * 0.96; // hauteur de la photo de face
    const ecran = hc / 0.78; // « hauteur d'écran » de la scène d'origine
    unite = ecran / 5.719; // une unité de cette scène, en pixels
    section.style.setProperty('--hc', `${hc.toFixed(1)}px`);
    section.style.setProperty('--p', `${(ecran * 1.539).toFixed(1)}px`);
    serre = borne(large / (1.45 * ecran), 0.42, 1); // écran étroit : les voisines se rapprochent pour rester visibles
    const maxi = large >= 900 ? large * 0.62 : large - 32;
    ajusts = formats.map((ar) => Math.min(1, maxi / (hc * ar))); // une photo en largeur ne doit pas déborder
    // Ce qu'une photo en largeur dépasse d'une photo en hauteur ordinaire, de chaque côté : ses voisines s'écartent d'autant.
    surplus = formats.map((ar, i) => Math.max(0, (hc * ar * ajusts[i] - hc * 0.8) / 2));
    pas = Math.max(170, innerHeight * 0.28); // défilement nécessaire pour passer à la photo suivante
  };
  // Place de la photo de face quand la file est refermée sur elle : c'est le point de passage entre les deux vues.
  const cadreFace = (i: number) => {
    const h = hc * ajusts[i] * 0.86;
    return { cx: large / 2, cy: 84 + hScene / 2, h, w: h * formats[i] };
  };

  const etat = { cible: 0, h: 0, ouv: 0 };
  let sale = true, face = -1, glisse = false, x0 = 0, bouge = 0, minuterie = 0, enCours = false, survol = -1;
  const rendre = () => {
    // Largeur en trop de la photo du centre (fondue entre les deux photos quand on est à mi-chemin).
    const c0 = borne(Math.floor(etat.h), 0, N - 1), c1 = Math.min(N - 1, c0 + 1), mi = borne(etat.h - c0, 0, 1);
    const centre = (surplus[c0] ?? 0) * (1 - mi) + (surplus[c1] ?? 0) * mi;
    photos.forEach((el, i) => {
      const t = i - etat.h, vu = Math.abs(t) < 3; // au-delà de trois rangs, la photo est rangée (et pas encore chargée)
      if (vu) {
        const p = pose(t), o = etat.ouv;
        const e = (p.s / 0.78) * ajusts[i] * (0.86 + 0.14 * o);
        const pousse = Math.sign(t) * Math.min(1, Math.abs(t)) * (centre + 0.5 * (surplus[i] ?? 0)) * 1.15;
        el.style.transform = `translate(-50%, -50%) translate3d(${((p.x * unite * serre + pousse) * o).toFixed(1)}px, 0, ${(p.z * unite * o).toFixed(1)}px) rotateY(${(p.ry * o).toFixed(4)}rad) scale(${e.toFixed(4)})`;
        el.style.opacity = (p.o * (Math.abs(t) < 0.5 ? 1 : o)).toFixed(3);
        el.style.filter = p.b < 0.995 ? `brightness(${p.b.toFixed(3)})` : '';
        el.style.zIndex = String(100 - Math.round(Math.abs(t) * 10));
      }
      if ((el.dataset.vu === '1') !== vu) { el.dataset.vu = vu ? '1' : '0'; el.style.visibility = vu ? 'visible' : 'hidden'; }
    });
    const i = borne(Math.round(etat.h), 0, N - 1);
    if (i !== face) {
      face = i;
      if (page.dataset.vue === 'defile') regleCompteur(elRang, i + 1);
      photos.forEach((el, k) => el.classList.toggle('est-face', k === i));
    }
  };

  mesurer();
  const st = ScrollTrigger.create({
    trigger: section, start: 'top top', end: () => `+=${Math.round(Math.max(N - 1, 0) * pas)}`, pin: true, anticipatePin: 1,
    onUpdate: (s) => { etat.cible = s.progress * (N - 1); repos(); },
  });
  ScrollTrigger.addEventListener('refreshInit', mesurer);
  ScrollTrigger.addEventListener('refresh', () => { sale = true; });
  // Les repères du bas s'effacent quand on arrive au projet suivant.
  if (hud && suite) ScrollTrigger.create({ trigger: suite, start: 'top bottom', onEnter: () => hud.classList.add('est-loin'), onLeaveBack: () => hud.classList.remove('est-loin') });

  const placer = (y: number) => {
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else scrollTo(0, y);
    ScrollTrigger.update();
  };
  const allerA = (i: number, duree = 0.7) => {
    const y = st.start + borne(i, 0, N - 1) * pas;
    if (lenis) lenis.scrollTo(y, { duration: duree, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
    else scrollTo({ top: y, behavior: 'smooth' });
  };
  // À l'arrêt, la photo la plus proche revient de face (comme un cran).
  function repos() {
    clearTimeout(minuterie);
    minuterie = window.setTimeout(() => {
      if (glisse || enCours || !st.isActive || page!.dataset.vue !== 'defile') return;
      const i = Math.round(etat.cible);
      if (Math.abs(etat.cible - i) > 0.012) allerA(i, 0.6);
    }, 170);
  }

  // Glisser à l'horizontale fait avancer la file.
  scene.addEventListener('pointerdown', (e) => {
    if (e.button) return;
    glisse = true; x0 = e.clientX; bouge = 0;
    scene.classList.add('glisse');
  });
  addEventListener('pointermove', (e) => {
    if (!glisse || enCours) return;
    const dx = e.clientX - x0;
    x0 = e.clientX; bouge += Math.abs(dx);
    if (bouge < 4) return;
    const y = borne(scrollY - dx * (pas / (large * 0.34)), st.start, st.end);
    if (lenis) lenis.scrollTo(y, { immediate: true });
    else scrollTo(0, y);
  }, { passive: true });
  const lacher = () => {
    if (!glisse) return;
    glisse = false;
    scene.classList.remove('glisse');
    repos();
  };
  addEventListener('pointerup', lacher);
  addEventListener('pointercancel', lacher);

  // Clic : la photo de face s'ouvre en grand, une voisine vient prendre sa place.
  photos.forEach((el, i) => el.addEventListener('click', () => {
    if (bouge > 6 || enCours) return;
    if (i === Math.round(etat.h)) murs[i]?.click();
    else allerA(i);
  }));
  addEventListener('keydown', (e) => {
    if (page.dataset.vue !== 'defile' || enCours || (visionneuse && !visionneuse.hidden) || scrollY > st.end + 4) return;
    if (e.key === 'ArrowRight') { allerA(Math.round(etat.cible) + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { allerA(Math.round(etat.cible) - 1); e.preventDefault(); }
  });
  // Sur le mur, le compteur suit la photo survolée : il dit toujours « où on est ».
  murs.forEach((el, i) => el.addEventListener('pointerenter', () => {
    if ((page.dataset.vue !== 'mur' && scrollY < st.end) || enCours) return;
    survol = i;
    regleCompteur(elRang, i + 1);
  }));

  gsap.ticker.add((_t, dt) => {
    if (page.dataset.vue !== 'defile') return;
    const suite2 = etat.h + (etat.cible - etat.h) * (1 - Math.exp(-dt / 110));
    if (Math.abs(suite2 - etat.h) < 0.0004 && !sale) return;
    etat.h = Math.abs(etat.cible - suite2) < 0.0006 ? etat.cible : suite2;
    sale = false;
    rendre();
  });

  /* ── Passer d'une vue à l'autre ──
     Rien ne saute : la file se referme sur la photo qu'on regarde, cette photo vole jusqu'à sa place sur le mur
     et les autres sortent de derrière elle. Dans l'autre sens, le mur se rassemble sur la photo du milieu de l'écran,
     qui devient la photo de face, puis la file se rouvre. */
  const annoncer = (vue: string) => {
    boutons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vueChoix === vue)));
  };
  const liberer = () => {
    gsap.set(murs, { clearProps: 'transform,opacity,zIndex,position' });
    mur?.classList.remove('en-vol');
  };
  const finir = (vue: string) => {
    enCours = false;
    lenis?.start();
    memo.ecrire('valg-vue-projet', vue);
  };
  type Cadre = { left: number; top: number; width: number; height: number };
  const cadreDe = (c: { cx: number; cy: number; w: number; h: number }): Cadre => ({ left: c.cx - c.w / 2, top: c.cy - c.h / 2, width: c.w, height: c.h });
  // La photo qui voyage d'une vue à l'autre : une copie posée par-dessus la page, pour qu'elle ne disparaisse jamais en route.
  const copie = (image: HTMLImageElement | null, r: Cadre) => {
    const c = document.createElement('img');
    c.className = 'vol';
    c.alt = '';
    c.src = image?.currentSrc || image?.src || '';
    Object.assign(c.style, { left: `${r.left.toFixed(1)}px`, top: `${r.top.toFixed(1)}px`, width: `${r.width.toFixed(1)}px`, height: `${r.height.toFixed(1)}px` });
    document.body.appendChild(c);
    return c;
  };
  const envoyer = (c: HTMLElement, de: Cadre, vers: Cadre, duree: number, ease: string) =>
    gsap.to(c, { x: vers.left - de.left, y: vers.top - de.top, scaleX: vers.width / de.width, scaleY: vers.height / de.height, duration: duree, ease });
  // Attend qu'une image soit prête à être montrée (au plus deux secondes), pour ne jamais laisser voir un cadre vide.
  const prete = (image: HTMLImageElement | null) => {
    if (!image) return Promise.resolve();
    image.loading = 'eager';
    const charge = image.complete && image.naturalWidth > 0 ? image.decode().catch(() => undefined) : new Promise<void>((ok) => { image.addEventListener('load', () => ok(), { once: true }); image.addEventListener('error', () => ok(), { once: true }); });
    return Promise.race([charge, new Promise<void>((ok) => setTimeout(ok, 2000))]);
  };
  // Changer de vue réorganise toute la page : un calcul lourd, d'un seul coup. On attend que le navigateur ait affiché
  // deux images après lui avant de lancer le mouvement ; sinon le mouvement démarrerait d'un bond (surtout sur iPhone).
  const deuxImages = () => new Promise<void>((ok) => requestAnimationFrame(() => requestAnimationFrame(() => ok())));
  // Les autres photos du mur visibles à l'écran : repliées derrière la photo de face, ou dépliées à leur place.
  const deployer = (i0: number, ouvrir: boolean, tl: gsap.core.Timeline) => {
    const f = cadreFace(i0), diag = Math.hypot(innerWidth, innerHeight);
    mur?.classList.add('en-vol');
    murs.forEach((el) => el.classList.add('est-vu'));
    let fin = 0;
    murs.forEach((el, i) => {
      if (i === i0) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < -60 || r.top > innerHeight + 60) return;
      const dx = f.cx - (r.left + r.width / 2), dy = f.cy - (r.top + r.height / 2), loin = Math.hypot(dx, dy) / diag;
      const replie = { x: dx, y: dy, scale: (f.h / r.height) * 0.5, opacity: 0 };
      if (ouvrir) {
        const delai = 0.04 + loin * 0.3;
        tl.fromTo(el, replie, { x: 0, y: 0, scale: 1, opacity: 1, duration: 1, ease: 'expo.out' }, delai);
        fin = Math.max(fin, delai + 1);
      } else {
        const delai = (1 - Math.min(1, loin * 2)) * 0.08;
        tl.to(el, { ...replie, duration: 0.62, ease: 'power3.inOut' }, delai);
        fin = Math.max(fin, delai + 0.62);
      }
    });
    return fin;
  };
  const versMur = () => {
    const i0 = borne(Math.round(etat.h), 0, N - 1);
    survol = i0;
    murs.forEach((el) => { const im = $<HTMLImageElement>('img', el); if (im) im.loading = 'eager'; }); // le mur se prépare pendant que la file se referme
    gsap.to(etat, {
      ouv: 0, duration: 0.5, ease: 'power3.inOut', onUpdate: () => { sale = true; },
      onComplete: async () => {
        const depart: Cadre = photos[i0].getBoundingClientRect();
        const c = copie($<HTMLImageElement>('img', photos[i0]), depart);
        page.dataset.vue = 'mur';
        st.disable();
        ScrollTrigger.refresh();
        // Le mur s'ouvre à la hauteur de la photo qu'on regardait.
        const r = murs[i0].getBoundingClientRect(), haut = r.top + scrollY;
        placer(haut + r.height < innerHeight - marge ? 0 : borne(haut - (innerHeight - r.height) / 2, 0, document.documentElement.scrollHeight - innerHeight));
        gsap.set(murs[i0], { opacity: 0 });
        // L'envol est préparé (les photos du mur sont déjà repliées à leur point de départ), puis lancé une fois le calcul passé.
        const vol = gsap.timeline({ paused: true });
        const fin = deployer(i0, true, vol);
        vol.add(envoyer(c, depart, murs[i0].getBoundingClientRect(), 1, 'expo.out'), 0);
        await deuxImages();
        vol.play();
        await Promise.all([new Promise<void>((ok) => gsap.delayedCall(Math.max(fin, 1) + 0.02, ok)), prete($<HTMLImageElement>('img', murs[i0]))]);
        liberer();
        c.remove();
        finir('mur');
      },
    });
  };
  const versDefile = () => {
    // La photo qui deviendra la photo de face : celle qu'on survolait si elle est encore à l'écran, sinon la plus proche du milieu.
    const aLecran = (i: number) => { const r = murs[i]?.getBoundingClientRect(); return !!r && r.bottom > 80 && r.top < innerHeight - 80; };
    let i0 = survol >= 0 && aLecran(survol) ? survol : -1;
    if (i0 < 0) {
      let mieux = Infinity;
      murs.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const d = Math.hypot(r.left + r.width / 2 - innerWidth / 2, r.top + r.height / 2 - innerHeight / 2);
        if (d < mieux) { mieux = d; i0 = i; }
      });
      i0 = Math.max(i0, 0);
    }
    regleCompteur(elRang, i0 + 1);
    // La file se prépare (la photo de face et ses voisines) pendant que le mur se rassemble.
    const attente = prete($<HTMLImageElement>('img', photos[i0]));
    [i0 - 1, i0 + 1].forEach((k) => { const im = photos[k] ? $<HTMLImageElement>('img', photos[k]) : null; if (im) im.loading = 'eager'; });
    const depart: Cadre = murs[i0].getBoundingClientRect(), arrivee = cadreDe(cadreFace(i0));
    const c = copie($<HTMLImageElement>('img', murs[i0]), depart);
    gsap.set(murs[i0], { opacity: 0 });
    const fin = deployer(i0, false, gsap.timeline());
    envoyer(c, depart, arrivee, 0.66, 'power3.inOut');
    gsap.delayedCall(Math.max(fin, 0.66) + 0.02, async () => {
      page.dataset.vue = 'defile';
      liberer();
      st.enable();
      ScrollTrigger.refresh();
      placer(st.start + i0 * pas);
      etat.ouv = 0; etat.cible = etat.h = i0; face = -1;
      rendre();
      await attente;
      await deuxImages(); // la page vient d'être réorganisée : la file s'ouvre une fois ce calcul passé
      gsap.to(c, { opacity: 0, duration: 0.3, ease: 'power1.out', onComplete: () => c.remove() });
      gsap.to(etat, { ouv: 1, duration: 1.2, ease: 'expo.out', onUpdate: () => { sale = true; }, onComplete: () => finir('defile') });
    });
  };
  // En défilé, le mur est déjà là, sous la file : le bouton « Mur » s'allume quand on y arrive.
  const sousLaFile = () => page.dataset.vue === 'defile' && scrollY > st.end + 4;
  addEventListener('scroll', () => { if (!enCours && page.dataset.vue === 'defile') annoncer(sousLaFile() ? 'mur' : 'defile'); }, { passive: true });
  const choisir = (vue: string) => {
    if (enCours) return;
    if (sousLaFile()) {
      if (vue === 'defile') { allerA(Math.round(etat.cible), 1.2); return; } // on remonte vers la file
      // Déjà sur le mur : on retire la file au-dessus sans que le mur bouge à l'écran.
      const avant = mur ? mur.getBoundingClientRect().top : 0;
      page.dataset.vue = 'mur';
      st.disable();
      ScrollTrigger.refresh();
      placer(scrollY + (mur ? mur.getBoundingClientRect().top : 0) - avant);
      annoncer('mur');
      memo.ecrire('valg-vue-projet', 'mur');
      return;
    }
    if (page.dataset.vue === vue) return;
    enCours = true;
    lenis?.stop();
    annoncer(vue);
    if (vue === 'mur') versMur(); else versDefile();
  };
  boutons.forEach((b) => b.addEventListener('click', () => choisir(b.dataset.vueChoix ?? 'defile')));

  // Départ. Une adresse qui finit par #photo-12 ouvre le défilé directement sur la douzième photo (clic depuis l'accueil).
  const demande = location.hash.match(/^#photo-(\d+)$/);
  const depart = demande ? borne(Number(demande[1]) - 1, 0, N - 1) : 0;
  if (depart) {
    const auDepart = () => {
      ScrollTrigger.removeEventListener('refresh', auDepart);
      placer(st.start + depart * pas);
      etat.cible = etat.h = depart;
      sale = true;
    };
    ScrollTrigger.addEventListener('refresh', auDepart);
  }
  // Entrée : les photos partent de celle du centre et s'écartent pour prendre leur place.
  gsap.to(etat, { ouv: 1, duration: 1.5, ease: 'expo.out', delay: 0.35, onUpdate: () => { sale = true; } });
}

/* ───────── Visionneuse sobre ─────────
   Photo ou film en grand. Tant qu'elle est ouverte, la page derrière ne bouge plus du tout : pincer, molette,
   clavier et glisser n'agissent que sur ce qui est montré (zoom et déplacement dans la photo). */
type Piece = { film: boolean; src: string; affiche?: string; alt: string; legende: string; projet?: string; rang?: string; debut?: number };
function initVue() {
  const vue = $('.vue');
  if (!vue) return;
  const scene = $('.vue__scene', vue)!, img = $<HTMLImageElement>('.vue__scene img', vue)!, video = $<HTMLVideoElement>('.vue__video', vue)!;
  const cpt = $('[data-cpt]', vue), total = $('.cpt__total', vue), legende = $('[data-vue-legende]', vue), versProjet = $<HTMLAnchorElement>('[data-vue-projet]', vue);
  let liste: Piece[] = [], pos = 0, avant: HTMLElement | null = null;
  const enFilm = () => vue.classList.contains('vue--film');

  /* Zoom de la photo : échelle et décalage, à partir de sa place « entière » (cadre) dans la scène. */
  const ZMAX = 5;
  const z = { s: 1, x: 0, y: 0 };
  let cadre = { l: 0, t: 0, w: 1, h: 1 };
  const borner = () => {
    // La photo agrandie couvre toujours la scène : on ne peut pas la tirer au point de laisser un vide.
    const axe = (t: number, debut: number, taille: number, tout: number) => {
      const demi = (taille * z.s) / 2, c = debut + taille / 2;
      const a = demi - c, b = tout - c - demi;
      return borne(t, Math.min(a, b), Math.max(a, b));
    };
    z.x = axe(z.x, cadre.l, cadre.w, scene.clientWidth);
    z.y = axe(z.y, cadre.t, cadre.h, scene.clientHeight);
  };
  const appliquer = (doux = false) => {
    z.s = borne(z.s, 1, ZMAX);
    if (z.s < 1.01) { z.s = 1; z.x = 0; z.y = 0; } else borner();
    img.style.transition = doux ? 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none';
    img.style.transform = `translate3d(${z.x.toFixed(1)}px, ${z.y.toFixed(1)}px, 0) scale(${z.s.toFixed(4)})`;
    vue.classList.toggle('zoom', z.s > 1);
  };
  // Zoomer en gardant immobile le point de la photo situé sous (px, py).
  const zoomer = (s: number, px: number, py: number, doux = false) => {
    const ns = borne(s, 1, ZMAX), cx = cadre.l + cadre.w / 2, cy = cadre.t + cadre.h / 2;
    const ux = (px - cx - z.x) / z.s, uy = (py - cy - z.y) / z.s;
    z.s = ns; z.x = px - cx - ux * ns; z.y = py - cy - uy * ns;
    appliquer(doux);
  };
  const placer = () => {
    if (vue.hidden || img.hidden) return;
    const W = scene.clientWidth, H = scene.clientHeight, haut = 76, cote = 16;
    const lw = W - cote * 2, lh = H - haut - 8, r = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1.5;
    let w = lw, h = lw / r;
    if (h > lh) { h = lh; w = lh * r; }
    cadre = { l: (W - w) / 2, t: haut + (lh - h) / 2, w, h };
    Object.assign(img.style, { left: `${cadre.l}px`, top: `${cadre.t}px`, width: `${w}px`, height: `${h}px` });
    appliquer();
  };
  addEventListener('resize', placer);
  const local = (e: { clientX: number; clientY: number }) => {
    const r = scene.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const arreterFilm = () => {
    if (!video.getAttribute('src')) return;
    video.pause();
    video.removeAttribute('src');
    video.load();
  };

  /* Passage d'une photo à l'autre, fluide même sur téléphone : les voisines sont décodées à l'avance ;
     l'ancienne photo part du côté où on l'a poussée (depuis l'endroit où le doigt l'a lâchée),
     la nouvelle n'apparaît qu'une fois prête, en glissant depuis l'autre côté. Jamais de saut ni de retour au centre. */
  const pretes = new Map<string, Promise<void>>();
  // Prête = décodée ; à défaut (onglet en arrière-plan, vieux navigateur), simplement chargée, et jamais plus d'une seconde et demie d'attente.
  const pret = (im: HTMLImageElement) => Promise.race([
    im.decode().catch(() => undefined),
    new Promise<void>((ok) => { if (im.complete && im.naturalWidth) ok(); else { im.addEventListener('load', () => ok(), { once: true }); im.addEventListener('error', () => ok(), { once: true }); } }).then(() => new Promise<void>((ok) => window.setTimeout(ok, 120))),
    new Promise<void>((ok) => window.setTimeout(ok, 1500)),
  ]);
  const preparer = (src: string) => {
    if (!src) return Promise.resolve();
    let pr = pretes.get(src);
    if (!pr) {
      const im = new Image();
      im.decoding = 'async';
      im.src = src;
      pr = pret(im);
      pretes.set(src, pr);
      if (pretes.size > 12) pretes.delete(pretes.keys().next().value as string);
    }
    return pr;
  };
  let jeton = 0;
  const DOUX = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const montrer = (i: number, sens = 0, depuisX = 0) => {
    const ancienne = liste[pos], suite = !vue.hidden && ancienne && !ancienne.film && !img.hidden && !!img.getAttribute('src');
    pos = mod(i, liste.length);
    const p = liste[pos];
    const n = ++jeton;
    z.s = 1; z.x = 0; z.y = 0;
    vue.classList.remove('zoom');
    vue.classList.toggle('vue--film', p.film);
    // L'ancienne photo s'en va : une copie posée là où elle est, qui glisse hors de l'écran et s'efface.
    if (suite && !calme) {
      const fantome = img.cloneNode() as HTMLImageElement;
      fantome.style.transition = 'none';
      fantome.style.transform = `translate3d(${depuisX.toFixed(1)}px, 0, 0)`;
      fantome.style.pointerEvents = 'none';
      scene.appendChild(fantome);
      const loin = sens ? -sens * scene.clientWidth * 0.75 : 0;
      requestAnimationFrame(() => {
        fantome.style.transition = `transform 0.5s ${DOUX}, opacity 0.32s ease-out`;
        fantome.style.transform = `translate3d(${loin.toFixed(1)}px, 0, 0) scale(${sens ? 1 : 0.97})`;
        fantome.style.opacity = '0';
      });
      window.setTimeout(() => fantome.remove(), 560);
    }
    if (p.film) {
      img.hidden = true; img.removeAttribute('src');
      video.hidden = false;
      video.poster = p.affiche ?? '';
      video.src = p.src;
      video.setAttribute('aria-label', p.alt);
      if (p.debut) video.addEventListener('loadedmetadata', () => { video.currentTime = p.debut ?? 0; }, { once: true });
      video.play().catch(() => undefined);
    } else {
      arreterFilm();
      video.hidden = true; img.hidden = false;
      // La nouvelle reste invisible tant qu'elle n'est pas décodée, puis entre en glissant depuis l'autre côté.
      img.style.transition = 'none';
      img.style.opacity = '0';
      preparer(p.src).then(() => {
        if (n !== jeton) return;
        img.src = p.src;
        img.alt = p.alt;
        return pret(img);
      }).then(() => {
        if (n !== jeton) return;
        placer();
        const dep = calme ? 0 : sens * Math.min(scene.clientWidth * 0.18, 90);
        img.style.transform = `translate3d(${dep}px, 0, 0) scale(${sens || calme ? 1 : 0.98})`;
        void img.offsetWidth; // le navigateur prend la position de départ avant d'animer
        img.style.transition = calme ? 'none' : `transform 0.55s ${DOUX}, opacity 0.4s ease-out`;
        img.style.transform = 'translate3d(0px, 0px, 0px) scale(1)';
        img.style.opacity = '1';
      });
    }
    regleCompteur(cpt, pos + 1);
    const centaines = cpt ? $('.cpt__col', cpt) : null;
    if (centaines) centaines.style.display = liste.length < 100 ? 'none' : '';
    if (total) total.textContent = `/ ${liste.length}`;
    if (legende) legende.textContent = p.legende;
    if (versProjet) {
      // Depuis un mur de collection : un raccourci vers le projet de la photo, ouvert directement sur elle.
      const id = p.projet;
      versProjet.hidden = !id || !!$('[data-page="projet"]');
      if (id) versProjet.href = `/v2/projet/${id}/#photo-${p.rang ?? 1}`;
    }
    // Les deux voisines sont préparées pendant qu'on regarde celle-ci.
    [1, -1].forEach((d) => { const v = liste[mod(pos + d, liste.length)]; if (!v.film) preparer(v.src); });
  };

  const ouvrir = (pieces: Piece[], i: number, depuis: HTMLElement) => {
    liste = pieces; avant = depuis;
    vue.hidden = false;
    html.classList.add('vue-ouverte');
    lenis?.stop();
    montrer(i);
    $('[data-vue-fermer]', vue)?.focus({ preventScroll: true });
    dispatchEvent(new CustomEvent('valg-vue', { detail: true }));
  };
  const fermer = () => {
    arreterFilm();
    jeton++;
    img.removeAttribute('src');
    vue.hidden = true;
    html.classList.remove('vue-ouverte');
    lenis?.start();
    avant?.focus({ preventScroll: true });
    dispatchEvent(new CustomEvent('valg-vue', { detail: false }));
  };
  document.addEventListener('click', (e) => {
    const cible = e.target as HTMLElement;
    const it = cible.closest<HTMLElement>('.mur__item');
    if (it) {
      e.preventDefault();
      const murs = enOrdre($$('.mur__item', it.closest<HTMLElement>('.mur') ?? document.body)).filter((x) => !x.hidden);
      ouvrir(murs.map((m) => ({
        film: false, src: m.dataset.grand ?? '', alt: $('img', m)?.getAttribute('alt') ?? '',
        legende: m.dataset.legende ?? '', projet: m.dataset.projet, rang: m.dataset.rang,
      })), murs.indexOf(it), it);
      return;
    }
    // Les films de l'accueil, en grand, avec le son et les commandes ; ils reprennent là où on les regardait.
    const b = cible.closest<HTMLElement>('[data-vue-films]');
    if (b) {
      const films = $$<HTMLVideoElement>('[data-film]');
      ouvrir(films.map((v) => ({
        film: true, src: v.currentSrc || v.src, affiche: v.poster, alt: v.dataset.titre ?? 'Film',
        legende: v.dataset.titre ?? '', debut: v.currentTime,
      })), Number(b.dataset.vueFilms) || 0, b);
    }
  });
  $('[data-vue-fermer]', vue)?.addEventListener('click', fermer);
  $('[data-vue-prec]', vue)?.addEventListener('click', () => montrer(pos - 1, -1));
  $('[data-vue-suiv]', vue)?.addEventListener('click', () => montrer(pos + 1, 1));
  vue.addEventListener('click', (e) => { if (e.target === vue || (enFilm() && e.target === scene)) fermer(); });

  /* Doigts et souris sur la photo : un doigt déplace (si zoomée) ou fait passer à la voisine, deux doigts zooment,
     un double toucher (ou double clic) zoome à cet endroit puis revient. Un toucher à côté de la photo ferme. */
  const doigts = new Map<number, { x: number; y: number }>();
  let geste = { s: 1, x: 0, y: 0, mx: 0, my: 0, d: 0 }, depart = { x: 0, y: 0, t: 0 }, bouge = 0, plusieurs = false, tape = { x: 0, y: 0, t: 0 };
  const milieu = () => {
    const pts = [...doigts.values()];
    const m = pts.reduce((a, p) => ({ x: a.x + p.x / pts.length, y: a.y + p.y / pts.length }), { x: 0, y: 0 });
    const d = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    return { ...m, d };
  };
  const reprendre = () => { const m = milieu(); geste = { s: z.s, x: z.x, y: z.y, mx: m.x, my: m.y, d: m.d }; };
  scene.addEventListener('pointerdown', (e) => {
    if (enFilm() || (e.pointerType === 'mouse' && e.button)) return;
    e.preventDefault();
    try { scene.setPointerCapture(e.pointerId); } catch { /* pointeur déjà relâché */ }
    const p = local(e);
    if (!doigts.size) { depart = { ...p, t: e.timeStamp }; bouge = 0; plusieurs = false; }
    doigts.set(e.pointerId, p);
    if (doigts.size > 1) plusieurs = true;
    reprendre();
  });
  scene.addEventListener('pointermove', (e) => {
    if (!doigts.has(e.pointerId)) return;
    const p = local(e);
    doigts.set(e.pointerId, p);
    bouge = Math.max(bouge, Math.hypot(p.x - depart.x, p.y - depart.y));
    const m = milieu(), cx = cadre.l + cadre.w / 2, cy = cadre.t + cadre.h / 2;
    if (doigts.size > 1 && geste.d > 0) {
      const ns = borne((geste.s * m.d) / geste.d, 1, ZMAX);
      const ux = (geste.mx - cx - geste.x) / geste.s, uy = (geste.my - cy - geste.y) / geste.s;
      z.s = ns; z.x = m.x - cx - ux * ns; z.y = m.y - cy - uy * ns;
      appliquer();
    } else if (z.s > 1) {
      z.x = geste.x + (m.x - geste.mx); z.y = geste.y + (m.y - geste.my);
      appliquer();
    } else if (!plusieurs && bouge > 6) {
      // Sans zoom, la photo suit le doigt à l'horizontale : on la lâche pour passer à la voisine.
      img.style.transition = 'none';
      img.style.transform = `translate3d(${(m.x - geste.mx).toFixed(1)}px, 0, 0)`;
    }
  });
  const lacher = (e: PointerEvent) => {
    if (!doigts.has(e.pointerId)) return;
    const p = local(e);
    doigts.delete(e.pointerId);
    if (doigts.size) { reprendre(); return; } // un doigt reste posé : il reprend la main
    if (e.type === 'pointercancel' || plusieurs) { appliquer(true); return; }
    const dx = p.x - depart.x, dy = p.y - depart.y;
    // Un glissement franc, ou un petit coup rapide, fait passer à la voisine.
    const vif = e.timeStamp - depart.t < 260 && Math.abs(dx) > 24;
    if (z.s <= 1 && (Math.abs(dx) > 50 || vif) && Math.abs(dx) > Math.abs(dy)) { const s = dx < 0 ? 1 : -1; montrer(pos + s, s, dx); return; }
    if (bouge < 8) {
      const surPhoto = p.x >= cadre.l && p.x <= cadre.l + cadre.w && p.y >= cadre.t && p.y <= cadre.t + cadre.h;
      if (e.timeStamp - tape.t < 320 && Math.hypot(p.x - tape.x, p.y - tape.y) < 40) {
        tape.t = 0;
        if (z.s > 1) { z.s = 1; appliquer(true); } else zoomer(2.5, p.x, p.y, true);
        return;
      }
      tape = { x: p.x, y: p.y, t: e.timeStamp };
      if (z.s <= 1 && !surPhoto) { fermer(); return; }
    }
    appliquer(true);
  };
  scene.addEventListener('pointerup', lacher);
  scene.addEventListener('pointercancel', lacher);

  // Molette, pincement du pavé tactile (Ctrl + molette) : zoom autour du pointeur, jamais de défilement de la page.
  vue.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (enFilm()) return;
    const p = local(e), k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    zoomer(z.s * Math.exp(-e.deltaY * k * (e.ctrlKey ? 0.01 : 0.0022)), p.x, p.y);
  }, { passive: false });
  // Safari (Mac et iPhone) : ses propres gestes de pincement ne doivent jamais zoomer la page.
  let gs = 1;
  const safari = (e: Event) => {
    if (vue.hidden) return;
    e.preventDefault();
    const g = e as Event & { scale: number; clientX: number; clientY: number };
    if (e.type === 'gesturestart') gs = z.s;
    else if (e.type === 'gesturechange' && !doigts.size && !enFilm() && g.clientX !== undefined) { const p = local(g); zoomer(gs * g.scale, p.x, p.y); }
  };
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((t) => document.addEventListener(t, safari, { passive: false }));
  // iPhone : aucun glissement ne doit atteindre la page (les commandes du film gardent leur doigt).
  vue.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1 || !(e.target as HTMLElement).closest('video')) e.preventDefault();
  }, { passive: false });

  // Clavier : capté avant le reste de la page, pour que rien derrière ne réagisse.
  addEventListener('keydown', (e) => {
    if (vue.hidden) return;
    e.stopPropagation();
    const k = e.key, cmd = e.ctrlKey || e.metaKey, t = e.target as HTMLElement, W = scene.clientWidth / 2, H = scene.clientHeight / 2;
    if (k === 'Escape') { e.preventDefault(); fermer(); return; }
    if (k === '+' || k === '=') { e.preventDefault(); if (!enFilm()) zoomer(z.s * 1.5, W, H, true); return; }
    if (k === '-' || k === '_') { e.preventDefault(); if (!enFilm()) zoomer(z.s / 1.5, W, H, true); return; }
    if (k === '0' && cmd) { e.preventDefault(); z.s = 1; appliquer(true); return; }
    if (k === 'Tab') {
      // Le focus reste dans la visionneuse : il ne part jamais sur la page, qui défilerait pour le montrer.
      const f = $$('button, a[href], video[controls]', vue).filter((x) => !x.hidden && x.offsetParent !== null);
      const i = f.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      f[mod(i + (e.shiftKey ? -1 : 1), f.length)]?.focus({ preventScroll: true });
      return;
    }
    if (t.closest('video')) return; // les flèches et l'espace pilotent le film
    if (k === 'ArrowLeft' || k === 'ArrowRight') {
      e.preventDefault();
      if (z.s > 1) { z.x += k === 'ArrowLeft' ? 80 : -80; appliquer(true); } else { const s = k === 'ArrowLeft' ? -1 : 1; montrer(pos + s, s); }
      return;
    }
    if (k === 'ArrowUp' || k === 'ArrowDown') { e.preventDefault(); if (z.s > 1) { z.y += k === 'ArrowUp' ? 80 : -80; appliquer(true); } return; }
    if (['PageUp', 'PageDown', 'Home', 'End'].includes(k) || (k === ' ' && !t.closest('button, a'))) e.preventDefault();
  }, true);
}

/* ───────── Passages entre le papier et le noir ───────── */
function initPassages() {
  const page = $('.page');
  // Arrivée par le volet d'une collection : le drapeau a servi, on l'efface (la mise en scène est faite par les styles).
  if (memo.lire('valg-porte')) {
    memo.oter('valg-porte');
    pagePrete.then(() => window.setTimeout(() => {
      // Les volets sont déjà là, découverts par la porte : ils ne doivent pas se déplier une seconde fois.
      $$('.volets--arrive').forEach((v) => v.classList.remove('volets--arrive'));
      html.classList.remove('arrive-par-porte');
    }, 1350));
  }
  // Retour vers une page claire : le papier renaît du noir, depuis le centre.
  if (html.classList.contains('arrive-du-noir') && page) {
    memo.oter('valg-retour');
    if (calme) {
      html.classList.remove('arrive-du-noir');
    } else {
      const o = { r: 0 };
      const maj = () => { page.style.clipPath = `circle(${o.r.toFixed(1)}px at 50% ${(innerHeight / 2).toFixed(0)}px)`; };
      maj();
      html.classList.remove('arrive-du-noir');
      html.dataset.scene = 'nuit';
      // Le papier ne renaît qu'une fois la page installée : sinon l'installation tombe au milieu du mouvement et le fait saccader.
      pagePrete.then(() => gsap.to(o, {
        r: Math.hypot(innerWidth, innerHeight) / 2 + 60, duration: 1.2, ease: 'expo.out', onUpdate: maj,
        onComplete: () => { page.style.clipPath = ''; html.dataset.scene = 'papier'; },
      }));
    }
  }
  // Arrivée dans un projet : une onde part de l'endroit où le papier a disparu.
  const brut = memo.lire('valg-arrivee');
  if (brut) {
    memo.oter('valg-arrivee');
    const onde = $('.onde');
    if (onde && !calme && html.dataset.scene === 'nuit') {
      try {
        const { x, y } = JSON.parse(brut) as { x: number; y: number };
        onde.style.setProperty('--ix', `${(x * 100).toFixed(1)}%`);
        onde.style.setProperty('--iy', `${(y * 100).toFixed(1)}%`);
        gsap.set(onde, { scale: 0, opacity: 0.85 });
        pagePrete.then(() => gsap.to(onde, { scale: 80, opacity: 0, duration: 1.4, ease: 'expo.out' }));
      } catch { /* valeur illisible : pas d'onde */ }
    }
  }
  // Quitter le noir pour une page claire : on le signale à la page suivante.
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (!a || html.dataset.scene !== 'nuit' || a.origin !== location.origin || a.target === '_blank') return;
    if (a.pathname.startsWith('/v2/') && !a.pathname.startsWith('/v2/projet/')) memo.ecrire('valg-retour', '1');
  });
  addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });
}

/* ───────── Textes qui se révèlent ───────── */
function initTextes() {
  if (calme) return;
  $$('[data-entree]').forEach((el) => {
    const d = SplitText.create(el, { type: 'words,chars', mask: 'chars' });
    gsap.from(d.chars, { yPercent: 118, duration: 1, ease: 'power4.out', stagger: 0.02, delay: 0.25 });
    gsap.fromTo(el, { '--wdth': 62 }, { '--wdth': 125, duration: 1.4, ease: 'power3.out', delay: 0.25 });
  });
  // Les mots d'une phrase s'allument un à un pendant qu'on la fait défiler (manifeste de l'accueil, texte d'une collection).
  $$('[data-lit]').forEach((el) => {
    const d = SplitText.create(el, { type: 'words' });
    gsap.fromTo(d.words, { opacity: 0.13 }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 84%', end: 'bottom 48%', scrub: true } });
  });
  $$('[data-revele]').forEach((el) => {
    const d = SplitText.create(el, { type: 'lines,words', mask: 'lines' });
    gsap.from(d.words, { yPercent: 115, duration: 0.95, ease: 'power4.out', stagger: 0.045, scrollTrigger: { trigger: el, start: 'top 86%' } });
  });
}

initPassages();
initBarre();
initCurseur();
initBoutons();
// Les sections épinglées sont créées dans l'ordre de la page, une fois les polices prêtes.
document.fonts.ready.then(() => {
  initAccueil();
  initAnneau();
  initFinAccueil();
  initCollection();
  initVolets();
  initProjet();
  initVue();
  initTextes();
  ScrollTrigger.refresh();
  requestAnimationFrame(() => requestAnimationFrame(() => signalerPrete()));
});
