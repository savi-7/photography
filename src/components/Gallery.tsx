'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { LightboxPhoto } from './Lightbox';

// ─── Seeded RNG (mulberry32) ────────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── All scroll photos ───────────────────────────────────────────────────────
export const SCROLL_PHOTOS: LightboxPhoto[] = [
  { src: '/assets/849632285995035493.jpg',     aspect: 4/5,  title: 'Urban Shadows' },
  { src: '/assets/Beach cafe (1).jpg',         aspect: 4/3,  title: 'Coastal Morning' },
  { src: '/assets/Beach cafe (2).jpg',         aspect: 4/3,  title: 'Seaside Pavilion' },
  { src: '/assets/Beach cafe.jpg',             aspect: 4/3,  title: 'Salt & Sunlight' },
  { src: '/assets/aesthetic.webp',             aspect: 3/4,  title: 'Quiet Minimal' },
  { src: '/assets/beach side.jpg',             aspect: 4/3,  title: 'Shoreline Stillness' },
  { src: '/assets/cafe aesthetic (1).jpg',     aspect: 4/3,  title: 'Cafe Atmosphere' },
  { src: '/assets/cafe aesthetic.jpg',         aspect: 4/3,  title: 'Warm Wood & Porcelain' },
  { src: '/assets/download (1).jpg',           aspect: 2/3,  title: 'Solitude' },
  { src: '/assets/download (11).jpg',          aspect: 2/3,  title: 'Wanderer' },
  { src: '/assets/download (12).jpg',          aspect: 2/3,  title: 'Sunlit Steps' },
  { src: '/assets/download (13).jpg',          aspect: 4/3,  title: 'Breezeway' },
  { src: '/assets/download (14).jpg',          aspect: 4/3,  title: 'Afternoon Glow' },
  { src: '/assets/download (15).jpg',          aspect: 2/3,  title: 'Still Silhouette' },
  { src: '/assets/download (16).jpg',          aspect: 4/3,  title: 'Architectural Edge' },
  { src: '/assets/download (17).jpg',          aspect: 2/3,  title: 'Passing Light' },
  { src: '/assets/download (18).jpg',          aspect: 4/3,  title: 'Soft Canopy' },
  { src: '/assets/download (19).jpg',          aspect: 4/3,  title: 'Terrace Mood' },
  { src: '/assets/download (20).jpg',          aspect: 4/3,  title: 'Warm Reverie' },
  { src: '/assets/download (21).jpg',          aspect: 2/3,  title: 'Quiet Corner' },
  { src: '/assets/download (22).jpg',          aspect: 4/3,  title: 'Dappled Shadows' },
  { src: '/assets/download (23).jpg',          aspect: 4/3,  title: 'Golden Hour Study' },
  { src: '/assets/download (3).jpg',           aspect: 1/1,  title: 'Balance' },
  { src: '/assets/download (4).jpg',           aspect: 4/3,  title: 'Reflections' },
  { src: '/assets/download (5).jpg',           aspect: 1/1,  title: 'Geometric Peace' },
  { src: '/assets/download (6).jpg',           aspect: 2/3,  title: 'Botanical Harmony' },
  { src: '/assets/download (7).jpg',           aspect: 4/3,  title: 'Window Framing' },
  { src: '/assets/download (8).jpg',           aspect: 4/3,  title: 'Morning Ritual' },
  { src: '/assets/download (9).jpg',           aspect: 4/3,  title: 'Gentle Horizon' },
  { src: '/assets/late-night.jpg',             aspect: 2/3,  title: 'Late Night Musings' },
  { src: '/assets/minimalist design.jpg',      aspect: 4/3,  title: 'Minimalist Interior' },
  { src: '/assets/moody sky aesthetic.webp',   aspect: 2/3,  title: 'Moody Overcast' },
  { src: '/assets/moody.jpg',                  aspect: 2/3,  title: 'Introspective Horizon' },
  { src: '/assets/phone wallpaper.webp',       aspect: 9/16, title: 'Slender Frame' },
  { src: '/assets/soft sky aesthetic.webp',    aspect: 2/3,  title: 'Cotton Cloudscape' },
  { src: '/assets/wave-beach.jpg',             aspect: 4/3,  title: 'Rhythmic Tide' },
  { src: '/assets/minimal-vintage-cafe.jpg',   aspect: 4/3,  title: 'Vintage Cafe Vibe' },
  { src: '/assets/scandinavian-dining.jpg',    aspect: 4/3,  title: 'Scandinavian Dining' },
  { src: '/assets/satin-pothos-plant.jpg',     aspect: 2/3,  title: 'Satin Pothos' },
  { src: '/assets/1148488342519024589.jpg',    aspect: 2/3,  title: 'Vintage Classic Car' },
  { src: '/assets/1980 P150X Vespa.jpg',       aspect: 2/3,  title: '1980 Vespa P150X' },
  { src: '/assets/359584351524915951.jpg',     aspect: 2/3,  title: 'Palm & Azure' },
  { src: '/assets/381046818490992166.jpg',     aspect: 2/3,  title: 'Olive Tree & Wanderlust' },
  { src: '/assets/683421312236182778.jpg',     aspect: 3/4,  title: 'Fiddle Leaf Fig' },
  { src: '/assets/742953269785267056.jpg',     aspect: 2/3,  title: 'Tropical Foliage' },
  { src: '/assets/850195235952401620.jpg',     aspect: 2/3,  title: 'Bougainvillea Bloom' },
  { src: '/assets/880383427182110633.jpg',     aspect: 3/4,  title: 'Golden Shimmer' },
  { src: '/assets/922112092481155761.jpg',     aspect: 3/4,  title: 'Birds on the Line' },
  { src: '/assets/940478334714045364.jpg',     aspect: 3/4,  title: 'Floral Companion' },
  { src: '/assets/990299406197230256.jpg',     aspect: 2/3,  title: 'Amber Gaze' },
  { src: '/assets/Flower.jpg',                 aspect: 2/3,  title: 'Wild Petals' },
  { src: '/assets/konkan diaries.jpg',         aspect: 2/3,  title: 'Konkan Palms' },
  { src: '/assets/clouds-landscape.jpg',       aspect: 2/3,  title: 'Dramatic Sky' },
  { src: '/assets/cafe-arch.jpg',              aspect: 3/4,  title: 'Arched Alcove' },
  { src: '/assets/The best rustic style decoration ideas from Greek hotels -The Hotel Trotter.jpg', aspect: 3/4, title: 'Rustic Greek Hotel Arch' },
  { src: "/assets/Maldives.jpg", aspect: 2/3, title: "Maldives Horizon" },
  { src: "/assets/maldives beach.jpg", aspect: 4/3, title: "Azure Coastline" },
  { src: "/assets/maldives vibe.jpg", aspect: 4/3, title: "Island Reverie" },
  { src: "/assets/sunset-maldives.jpg", aspect: 9/16, title: "Maldivian Sunset" },
  { src: "/assets/Varkala cliff_.jpg", aspect: 4/3, title: "Varkala Cliffs" },
  { src: "/assets/Panjim, Goa_.jpg", aspect: 3/4, title: "Panjim Latin Quarter" },
  { src: "/assets/The cape Goa.jpg", aspect: 9/16, title: "Cape Horizons" },
  { src: "/assets/LIFESTYLE SUMMER (I)_ BEACH DAYS IN ALTEA AND WE VISIT THE GOA RESTAURANT - By Littlefew_com.jpg", aspect: 2/3, title: "Summer Days in Altea" },
  { src: "/assets/mattupetty-dam.jpg", aspect: 5/7, title: "Mattupetty Waters" },
  { src: "/assets/Meeshapulimala.jpg", aspect: 9/16, title: "Meeshapulimala Ridge" },
  { src: "/assets/munnar-tea-slopes.jpg", aspect: 9/16, title: "Munnar Tea Slopes" },
  { src: "/assets/Nilgiris_.jpg", aspect: 9/16, title: "Nilgiri Blue Mountains" },
  { src: "/assets/pine-munnar-forest.jpg", aspect: 4/3, title: "Vattavada Pine Forest" },
  { src: "/assets/pine valley.jpg", aspect: 9/16, title: "Pine Valley Mist" },
  { src: "/assets/ocean.jpg", aspect: 9/16, title: "Infinite Ocean" },
  { src: "/assets/WOAA.jpg", aspect: 3/5, title: "Coastal Solitude" },
  { src: "/assets/1105070827324360056.jpg", aspect: 9/16, title: "Golden Reflections" },
  { src: "/assets/1112881757894108259.jpg", aspect: 4/3, title: "Terracotta & Light" },
  { src: "/assets/25614291625184000.jpg", aspect: 9/20, title: "Highland Trail" },
  { src: "/assets/358176976662685710.jpg", aspect: 9/16, title: "Quiet Greenery" },
  { src: "/assets/634796510024120191.jpg", aspect: 9/16, title: "Breezy Balcony" },
  { src: "/assets/701576448234893889.jpg", aspect: 9/16, title: "Sunlit Veranda" },
  { src: "/assets/804244446002392491.jpg", aspect: 4/3, title: "Warm Architecture" },
  { src: "/assets/826480969127863008.jpg", aspect: 9/16, title: "Subtle Textures" },
  { src: "/assets/946600415442202616.jpg", aspect: 9/16, title: "Dusk Atmosphere" },
  { src: "/assets/cafe aesthetics.jpg", aspect: 4/3, title: "Warm Corner Cafe" },
  { src: "/assets/kirsten-interior.jpg", aspect: 5/8, title: "Sunlit Interior" },
  { src: "/assets/harvest-coffee.jpg", aspect: 9/16, title: "Summer Coffee Harvest" },
  { src: "/assets/Terreo Studio Develops a Classical Yet Contemporary Residential Complex in Tulum, Mexico - Interior Design.jpg", aspect: 2/3, title: "Tulum Contemporary Form" },
  { src: "/assets/art-of-minimalism.jpg", aspect: 4/5, title: "Art of Minimalism" },
  { src: "/assets/kadal-living-sea.jpg", aspect: 9/16, title: "Kadal — The Living Sea" },
  { src: "/assets/cool-reflections.jpg", aspect: 3/4, title: "Cool Reflections" },
  { src: "/assets/breeze-green.jpg", aspect: 9/16, title: "Breeze on Green" },
  { src: "/assets/405324035234449553.jpg", aspect: 9/16, title: "Mediterranean Facade" },
  { src: "/assets/679762137514905982.jpg", aspect: 9/16, title: "Glimmering Shallows" },
  { src: "/assets/792070653257229854.jpg", aspect: 9/16, title: "Cliffside Canopy" },
  { src: "/assets/Bea.jpg", aspect: 9/16, title: "Tide & Foam" },
];

// ─── Layout constants ────────────────────────────────────────────────────────
const COL_X           = [0.06, 0.28, 0.50, 0.72, 0.94];
const COL_Y0          = [4,    20,   8,    24,   12  ];
const GAP_VH          = 22;    // guaranteed breathing space between photos in same column
const JITTER_H        = 1.0;
const SCROLL_START_VH = 8;     // gallery starts right below the hero

interface PlacedPhoto extends LightboxPhoto {
  index: number;
  cxFrac: number;
  cyVH: number;
  heightVH: number;
  widthFrac: number;
}

function buildLayout(): PlacedPhoto[] {
  const rng = mulberry32(42);
  const placed: PlacedPhoto[] = [];
  const colBottoms = COL_Y0.map(y0 => SCROLL_START_VH + y0);

  SCROLL_PHOTOS.forEach((ph, photoIdx) => {
    // Pick the column with the minimum bottom height so all 5 columns remain evenly populated
    let minCol = 0;
    let minBottom = colBottoms[0];
    for (let c = 1; c < 5; c++) {
      if (colBottoms[c] < minBottom) {
        minBottom = colBottoms[c];
        minCol = c;
      }
    }

    const col = minCol;
    const isEdge = col === 0 || col === 4;
    const aspect = ph.aspect ?? 1;

    let widthFrac: number;
    if (aspect >= 1.2)           widthFrac = isEdge ? 0.10 : 0.17;
    else if (aspect <= 0.5)      widthFrac = isEdge ? 0.065 : 0.095;
    else if (aspect <= 0.7)      widthFrac = isEdge ? 0.08 : 0.11;
    else                         widthFrac = isEdge ? 0.075 : 0.105;

    // Approximate height in VH on standard desktop viewports
    const heightVH = Math.min(38, (widthFrac / aspect) * 100 * (16 / 9));
    const jH = (rng() * 2 - 1) * (JITTER_H / 100);

    const cyVH = colBottoms[col] + heightVH / 2;
    const bottomVH = cyVH + heightVH / 2;

    placed.push({
      ...ph,
      index: photoIdx,
      cxFrac: COL_X[col] + jH,
      cyVH,
      heightVH,
      widthFrac,
    });

    // Advance this column's bottom position with guaranteed breathing space
    colBottoms[col] = bottomVH + GAP_VH;
  });

  return placed;
}

const LAYOUT = buildLayout();
// Gallery height ensures all 5 columns finish together with comfortable breathing room before the About section
export const GALLERY_TOTAL_VH =
  Math.max(...LAYOUT.map(p => p.cyVH + p.heightVH / 2)) + 30;

interface GalleryProps {
  introComplete: boolean;
  onSelectPhoto: (index: number) => void;
}

export default function Gallery({ introComplete, onSelectPhoto }: GalleryProps) {
  const photoRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll-reveal: smooth fade-in and subtle lift as each photo enters the viewport
  useEffect(() => {
    if (!introComplete) return;

    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          gsap.to(e.target, { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' });
          obs.unobserve(e.target);
        }
      }),
      { rootMargin: '120px 0px 60px 0px', threshold: 0.01 }
    );

    // Initialise all photos hidden + slightly below their resting position
    photoRefs.current.forEach(el => {
      if (!el) return;
      gsap.set(el, { opacity: 0, y: 18 });
      obs.observe(el);
    });

    return () => obs.disconnect();
  }, [introComplete]);

  return (
    <div
      id="gallery"
      className="gallery-container"
      style={{
        position: 'relative',
        width:    '100%',
        height:   `${GALLERY_TOTAL_VH}vh`,
      }}
    >
      {LAYOUT.map((item, i) => {
        const wPct   = item.widthFrac * 100;
        const leftPct = item.cxFrac * 100 - wPct / 2;
        return (
          <div
            key={item.index}
            ref={el => { photoRefs.current[i] = el; }}
            className="photo-wrap"
            onClick={() => onSelectPhoto(item.index)}
            title={item.title}
            style={{
              position:    'absolute',
              top:         `${item.cyVH}vh`,
              left:        `${leftPct}vw`,
              width:       `${wPct}vw`,
              aspectRatio: String(item.aspect),
              maxHeight:   '40vh',
              maxWidth:    '22vw',
              zIndex:      2,
              transform:   'translateY(-50%)',
              opacity:     0,
              willChange:  'opacity, transform',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt={item.title ?? 'Photograph'}
              loading="lazy"
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', display: 'block',
                pointerEvents: 'none', userSelect: 'none',
              }}
            />
            {/* Subtle caption tag on hover */}
            <div className="photo-tag">
              <span>{item.title}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
