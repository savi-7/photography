'use client';

import { useLayoutEffect, useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import Cursor from '@/components/Cursor';
import Gallery, { SCROLL_PHOTOS } from '@/components/Gallery';
import Lightbox, { LightboxPhoto } from '@/components/Lightbox';
import AboutSection from '@/components/AboutSection';

gsap.registerPlugin(ScrollTrigger);

// ─── Pile offsets ────────────────────────────────────────────────────────────
const PILE_OFFSETS = [
  { x:  0, y:  0 }, { x:  3, y: -2 }, { x: -4, y:  3 }, { x:  2, y: -5 },
  { x: -3, y:  4 }, { x:  5, y: -1 }, { x: -2, y:  5 }, { x:  4, y: -4 },
  { x: -5, y:  2 }, { x:  1, y:  5 }, { x: -4, y: -3 },
];

// ─── BURST PHOTOS ────────────────────────────────────────────────────────────
// 11 photos whose positions live inside the first viewport.
// Coordinates are carefully bounded so no photo clips offscreen boundaries.
const BURST_PHOTOS: (LightboxPhoto & { cx: number; cy: number; w: number; aspect: number })[] = [
  { src: '/assets/moody green.jpg',         aspect: 4/3, cx: 0.08, cy: 0.14, w: 0.11, title: 'Moody Canopy' },
  { src: '/assets/aesthetic.jpg',           aspect: 3/4, cx: 0.28, cy: 0.22, w: 0.12, title: 'Pocket Wildflowers' },
  { src: '/assets/travel (1).jpg',          aspect: 2/3, cx: 0.74, cy: 0.30, w: 0.11, title: 'Misty Trail' },
  { src: '/assets/download (10).jpg',       aspect: 4/3, cx: 0.91, cy: 0.26, w: 0.11, title: 'Coastal Plain' },
  { src: '/assets/download (2).jpg',        aspect: 2/3, cx: 0.27, cy: 0.72, w: 0.12, title: 'Sunlit Sunroof' },
  { src: '/assets/cafe.jpg',                aspect: 4/3, cx: 0.73, cy: 0.68, w: 0.17, title: 'Quiet Conservatory' },
  { src: '/assets/architecture.jpg',        aspect: 4/3, cx: 0.08, cy: 0.62, w: 0.10, title: 'Bougainvillea Villa' },
  { src: '/assets/travel.jpg',              aspect: 2/3, cx: 0.50, cy: 0.76, w: 0.11, title: 'Highland Meadow' },
  { src: '/assets/Beach.jpg',               aspect: 4/3, cx: 0.87, cy: 0.08, w: 0.09, title: 'Coastal Dusk' },
  { src: '/assets/friends.jpg',             aspect: 2/3, cx: 0.50, cy: 0.20, w: 0.11, title: 'Circle of Friends' },
  { src: '/assets/travel_train_travel.jpg', aspect: 4/3, cx: 0.08, cy: 0.86, w: 0.12, title: 'Train Threshold' },
];

export default function Home() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const burstRefs     = useRef<(HTMLDivElement | null)[]>([]);
  const plusRef       = useRef<HTMLDivElement>(null);
  const titleRef      = useRef<HTMLDivElement>(null);
  const navRef        = useRef<HTMLElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const lenisRef      = useRef<Lenis | null>(null);

  const [introComplete, setIntroComplete] = useState(false);
  const hasRunRef = useRef(false);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [lightboxList, setLightboxList] = useState<LightboxPhoto[]>(SCROLL_PHOTOS);

  const openScrollLightbox = useCallback((index: number) => {
    setLightboxList(SCROLL_PHOTOS);
    setActivePhotoIdx(index);
    setLightboxOpen(true);
  }, []);

  const openBurstLightbox = useCallback((index: number) => {
    setLightboxList(BURST_PHOTOS);
    setActivePhotoIdx(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  // ── GSAP Intro Animation ───────────────────────────────────────────────────
  useLayoutEffect(() => {
    window.scrollTo(0, 0);

    if (hasRunRef.current) return;
    hasRunRef.current = true;

    // Lock scroll immediately during intro
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = vw / 2;
    const cy = vh / 2;

    type GridPos = { widthPx: number; heightPx: number; topPx: number; leftPx: number };
    const gridPos: GridPos[] = BURST_PHOTOS.map((bp) => {
      const widthPx  = bp.w * vw;
      const heightPx = widthPx / bp.aspect;
      const leftPx   = Math.max(12, Math.min(vw - widthPx - 12, bp.cx * vw - widthPx / 2));
      const topPx    = Math.max(12, Math.min(vh - heightPx - 12, bp.cy * vh - heightPx / 2));
      return { widthPx, heightPx, leftPx, topPx };
    });

    // Place burst photos at PILE centre
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
        visibility: 'visible',
        filter:     'blur(0px)',
        zIndex:     500 + i,
        willChange: 'transform, opacity, filter',
      });
    });

    if (plusRef.current)  gsap.set(plusRef.current,  { visibility: 'visible', scale: 0, transformOrigin: 'center center' });
    if (titleRef.current) gsap.set(titleRef.current, { opacity: 0, filter: 'blur(16px)' });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
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
              y:          gp.topPx + scrollY,
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

      // Photo 7 — instant cut
      tl.to(burstRefs.current[6], { opacity: 1, duration: 0, ease: 'none' }, 1.30);

      // At 1.5s: remaining photos appear instantly
      const remainingEls = burstRefs.current.slice(7).filter(Boolean) as HTMLDivElement[];
      tl.to(remainingEls, { opacity: 1, duration: 0, ease: 'none' }, 1.50);

      // Crosshair
      if (plusRef.current)
        tl.to(plusRef.current, { scale: 1, duration: 0.25, ease: 'power2.out' }, 1.5);

      // Burst to destination positions
      const burstEls  = burstRefs.current.filter(Boolean) as HTMLDivElement[];
      const burstDest = burstEls.map((_, i) => ({ x: gridPos[i].leftPx, y: gridPos[i].topPx }));
      tl.to(burstEls, {
        x: (i: number) => burstDest[i].x,
        y: (i: number) => burstDest[i].y,
        duration: 0.8,
        ease: 'expo.out',
        stagger: { each: 0.02, from: 'start' },
      }, 1.6);

      // Title reveal
      if (titleRef.current)
        tl.fromTo(titleRef.current,
          { opacity: 0, filter: 'blur(16px)' },
          { opacity: 1, filter: 'blur(0px)', duration: 0.4, ease: 'power2.out' },
          2.1);

    }, containerRef);

    return () => {
      ctx.revert();
      hasRunRef.current = false;
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  // ── Original Lenis Smooth Scroll ───────────────────────────────────────────
  useEffect(() => {
    if (!introComplete) return;

    // Show scroll-hint briefly then gently hide
    const hint = scrollHintRef.current;
    if (hint) {
      hint.classList.add('visible');
      const timer = setTimeout(() => { hint.style.opacity = '0'; }, 3500);
      return () => clearTimeout(timer);
    }
  }, [introComplete]);

  useEffect(() => {
    if (!introComplete) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    // Initial refresh after intro finishes
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    // Scroll listener for nav reveal and title / plus fade
    const onScroll = () => {
      const scroll = window.scrollY;
      const nav    = navRef.current;
      const title  = titleRef.current;
      const plus   = plusRef.current;
      const vh     = window.innerHeight;

      if (nav) {
        if (scroll > 60) nav.classList.add('nav--visible');
        else             nav.classList.remove('nav--visible');
      }

      // Plus crosshair and hero title fade out on initial scroll into gallery
      const fadeStart = vh * 0.12;
      const fadeEnd   = vh * 0.42;
      const progress  = Math.max(0, Math.min(1, (scroll - fadeStart) / (fadeEnd - fadeStart)));
      if (plus) plus.style.opacity = String(1 - progress);
      if (title) title.style.opacity = String(1 - progress);
    };

    lenis.on('scroll', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [introComplete]);

  // Smooth scroll handler for nav & footer links
  const scrollToTarget = useCallback((target: string | number) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { duration: 1.2 });
    } else {
      if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: 'smooth' });
      } else {
        const el = document.querySelector(target);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <>
      {/* ── Custom cursor ─────────────────────────────────────── */}
      <Cursor />

      {/* ── Editorial Lightbox ─────────────────────────────────── */}
      <Lightbox
        isOpen={lightboxOpen}
        currentIndex={activePhotoIdx}
        photos={lightboxList}
        onClose={closeLightbox}
        onSelectIndex={(nextIdx) => setActivePhotoIdx(nextIdx)}
        onNavigate={(nextIdx) => setActivePhotoIdx(nextIdx)}
      />

      {/* ── Navigation bar ────────────────────────────────────── */}
      <header>
        <nav ref={navRef} className="nav" aria-label="Main Navigation">
          <button
            type="button"
            className="nav__logo"
            onClick={() => scrollToTarget(0)}
            aria-label="Savio Joseph Home"
          >
            Svj
          </button>
          <div className="nav__links">
            <button
              type="button"
              className="nav__link"
              onClick={() => scrollToTarget('#gallery')}
            >
              Work
            </button>
            <button
              type="button"
              className="nav__link"
              onClick={() => scrollToTarget('#about')}
            >
              About
            </button>
            <a href="mailto:saviojoseph@email.com" className="nav__link">Contact</a>
          </div>
        </nav>
      </header>

      {/* ── Scroll hint indicator ─────────────────────────────── */}
      <div ref={scrollHintRef} className="scroll-hint" aria-hidden="true">
        <div className="scroll-hint__line" />
        <span className="scroll-hint__text">Scroll</span>
      </div>

      <div ref={containerRef} style={{ position: 'relative' }}>

        {/* ── Fixed "+" crosshair ───────────────────────────────── */}
        <div
          ref={plusRef}
          aria-hidden="true"
          className="plus-crosshair"
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

        {/* ── Fixed Hero Title ─────────────────────────────────── */}
        <div
          ref={titleRef}
          className="hero-title"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0,
            zIndex: 1,
            textAlign: 'center',
            userSelect: 'none',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <h1 style={{
            fontFamily: 'var(--font-norman)',
            fontVariationSettings: "'wght' 400",
            fontSize:   'clamp(3.2rem, 7.8vw, 7.2rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 0.95,
            color: 'var(--ink)',
            margin: 0,
          }}>
            Savio Joseph
          </h1>
        </div>

        {/* ── Hero Burst Photos ────────────────────────────────── */}
        <div style={{ position: 'relative', width: '100%', height: '100vh', zIndex: 2 }}>
          {BURST_PHOTOS.map((bp, i) => (
            <div
              key={`burst-${i}`}
              ref={(el) => { burstRefs.current[i] = el; }}
              className="photo-wrap"
              onClick={() => openBurstLightbox(i)}
              title={bp.title}
              style={{
                position:   'fixed',
                top:        0,
                left:       0,
                overflow:   'hidden',
                zIndex:     500 + i,
                visibility: 'hidden',
                opacity:    0,
                width:      0,
                height:     0,
                cursor:     'pointer',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bp.src}
                alt={bp.title ?? 'Photograph'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
              <div className="photo-tag">
                <span>{bp.title}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Scroll gallery with smooth IntersectionObserver reveal ─ */}
        <Gallery introComplete={introComplete} onSelectPhoto={openScrollLightbox} />

        {/* ══════════════════════════════════════════════════════
             ABOUT SECTION (Pinned Stage Scroll Sequence)
           ══════════════════════════════════════════════════════ */}
        <AboutSection introComplete={introComplete} />

      </div>{/* end containerRef */}
    </>
  );
}
