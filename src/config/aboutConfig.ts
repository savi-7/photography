export interface StackImageItem {
  src: string;
  alt: string;
  title: string;
  caption: string;
}

export interface AboutConfig {
  portrait: {
    images: string[];
    alt: string;
  };
  bio: {
    paragraph1: string;
    paragraph2: string;
  };
  stackImages: StackImageItem[];
}

export const ABOUT_CONFIG: AboutConfig = {
  portrait: {
    images: [
      '/assets/download (3).jpg',
      '/assets/download (4).jpg',
    ],
    alt: 'Savio Joseph',
  },
  bio: {
    paragraph1:
      "Hi! I am Savio! I'm an aesthetic, minimalistic photographer based in Kerala, India, drawn to the quiet moments between things — the way sunlight falls through a window, the stillness of a cafe in the early morning, the texture of leaves against open sky.",
    paragraph2:
      "My work is an invitation to slow down, to look closer, and to find beauty in the ordinary. Every frame is intentional; every shadow, deliberate — celebrating quiet intimacy without boundaries.",
  },
  stackImages: [
    {
      src: '/assets/405324035234449553.jpg',
      alt: 'Sunlit Greek Villa',
      title: 'SOLITUDE',
      caption: 'MEDITERRANEAN ARCHITECTURE · 2026',
    },
    {
      src: '/assets/792070653257229854.jpg',
      alt: 'Coastal Palms',
      title: 'VARKALA',
      caption: 'CLIFFSIDE HORIZON · 2026',
    },
    {
      src: '/assets/679762137514905982.jpg',
      alt: 'Golden Tide Reflections',
      title: 'GLIMMER',
      caption: 'ARABIAN SEA SUNSET · 2026',
    },
    {
      src: '/assets/travel.jpg',
      alt: 'Misty Highland Meadow',
      title: 'MUNNAR',
      caption: 'MEESHAPULIMALA HIGHLAND · 2026',
    },
    {
      src: '/assets/download (11).jpg',
      alt: 'Architectural Shadows',
      title: 'MONOLITH',
      caption: 'BRUTALIST PERSPECTIVE · 2026',
    },
    {
      src: '/assets/download (21).jpg',
      alt: 'Dramatic Sun Rays',
      title: 'CELESTIAL',
      caption: 'DRAMATIC MONSOON RAYS · 2026',
    },
    {
      src: '/assets/1980 P150X Vespa.jpg',
      alt: 'Vintage Vespa',
      title: 'VESPA',
      caption: '1980 P150X HERITAGE · 2026',
    },
    {
      src: '/assets/Bea.jpg',
      alt: 'Golden Shoreline Tide',
      title: 'SHORELINE',
      caption: 'GOLDEN TIDE ARCHIVE · 2026',
    },
  ],
};
