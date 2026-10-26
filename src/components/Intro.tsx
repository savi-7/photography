'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// ─── Speed ────────────────────────────────────────────────────────────────────
// Real duration = timeline length (4.9 s) ÷ SPEED
// 4.9 ÷ 1.815 ≈ 2.70 s  →  matches the reference site exactly
const SPEED = 1.815;

// ─── 11 photos used for the burst intro ───────────────────────────────────────
// w / h / left / top are all percentages of the viewport
const PHOTOS = [
  { src: '/assets/moody green.jpg',         w: 10, h: 26, left: -2, top:  2 },
  { src: '/assets/aesthetic.jpg',            w: 14, h: 21, left: 87, top:  2 },
  { src: '/assets/travel (1).jpg',           w: 11, h: 27, left: 21, top: 11 },
  { src: '/assets/download (10).jpg',        w: 18, h: 22, left: 75, top: 13 },
  { src: '/assets/download (2).jpg',         w: 11, h: 27, left: 19, top: 42 },
  { src: '/assets/cafe.jpg',                 w: 16, h: 25, left: 81, top: 33 },
  { src: '/assets/architecture.jpg',         w: 14, h: 19, left:  5, top: 33 },
  { src: '/assets/travel.jpg',               w: 10, h: 26, left: 66, top: 39 },
  { src: '/assets/Beach.jpg',                w: 12, h: 21, left:  0, top: 63 },
  { src: '/assets/friends.jpg',              w: 11, h: 28, left: 68, top: 57 },
  { src: '/assets/travel_train_travel.jpg',  w: 15, h: 21, left: 89, top: 63 },
];

// Deterministic small pile offsets — keeps stacked photos neat
const PILE_OFFSETS = [
  { x:  0, y:  0 }, { x:  3, y: -2 }, { x: -4, y:  3 }, { x:  2, y: -5 },
  { x: -3, y:  4 }, { x:  5, y: -1 }, { x: -2, y:  5 }, { x:  4, y: -4 },
  { x: -5, y:  2 }, { x:  1, y:  5 }, { x: -4, y: -3 },
];

interface IntroProps {
  onComplete?: () => void;
}

export default function Intro({ onComplete }: IntroProps) {
  const photoRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const p2w = (p: number) => (p / 100) * vw;
    const p2h = (p: number) => (p / 100) * vh;

    // Final pixel position for each photo
    const finals = PHOTOS.map((ph) => ({
      x: p2w(ph.left),
      y: p2h(ph.top),
      w: p2w(ph.w),
      h: p2h(ph.h),
    }));

    const cx = vw / 2;
    const cy = vh / 2;

    // ── Initial state: all photos centred, invisible ──────────────────────────
    photoRefs.current.forEach((el, i) => {
      if (!el) return;
      const { w, h } = finals[i];
      const off = PILE_OFFSETS[i];
      gsap.set(el, {
        width:  w,
        height: h,
        x: cx - w / 2 + off.x,
        y: cy - h / 2 + off.y,
        opacity: 0,
        filter: 'blur(0px)',
        zIndex: i + 1,
        transformOrigin: 'center center',
        willChange: 'transform, opacity, filter',
      });
    });

    // ── Reduced-motion: jump straight to the settled state ───────────────────
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      photoRefs.current.forEach((el, i) => {
        if (el) gsap.set(el, { opacity: 1, filter: 'blur(0px)', x: finals[i].x, y: finals[i].y });
      });
      onComplete?.();
      return;
    }

    // ── Master Timeline ───────────────────────────────────────────────────────
    const tl = gsap.timeline({ onComplete: () => onComplete?.() });
    tl.timeScale(SPEED);

    // 1) 0–1 s  blank
    tl.to({}, { duration: 1.0 });

    // 2) 1–3 s  PILE
    // First two photos: slow blur-in
    tl.fromTo(photoRefs.current[0],
      { opacity: 0.35, filter: 'blur(12px)' },
      { opacity: 1,    filter: 'blur(0px)',  duration: 0.5, ease: 'power2.out' },
      1.0
    );
    tl.fromTo(photoRefs.current[1],
      { opacity: 0.35, filter: 'blur(12px)' },
      { opacity: 1,    filter: 'blur(0px)',  duration: 0.5, ease: 'power2.out' },
      1.5
    );
    // Remaining: rapid cuts
    for (let i = 2; i < PHOTOS.length; i++) {
      tl.to(photoRefs.current[i],
        { opacity: 1, duration: 0.05, ease: 'none' },
        2.0 + (i - 2) * 0.17
      );
    }

    // 3) 3 s  "+" grows — now lives in page.tsx; nothing to do here

    // 4) 3–4 s  BURST: fly to final grid positions
    PHOTOS.forEach((_, i) => {
      const el = photoRefs.current[i];
      if (!el) return;
      tl.to(el,
        { x: finals[i].x, y: finals[i].y, duration: 1.0, ease: 'expo.out' },
        3.0 + i * 0.045
      );
    });

    // 5) 4.3–4.9 s  TITLE — lives in page.tsx; onComplete fires when timeline ends

    return () => { tl.kill(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#F5F4F1',
        overflow: 'hidden',
      }}
    >
      {PHOTOS.map((_, i) => (
        <div
          key={i}
          ref={(el) => { photoRefs.current[i] = el; }}
          style={{
            position:   'absolute',
            top:        0,
            left:       0,
            overflow:   'hidden',
            willChange: 'transform, opacity, filter',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PHOTOS[i].src}
            alt=""
            style={{
              width:         '100%',
              height:        '100%',
              objectFit:     'cover',
              display:       'block',
              pointerEvents: 'none',
              userSelect:    'none',
            }}
          />
        </div>
      ))}
    </div>
  );
}
