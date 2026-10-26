'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Lenis from 'lenis';
import Cursor from '@/components/Cursor';

// ─── Animation timing (real-time, no timeScale) ────────────────────────────

// ─── Seeded PRNG (mulberry32) ────────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Pile offsets ────────────────────────────────────────────────────────────
const PILE_OFFSETS = [
  { x:  0, y:  0 }, { x:  3, y: -2 }, { x: -4, y:  3 }, { x:  2, y: -5 },
  { x: -3, y:  4 }, { x:  5, y: -1 }, { x: -2, y:  5 }, { x:  4, y: -4 },
  { x: -5, y:  2 }, { x:  1, y:  5 }, { x: -4, y: -3 },
];

// ─── BURST PHOTOS ────────────────────────────────────────────────────────────
// 11 photos whose FINAL positions (after burst) live in the first viewport.
// cx/cy are fractions of vw/vh respectively (viewport-relative, since burst
// photos use position:fixed throughout the intro, then switch to absolute).
// The title sits at ~50% from viewport top, so inner columns leave a gap
// at 42–58vh. Edge columns (5%, 94%) may span freely.
const BURST_PHOTOS = [
  { src: '/assets/moody green.jpg',        aspect: 4/3,  cx: 0.05, cy: 0.07, w: 0.10 },
  { src: '/assets/aesthetic.jpg',          aspect: 3/4,  cx: 0.27, cy: 0.20, w: 0.12 },
  { src: '/assets/travel (1).jpg',         aspect: 2/3,  cx: 0.73, cy: 0.38, w: 0.12 },
  { src: '/assets/download (10).jpg',      aspect: 4/3,  cx: 0.94, cy: 0.17, w: 0.14 },
  { src: '/assets/download (2).jpg',       aspect: 2/3,  cx: 0.27, cy: 0.73, w: 0.12 },
  { src: '/assets/cafe.jpg',               aspect: 4/3,  cx: 0.73, cy: 0.72, w: 0.19 },
  { src: '/assets/architecture.jpg',       aspect: 4/3,  cx: 0.05, cy: 0.70, w: 0.10 },
  { src: '/assets/travel.jpg',             aspect: 2/3,  cx: 0.50, cy: 0.82, w: 0.12 },
  { src: '/assets/Beach.jpg',              aspect: 4/3,  cx: 0.86, cy: 0.08, w: 0.10 },
  { src: '/assets/friends.jpg',            aspect: 2/3,  cx: 0.50, cy: 0.18, w: 0.12 },
  { src: '/assets/travel_train_travel.jpg',aspect: 4/3,  cx: 0.05, cy: 0.92, w: 0.14 },
];

// ─── SCROLL PHOTOS ───────────────────────────────────────────────────────────
const SCROLL_PHOTOS = [
  { src: '/assets/849632285995035493.jpg',     aspect: 4/5   },
  { src: '/assets/Beach cafe (1).jpg',         aspect: 4/3   },
  { src: '/assets/Beach cafe (2).jpg',         aspect: 4/3   },
  { src: '/assets/Beach cafe.jpg',             aspect: 4/3   },
  { src: '/assets/aesthetic.webp',             aspect: 3/4   },
  { src: '/assets/beach side.jpg',             aspect: 4/3   },
  { src: '/assets/cafe aesthetic (1).jpg',     aspect: 4/3   },
  { src: '/assets/cafe aesthetic.jpg',         aspect: 4/3   },
  { src: '/assets/download (1).jpg',           aspect: 2/3   },
  { src: '/assets/download (11).jpg',          aspect: 2/3   },
  { src: '/assets/download (12).jpg',          aspect: 2/3   },
  { src: '/assets/download (13).jpg',          aspect: 4/3   },
  { src: '/assets/download (14).jpg',          aspect: 4/3   },
  { src: '/assets/download (15).jpg',          aspect: 2/3   },
  { src: '/assets/download (16).jpg',          aspect: 4/3   },
  { src: '/assets/download (17).jpg',          aspect: 2/3   },
  { src: '/assets/download (18).jpg',          aspect: 4/3   },
  { src: '/assets/download (19).jpg',          aspect: 4/3   },
  { src: '/assets/download (20).jpg',          aspect: 4/3   },
  { src: '/assets/download (21).jpg',          aspect: 2/3   },
  { src: '/assets/download (22).jpg',          aspect: 4/3   },
  { src: '/assets/download (23).jpg',          aspect: 4/3   },
  { src: '/assets/download (3).jpg',           aspect: 1/1   },
  { src: '/assets/download (4).jpg',           aspect: 4/3   },
  { src: '/assets/download (5).jpg',           aspect: 1/1   },
  { src: '/assets/download (6).jpg',           aspect: 2/3   },
  { src: '/assets/download (7).jpg',           aspect: 4/3   },
  { src: '/assets/download (8).jpg',           aspect: 4/3   },
  { src: '/assets/download (9).jpg',           aspect: 4/3   },
  { src: '/assets/late night 💤.jpg',          aspect: 2/3   },
  { src: '/assets/minimalist design.jpg',      aspect: 4/3   },
  { src: '/assets/moody sky aesthetic.webp',   aspect: 2/3   },
  { src: '/assets/moody.jpg',                  aspect: 2/3   },
  { src: '/assets/phone wallpaper.webp',       aspect: 9/16  },
  { src: '/assets/soft sky aesthetic.webp',    aspect: 2/3   },
  { src: '/assets/wave 🌊 Beach.jpg',          aspect: 4/3   },
  { src: '/assets/\u201cMinimal Vintage Cafe Aesthetic _ Retro Vibes\u201d.jpg',               aspect: 4/3 },
  { src: '/assets/\u201cMinimalist Scandinavian Dining Aesthetic _ Clean Modern Design\u201d.jpg', aspect: 4/3 },
  // ── New photos ──────────────────────────────────────────────────────────────
  { src: '/assets/#satinpothos #plantlife #scindapsuspictus….jpg', aspect: 2/3   }, // plant vine, portrait
  { src: '/assets/1148488342519024589.jpg',    aspect: 2/3   }, // vintage green car, portrait
  { src: '/assets/1980 P150X Vespa.jpg',       aspect: 2/3   }, // black & white Vespa, portrait
  { src: '/assets/359584351524915951.jpg',     aspect: 2/3   }, // banana leaf & sky, portrait
  { src: '/assets/381046818490992166.jpg',     aspect: 2/3   }, // Range Rover + olive tree, portrait
  { src: '/assets/683421312236182778.jpg',     aspect: 3/4   }, // fiddle-leaf fig & sky
  { src: '/assets/742953269785267056.jpg',     aspect: 2/3   }, // moody tropical leaves, portrait
  { src: '/assets/850195235952401620.jpg',     aspect: 2/3   }, // pink bougainvillea & sky, portrait
  { src: '/assets/880383427182110633.jpg',     aspect: 3/4   }, // golden ocean waves
  { src: '/assets/922112092481155761.jpg',     aspect: 3/4   }, // birds on wire with green box
  { src: '/assets/940478334714045364.jpg',     aspect: 3/4   }, // cat + red flowers collage
  { src: '/assets/990299406197230256.jpg',     aspect: 2/3   }, // orange cat close-up, portrait
  { src: '/assets/Flower.jpg',                 aspect: 2/3   }, // yellow wildflowers, portrait
  { src: '/assets/konkan diaries.jpg',         aspect: 2/3   }, // palm trees looking up, portrait
  { src: '/assets/_).jpg',                     aspect: 2/3   }, // dramatic clouds composite, portrait
  { src: '/assets/✨.jpg',                     aspect: 3/4   }, // minimal cafe arched booth
  { src: '/assets/The best rustic style decoration ideas from Greek hotels -The Hotel Trotter.jpg', aspect: 3/4 }, // Greek hotel archway
];

// ─── Scroll layout (pure, seeded, module scope) ───────────────────────────────
const COL_X       = [0.05, 0.27, 0.50, 0.73, 0.94];
const COL_Y0      = [0, 25, 12, 38, 50];
const SPACING_VH  = 50;
const JITTER_V    = 4;
const JITTER_H    = 1.5;
const SCROLL_START_VH = 105;  // scroll photos start just below first viewport
const TRAIL_VH    = 40;

interface ScrollPhoto { src: string; aspect: number; cxFrac: number; cyVH: number; widthFrac: number; }

function buildScrollLayout(): ScrollPhoto[] {
  const rng = mulberry32(42);
  const columns: number[][] = [[], [], [], [], []];
  SCROLL_PHOTOS.forEach((_, i) => columns[i % 5].push(i));
  const placed: ScrollPhoto[] = [];
  columns.forEach((colPhotos, col) => {
    colPhotos.forEach((photoIdx, row) => {
      const ph = SCROLL_PHOTOS[photoIdx];
      const jV = (rng() * 2 - 1) * JITTER_V;
      const jH = (rng() * 2 - 1) * (JITTER_H / 100);
      const isEdge = col === 0 || col === 4;
      let widthFrac: number;
      if (ph.aspect >= 1.2)       widthFrac = isEdge ? 0.10 : 0.19;
      else if (ph.aspect <= 0.7)  widthFrac = isEdge ? 0.08 : 0.12;
      else                        widthFrac = isEdge ? 0.07 : 0.10;
      placed.push({ src: ph.src, aspect: ph.aspect,
        cxFrac: COL_X[col] + jH,
        cyVH:   SCROLL_START_VH + COL_Y0[col] + row * SPACING_VH + jV,
        widthFrac });
    });
  });
  return placed;
}

const SCROLL_LAYOUT = buildScrollLayout();
const TOTAL_VH = Math.max(...SCROLL_LAYOUT.map((p) => p.cyVH)) + SPACING_VH / 2 + TRAIL_VH;

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const burstRefs     = useRef<(HTMLDivElement | null)[]>([]);
  const plusRef       = useRef<HTMLDivElement>(null);
  const titleRef      = useRef<HTMLDivElement>(null);
  const navRef        = useRef<HTMLElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const [introComplete, setIntroComplete] = useState(false);
  const hasRunRef = useRef(false);  // one-shot guard; resets in cleanup so remount re-runs

  useLayoutEffect(() => {
    // Force scroll to top — browser may restore scroll position on refresh
    window.scrollTo(0, 0);

    // One-shot guard: prevents double-run but resets so a real remount re-runs
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    // Lock scroll immediately
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = vw / 2;
    const cy = vh / 2;

    // ── Compute burst photo grid positions in VIEWPORT px ─────────────────────
    // (burst photos stay position:fixed throughout intro → viewport coords)
    type GridPos = { widthPx: number; heightPx: number; topPx: number; leftPx: number };
    const gridPos: GridPos[] = BURST_PHOTOS.map((bp) => {
      const widthPx  = bp.w  * vw;
      const heightPx = widthPx / bp.aspect;
      const leftPx   = bp.cx * vw - widthPx / 2;
      const topPx    = bp.cy * vh - heightPx / 2;
      return { widthPx, heightPx, leftPx, topPx };
    });

    // ── Place burst photos at PILE centre (fixed, invisible) ──────────────────
    BURST_PHOTOS.forEach((_, i) => {
      const el  = burstRefs.current[i];
      if (!el) return;
      const gp  = gridPos[i];
      const off = PILE_OFFSETS[i];
      gsap.set(el, {
        position:   'fixed',
        top:        0,
        left:       0,
        x:          cx - gp.widthPx / 2 + off.x,
        y:          cy - gp.heightPx / 2 + off.y,
        width:      gp.widthPx,
        height:     gp.heightPx,
        opacity:    0,
        visibility: 'visible',   // unhide now that GSAP controls geometry
        filter:     'blur(0px)',
        zIndex:     500 + i,
        willChange: 'transform, opacity, filter',
      });
    });

    if (plusRef.current)  gsap.set(plusRef.current,  { visibility: 'visible', scale: 0, transformOrigin: 'center center' });
    if (titleRef.current) gsap.set(titleRef.current, { opacity: 0, filter: 'blur(16px)' });

    // ── Master timeline ───────────────────────────────────────────────────────
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          // Switch burst photos from fixed → absolute (scroll=0 so coords match)
          const scrollY = window.scrollY;
          BURST_PHOTOS.forEach((_, i) => {
            const el = burstRefs.current[i];
            if (!el) return;
            const gp = gridPos[i];
            gsap.set(el, {
              position:   'absolute',
              top:        0,
              left:       0,
              x:          gp.leftPx,
              y:          gp.topPx + scrollY,   // adjust if somehow scrolled
              width:      gp.widthPx,
              height:     gp.heightPx,
              zIndex:     2,
              willChange: 'auto',
              clearProps: 'filter',
            });
          });
          // Unlock scroll
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
          setIntroComplete(true);
        },
      });
      // ── PILE: 0.4 s → 1.5 s ──────────────────────────────────────────────────
      // Photo 1 — blur-in, 0.45s
      tl.fromTo(burstRefs.current[0],
        { opacity: 0.35, filter: 'blur(12px)' },
        { opacity: 1,    filter: 'blur(0px)', duration: 0.45, ease: 'power2.out' },
        0.40);
      // Photo 2 — blur-in, 0.30s
      tl.fromTo(burstRefs.current[1],
        { opacity: 0.35, filter: 'blur(12px)' },
        { opacity: 1,    filter: 'blur(0px)', duration: 0.30, ease: 'power2.out' },
        0.60);
      // Photo 3 — blur-in, 0.30s
      tl.fromTo(burstRefs.current[2],
        { opacity: 0.35, filter: 'blur(12px)' },
        { opacity: 1,    filter: 'blur(0px)', duration: 0.30, ease: 'power2.out' },
        0.75);
      // Photos 4–6 — instant cuts, 0.15s apart
      tl.to(burstRefs.current[3], { opacity: 1, duration: 0, ease: 'none' }, 0.85);
      tl.to(burstRefs.current[4], { opacity: 1, duration: 0, ease: 'none' }, 1.00);
      tl.to(burstRefs.current[5], { opacity: 1, duration: 0, ease: 'none' }, 1.15);
      // Photo 7 — instant cut, slightly longer hold (~0.20s before remaining appear)
      tl.to(burstRefs.current[6], { opacity: 1, duration: 0, ease: 'none' }, 1.30);
      // At 1.5s: remaining photos (indices 7-10) appear instantly in one step
      const remainingEls = burstRefs.current.slice(7).filter(Boolean) as HTMLDivElement[];
      tl.to(remainingEls, { opacity: 1, duration: 0, ease: 'none' }, 1.50);

      // ── PLUS: 1.5 s ───────────────────────────────────────────────────────
      if (plusRef.current)
        tl.to(plusRef.current,
          { scale: 1, duration: 0.25, ease: 'power2.out' },
          1.5);

      // ── BURST: 1.6 s — single tween with stagger ─────────────────────────
      const burstEls  = burstRefs.current.filter(Boolean) as HTMLDivElement[];
      const burstDest = burstEls.map((_, i) => ({ x: gridPos[i].leftPx, y: gridPos[i].topPx }));
      tl.to(burstEls, {
        x: (i: number) => burstDest[i].x,
        y: (i: number) => burstDest[i].y,
        duration: 0.8,
        ease: 'expo.out',
        stagger: { each: 0.02, from: 'start' },
      }, 1.6);

      // ── TITLE: 2.1 s ──────────────────────────────────────────────────────
      if (titleRef.current)
        tl.fromTo(titleRef.current,
          { opacity: 0, filter: 'blur(16px)' },
          { opacity: 1, filter: 'blur(0px)', duration: 0.4, ease: 'power2.out' },
          2.1);

    }, containerRef);

    return () => {
      ctx.revert();
      hasRunRef.current = false;             // allow re-run on next real mount
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Lenis + scroll-driven UI ─────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!introComplete) return;
    const lenis = new Lenis({ lerp: 0.08, wheelMultiplier: 1, touchMultiplier: 1 });
    let rafId: number;
    const raf = (t: number) => { lenis.raf(t); rafId = requestAnimationFrame(raf); };
    rafId = requestAnimationFrame(raf);

    // Show scroll-hint briefly then hide
    const hint = scrollHintRef.current;
    if (hint) {
      hint.classList.add('visible');
      setTimeout(() => { hint.style.opacity = '0'; }, 4000);
    }

    // Nav appears after scrolling past first screen; title + plus fade out
    lenis.on('scroll', ({ scroll }: { scroll: number }) => {
      const nav   = navRef.current;
      const title = titleRef.current;
      const plus  = plusRef.current;
      const vh    = window.innerHeight;

      // Nav in/out
      if (nav) {
        if (scroll > 80) nav.classList.add('nav--visible');
        else              nav.classList.remove('nav--visible');
      }

      // Title + plus fade out between 0.3vh and 0.7vh scroll
      const fadeStart = vh * 0.3;
      const fadeEnd   = vh * 0.7;
      const progress  = Math.max(0, Math.min(1, (scroll - fadeStart) / (fadeEnd - fadeStart)));
      if (title) title.style.opacity = String(1 - progress);
      if (plus)  plus.style.opacity  = String(1 - progress);
    });

    return () => { cancelAnimationFrame(rafId); lenis.destroy(); };
  }, [introComplete]);

  // ── Scroll-reveal (IntersectionObserver) ──────────────────────────────────────
  useEffect(() => {
    if (!introComplete) return;
    // Photos start slightly below with opacity 0; observer fades them in as they enter
    const timer = setTimeout(() => {
      const els = document.querySelectorAll<HTMLElement>('.photo-wrap');
      // Set initial state for reveal
      els.forEach(el => {
        if (el.style.opacity === '0') {
          gsap.set(el, { opacity: 0, y: 20 });
        }
      });
      const obs = new IntersectionObserver(
        (entries) => entries.forEach(e => {
          if (e.isIntersecting) {
            gsap.to(e.target, { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' });
            obs.unobserve(e.target);
          }
        }),
        { rootMargin: '80px 0px 0px 0px', threshold: 0.01 }
      );
      els.forEach(el => obs.observe(el));
    }, 100);
    return () => clearTimeout(timer);
  }, [introComplete]);

  return (
    <>
      {/* ── Custom cursor ─────────────────────────────────────── */}
      <Cursor />

      {/* ── Navigation ────────────────────────────────────────── */}
      <nav ref={navRef} className="nav">
        <div className="nav__logo">Savio Joseph</div>
        <div className="nav__links">
          <a href="#gallery" className="nav__link">Work</a>
          <a href="#about"   className="nav__link">About</a>
          <a href="mailto:saviojoseph@email.com" className="nav__link">Contact</a>
        </div>
      </nav>

      {/* ── Scroll hint ───────────────────────────────────────── */}
      <div ref={scrollHintRef} className="scroll-hint">
        <div className="scroll-hint__line" />
        <span className="scroll-hint__text">Scroll</span>
      </div>

    <div ref={containerRef} style={{ position: 'relative' }}>

      {/* ── Fixed "+" crosshair ───────────────────────────────── */}
      <div
        ref={plusRef}
        aria-hidden="true"
        style={{
          position:   'fixed',
          top:        '3.5vh',
          left:       'calc(50% - 12px)',
          zIndex:     1000,
          width:      '24px',
          height:     '24px',
          pointerEvents: 'none',
          userSelect: 'none',
          visibility: 'hidden',
        }}
      >
        <span style={{ position:'absolute', top:'50%', left:0, right:0, height:'1px', background:'var(--ink)', transform:'translateY(-50%)', display:'block', opacity:0.5 }} />
        <span style={{ position:'absolute', left:'50%', top:0, bottom:0, width:'1px', background:'var(--ink)', transform:'translateX(-50%)', display:'block', opacity:0.5 }} />
      </div>

      {/* ── Fixed title — editorial redesign ─────────────────── */}
      <div
        ref={titleRef}
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          zIndex: 1,
          textAlign: 'center',
          userSelect: 'none', pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Italic display name */}
        <div style={{
          fontFamily: 'var(--font-playfair)',
          fontSize:   'clamp(2.8rem, 5.5vw, 5rem)',
          fontWeight: 400,
          fontStyle:  'italic',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: 'var(--ink)',
        }}>Savio Joseph</div>
        {/* Label below */}
        <div style={{
          marginTop: '0.6rem',
          fontFamily: 'var(--font-dm)',
          fontSize:   '0.6rem',
          fontWeight: 500,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'var(--dust)',
        }}>Photography</div>
      </div>

      {/* Scrollable page ───────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', width: '100%', height: `${TOTAL_VH}vh` }}>

        {/* Burst photos: GSAP owns all geometry; visibility:hidden prevents flash */}
        {BURST_PHOTOS.map((bp, i) => (
          <div
            key={`burst-${i}`}
            ref={(el) => { burstRefs.current[i] = el; }}
            style={{
              position:   'fixed',
              top:        0,
              left:       0,
              overflow:   'hidden',
              zIndex:     500 + i,
              visibility: 'hidden',  // GSAP will set opacity + visibility
              opacity:    0,
              width:      0,
              height:     0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bp.src} alt="" style={{
              width: '100%', height: '100%', objectFit: 'cover',
              display: 'block', pointerEvents: 'none', userSelect: 'none',
            }} />
          </div>
        ))}

        {/* ── Scroll gallery photos ─────────────────────────────── */}
        {SCROLL_LAYOUT.map((item, i) => {
          const widthPct = item.widthFrac * 100;
          const leftPct  = item.cxFrac * 100 - widthPct / 2;
          return (
            <div
              key={`scroll-${i}`}
              className="photo-wrap"
              style={{
                position:    'absolute',
                top:         `${item.cyVH}vh`,
                left:        `${leftPct}vw`,
                width:       `${widthPct}vw`,
                aspectRatio: String(item.aspect),
                zIndex:      2,
                transform:   'translateY(-50%)',
                opacity:     0,   // revealed by IntersectionObserver + GSAP
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', pointerEvents:'none', userSelect:'none' }} />
            </div>
          );
        })}

      </div>{/* end gallery container */}

      {/* ══════════════════════════════════════════════════════
           ABOUT SECTION
         ══════════════════════════════════════════════════════ */}
      <section id="about" className="about">
        {/* Left — editorial quote */}
        <div>
          <p className="t-label" style={{ marginBottom: '2rem' }}>About the Photographer</p>
          <h2 className="about__quote reveal">
            Light is the<br />
            <em>language</em> I speak<br />
            most fluently.
          </h2>
        </div>

        {/* Right — bio */}
        <div className="about__text">
          <p className="t-label">Savio Joseph · Kerala, India</p>
          <p className="about__body">
            I am an aesthetic, minimalistic photographer drawn to the quiet moments
            between things — the way sunlight falls through a window, the stillness
            of a cafe in the early morning, the texture of leaves against open sky.
          </p>
          <p className="about__body">
            My work is an invitation to slow down, to look closer, and to find
            beauty in the ordinary. Every frame is intentional; every shadow, deliberate.
          </p>
          {/* Stats row */}
          <div style={{ display:'flex', gap:'3rem', marginTop:'1rem', paddingTop:'2rem', borderTop:'1px solid rgba(13,13,13,0.08)' }}>
            {[['5+','Years'], ['200+','Images'], ['∞','Stories']].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily:'var(--font-playfair)', fontSize:'1.8rem', fontStyle:'italic', color:'var(--ink)', lineHeight:1 }}>{n}</div>
                <div className="t-label" style={{ marginTop:'0.3rem' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
           MARQUEE
         ══════════════════════════════════════════════════════ */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {/* Double for seamless loop */}
          {[...Array(2)].map((_, rep) => (
            <div key={rep} style={{ display:'flex', gap:'4rem', alignItems:'center' }}>
              {['Aesthetic','Minimal','Moody','Timeless','Analog','Still Life','Kerala','Nature','Architecture','Cafe Culture'].map((word, wi) => (
                <span key={wi} style={{ display:'flex', alignItems:'center', gap:'4rem' }}>
                  <span className="marquee-item">{word}</span>
                  <span className="marquee-item marquee-dot">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
           FOOTER
         ══════════════════════════════════════════════════════ */}
      <footer className="footer">
        <div className="footer__name" aria-hidden="true">Savio Joseph</div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.5rem' }}>
          <div className="footer__links">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer__link">Instagram</a>
            <a href="mailto:saviojoseph@email.com" className="footer__link">Email</a>
            <a href="#gallery" className="footer__link">↑ Back to top</a>
          </div>
          <p className="footer__copy">© 2024 Savio Joseph · All rights reserved</p>
        </div>
      </footer>

    </div>{/* end containerRef */}
    </>
  );
}
