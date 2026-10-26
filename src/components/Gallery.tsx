'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── All 49 assets ────────────────────────────────────────────────────────────
const ALL_PHOTOS = [
  { id: 0,  src: '/assets/849632285995035493.jpg',              aspect: 4/5   },
  { id: 1,  src: '/assets/Beach cafe (1).jpg',                  aspect: 4/3   },
  { id: 2,  src: '/assets/Beach cafe (2).jpg',                  aspect: 4/3   },
  { id: 3,  src: '/assets/Beach cafe.jpg',                      aspect: 4/3   },
  { id: 4,  src: '/assets/Beach.jpg',                           aspect: 4/3   },
  { id: 5,  src: '/assets/aesthetic.jpg',                       aspect: 3/4   },
  { id: 6,  src: '/assets/aesthetic.webp',                      aspect: 3/4   },
  { id: 7,  src: '/assets/architecture.jpg',                    aspect: 4/3   },
  { id: 8,  src: '/assets/beach side.jpg',                      aspect: 4/3   },
  { id: 9,  src: '/assets/cafe aesthetic (1).jpg',              aspect: 4/3   },
  { id: 10, src: '/assets/cafe aesthetic.jpg',                  aspect: 4/3   },
  { id: 11, src: '/assets/cafe.jpg',                            aspect: 4/3   },
  { id: 12, src: '/assets/download (1).jpg',                    aspect: 2/3   },
  { id: 13, src: '/assets/download (10).jpg',                   aspect: 4/3   },
  { id: 14, src: '/assets/download (11).jpg',                   aspect: 2/3   },
  { id: 15, src: '/assets/download (12).jpg',                   aspect: 2/3   },
  { id: 16, src: '/assets/download (13).jpg',                   aspect: 4/3   },
  { id: 17, src: '/assets/download (14).jpg',                   aspect: 4/3   },
  { id: 18, src: '/assets/download (15).jpg',                   aspect: 2/3   },
  { id: 19, src: '/assets/download (16).jpg',                   aspect: 4/3   },
  { id: 20, src: '/assets/download (17).jpg',                   aspect: 2/3   },
  { id: 21, src: '/assets/download (18).jpg',                   aspect: 4/3   },
  { id: 22, src: '/assets/download (19).jpg',                   aspect: 4/3   },
  { id: 23, src: '/assets/download (2).jpg',                    aspect: 2/3   },
  { id: 24, src: '/assets/download (20).jpg',                   aspect: 4/3   },
  { id: 25, src: '/assets/download (21).jpg',                   aspect: 2/3   },
  { id: 26, src: '/assets/download (22).jpg',                   aspect: 4/3   },
  { id: 27, src: '/assets/download (23).jpg',                   aspect: 4/3   },
  { id: 28, src: '/assets/download (3).jpg',                    aspect: 1/1   },
  { id: 29, src: '/assets/download (4).jpg',                    aspect: 4/3   },
  { id: 30, src: '/assets/download (5).jpg',                    aspect: 1/1   },
  { id: 31, src: '/assets/download (6).jpg',                    aspect: 2/3   },
  { id: 32, src: '/assets/download (7).jpg',                    aspect: 4/3   },
  { id: 33, src: '/assets/download (8).jpg',                    aspect: 4/3   },
  { id: 34, src: '/assets/download (9).jpg',                    aspect: 4/3   },
  { id: 35, src: '/assets/friends.jpg',                         aspect: 2/3   },
  { id: 36, src: '/assets/late night 💤.jpg',                   aspect: 2/3   },
  { id: 37, src: '/assets/minimalist design.jpg',               aspect: 4/3   },
  { id: 38, src: '/assets/moody green.jpg',                     aspect: 4/3   },
  { id: 39, src: '/assets/moody sky aesthetic.webp',            aspect: 2/3   },
  { id: 40, src: '/assets/moody.jpg',                           aspect: 2/3   },
  { id: 41, src: '/assets/phone wallpaper.webp',                aspect: 9/16  },
  { id: 42, src: '/assets/soft sky aesthetic.webp',             aspect: 2/3   },
  { id: 43, src: '/assets/travel (1).jpg',                      aspect: 2/3   },
  { id: 44, src: '/assets/travel.jpg',                          aspect: 2/3   },
  { id: 45, src: '/assets/travel_train_travel.jpg',             aspect: 4/3   },
  { id: 46, src: '/assets/wave 🌊 Beach.jpg',                   aspect: 4/3   },
  { id: 47, src: '/assets/\u201cMinimal Vintage Cafe Aesthetic _ Retro Vibes\u201d.jpg',          aspect: 4/3 },
  { id: 48, src: '/assets/\u201cMinimalist Scandinavian Dining Aesthetic _ Clean Modern Design\u201d.jpg', aspect: 4/3 },
];

// ─── Layout constants ─────────────────────────────────────────────────────────
// Column centres as fraction of viewport width (0–1)
const COL_X      = [0.05, 0.27, 0.50, 0.73, 0.94];
// Starting Y offset per column (vh) so columns stagger — avoids row-like appearance
const COL_Y0     = [0, 25, 12, 38, 50];
const SPACING_VH = 50;    // centre-to-centre vertical distance within a column
const JITTER_V   = 4;     // ± vh vertical random jitter
const JITTER_H   = 1.5;   // ± vw horizontal random jitter
const TRAIL_VH   = 100;   // empty space after last photo (vh)
const FIRST_PHOTO_VH = 5; // first photo tops start here (vh from top of page)

interface PlacedPhoto {
  id: number;
  src: string;
  col: number;
  /** centre positions in px, computed at mount from vw/vh */
  cxFrac: number;   // fraction of vw
  cyVH: number;     // distance from page top in vh
  widthFrac: number; // fraction of vw
  aspect: number;
}

function buildLayout(): PlacedPhoto[] {
  const rng = mulberry32(42);

  // Assign photos to columns round-robin
  const columns: number[][] = [[], [], [], [], []];
  ALL_PHOTOS.forEach((_, i) => columns[i % 5].push(i));

  const placed: PlacedPhoto[] = [];

  columns.forEach((colPhotos, col) => {
    colPhotos.forEach((photoIdx, row) => {
      const ph = ALL_PHOTOS[photoIdx];
      const jV = (rng() * 2 - 1) * JITTER_V;
      const jH = (rng() * 2 - 1) * JITTER_H / 100; // convert vw jitter to fraction

      // Width selection: portrait → 12vw, landscape → 19vw, small → 7vw
      // Edge columns (0 & 4) are narrower so the crop bleed looks correct
      let widthFrac: number;
      const isEdge = col === 0 || col === 4;
      if (ph.aspect >= 1.2) {
        widthFrac = isEdge ? 0.10 : 0.19;   // landscape
      } else if (ph.aspect <= 0.7) {
        widthFrac = isEdge ? 0.08 : 0.12;   // portrait/tall
      } else {
        widthFrac = isEdge ? 0.07 : 0.10;   // squarish / small
      }

      const cyVH = FIRST_PHOTO_VH + COL_Y0[col] + row * SPACING_VH + jV;
      const cxFrac = COL_X[col] + jH;

      placed.push({
        id:        ph.id,
        src:       ph.src,
        col,
        cxFrac,
        cyVH,
        widthFrac,
        aspect:    ph.aspect,
      });
    });
  });

  return placed;
}

const LAYOUT = buildLayout();

interface GalleryProps {
  introComplete: boolean;
}

export default function Gallery({ introComplete }: GalleryProps) {
  const lenisRef = useRef<Lenis | null>(null);

  // Start Lenis only after intro is done
  useEffect(() => {
    if (!introComplete) return;

    const lenis = new Lenis({
      lerp:            0.08,
      wheelMultiplier: 1,
      touchMultiplier: 1,
    });
    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [introComplete]);

  // Compute page total height in vh
  const maxCyVH  = Math.max(...LAYOUT.map((p) => p.cyVH));
  const totalVH  = maxCyVH + SPACING_VH / 2 + TRAIL_VH;

  return (
    <div
      style={{
        position:   'relative',
        width:      '100%',
        height:     `${totalVH}vh`,
        // No background — body (#F5F4F1) shows through gaps between photos
      }}
    >
      {LAYOUT.map((item) => {
        const widthPct  = item.widthFrac * 100;
        const heightPct = widthPct / item.aspect; // in vw units, needs conversion
        // Height = (width in vw) / aspect. Since width is in vw, height = (widthFrac * 100vw) / aspect
        // In CSS: width = widthPct vw, height = (widthPct / aspect) vw
        const leftPct  = item.cxFrac * 100 - widthPct / 2; // vw %, centred on cxFrac
        const topVH    = item.cyVH - heightPct / (2 * item.aspect); // approximate centring

        return (
          <a
            key={item.id}
            href={`/focus?rel=${item.id}`}
            style={{
              position:    'absolute',
              top:         `${item.cyVH}vh`,
              left:        `${leftPct}vw`,
              width:       `${widthPct}vw`,
              aspectRatio: String(item.aspect),
              display:     'block',
              cursor:      'pointer',
              overflow:    'hidden',
              transform:   'translateY(-50%)',
              zIndex:      2,   // above fixed title (z:1), below "+" (z:1000)
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
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
          </a>
        );
      })}
    </div>
  );
}
