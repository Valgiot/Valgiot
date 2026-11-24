// Contact (v2) : la scène de contact (fin de l'accueil et page Contact) — des photos posées en profondeur autour d'une phrase.
// Chargé par src/components/v2/BandeauContact.astro. Ne dépend pas du script général du site (site.ts) :
// il lui emprunte seulement, s'il est là, le défilement adouci (window.valgDefile), l'encre du bouton et le cadre des photos.
import gsap from 'gsap';

const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sourisFine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const borne = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

// Départ vers un projet : le papier s'effondre sur la photo choisie (même passage que partout sur le site).
let parti = false;
function partir(el: HTMLElement, url: string) {
  if (parti) return;
  const page = $('.page');
  const r = el.getBoundingClientRect();
  const cx = borne(r.left + r.width / 2, 0, innerWidth), cy = borne(r.top + r.height / 2, 0, innerHeight);
  try { sessionStorage.setItem('valg-arrivee', JSON.stringify({ x: cx / innerWidth, y: cy / innerHeight })); } catch { /* navigation privée */ }
  if (calme || !page) { location.href = url; return; }
  parti = true;
  (window as unknown as { valgDefile?: { stop: () => void } }).valgDefile?.stop();
  document.documentElement.dataset.scene = 'nuit';
  const haut = page.getBoundingClientRect().top;
  const o = { r: Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 40 };
  gsap.to(o, {
    r: 0, duration: 0.95, ease: 'expo.in',
    onUpdate: () => { page.style.clipPath = `circle(${o.r.toFixed(1)}px at ${cx.toFixed(1)}px ${(cy - haut).toFixed(1)}px)`; },
    onComplete: () => { location.href = url; },
  });
}

/** Ajoute « est-vue » à un élément la première fois qu'il arrive à l'écran (les styles font le reste). */
function quandVu(elements: HTMLElement[], marge: string) {
  if (calme || !('IntersectionObserver' in window)) { elements.forEach((e) => e.classList.add('est-vue')); return; }
  const guet = new IntersectionObserver((vus) => vus.forEach((v) => { if (v.isIntersecting) { v.target.classList.add('est-vue'); guet.unobserve(v.target); } }), { rootMargin: marge });
  elements.forEach((e) => guet.observe(e));
}

function initScene(ctp: HTMLElement) {
  ctp.classList.add('est-pret');
  $$<HTMLAnchorElement>('[data-ctp-photo]', ctp).forEach((a) =>
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      partir(a, a.href);
    }),
  );
  // La scène s'installe quand elle arrive à l'écran (tout de suite sur la page Contact, à la fin du défilement sur l'accueil).
  quandVu([ctp], '0px 0px -30% 0px');
  if (calme) return;
  // Profondeur : les photos suivent un peu la souris, et glissent à des vitesses différentes quand la scène défile.
  let vx = 0, vy = 0, x = 0, y = 0, sy = NaN;
  if (sourisFine) addEventListener('pointermove', (e) => { vx = (e.clientX / innerWidth) * 2 - 1; vy = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
  gsap.ticker.add(() => {
    const r = ctp.getBoundingClientRect();
    if (r.bottom < -120 || r.top > innerHeight + 120) return;
    if (Math.abs(vx - x) > 0.001 || Math.abs(vy - y) > 0.001) {
      x += (vx - x) * 0.06; y += (vy - y) * 0.06;
      ctp.style.setProperty('--px', x.toFixed(3));
      ctp.style.setProperty('--py', y.toFixed(3));
    }
    // Distance parcourue depuis que le haut de la scène a touché le haut de l'écran (négative tant qu'elle arrive).
    const d = borne(-r.top, -innerHeight, innerHeight);
    if (d !== sy) { sy = d; ctp.style.setProperty('--sy', d.toFixed(1)); }
  });
}

$$('[data-ctp]').forEach(initScene);
// Page Contact : les étapes de « Comment ça se passe » arrivent en douceur quand on les atteint.
quandVu($$('[data-ctp-arrive]'), '0px 0px -8% 0px');
