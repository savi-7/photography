'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ABOUT_CONFIG, AboutConfig } from '@/config/aboutConfig';

interface AboutSectionProps {
  introComplete: boolean;
  config?: AboutConfig;
}

export default function AboutSection({
  introComplete,
  config = ABOUT_CONFIG,
}: AboutSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const bioRef = useRef<HTMLDivElement>(null);

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [activePortraitIdx, setActivePortraitIdx] = useState(0);

  // Alternates profile pictures every 5 seconds with a smooth crossfade
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePortraitIdx((prev) => (prev + 1) % config.portrait.images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [config.portrait.images.length]);

  const totalCards = config.stackImages.length;
  const lastIdx = totalCards - 1;

  useEffect(() => {
    if (!introComplete) return;

    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      if (portraitRef.current) gsap.set(portraitRef.current, { opacity: 1, y: 0 });
      if (bioRef.current) gsap.set(bioRef.current, { opacity: 1, y: 0 });
      if (titleRefs.current[lastIdx]) gsap.set(titleRefs.current[lastIdx], { opacity: 1, y: 0 });
      if (captionRefs.current[lastIdx]) gsap.set(captionRefs.current[lastIdx], { opacity: 1, y: 0 });
      cardRefs.current.forEach((card, idx) => {
        if (card) {
          const targetY = (idx - lastIdx) * 14;
          gsap.set(card, { y: targetY, xPercent: -50, yPercent: -50, opacity: 1 });
        }
      });
      return;
    }

    const ctx = gsap.context(() => {
      // ── Initial resting states ──
      // Portrait & bio arrive naturally at center under the nav
      gsap.set(portraitRef.current, { y: 0, opacity: 1 });
      gsap.set(bioRef.current, { y: 0, opacity: 1 });

      // All stack cards start below the viewport, centered with GSAP xPercent/yPercent
      cardRefs.current.forEach((card) => {
        if (card) gsap.set(card, { y: '110vh', xPercent: -50, yPercent: -50, opacity: 1 });
      });

      // All giant titles & captions start hidden with subtle offset for smooth arrival
      titleRefs.current.forEach((t) => {
        if (t) gsap.set(t, { opacity: 0, y: 25 });
      });
      captionRefs.current.forEach((c) => {
        if (c) gsap.set(c, { opacity: 0, y: 12 });
      });

      // ── Scrubbed Timeline ──────────────────────────────────────────────────
      // 1. Reading Hold (0 -> 1.0s): Profile pic and description held in place.
      // 2. Base Card 0 & Title 0 (1.0 -> 2.30s): Portrait exits, Card 0 arrives with Title 0.
      // 3. Subsequent Stack Wipe & Smooth Giant Title Flow (2.30 -> 8.95s):
      //    Each card wipes over the previous, and the giant background title and caption
      //    smoothly crossfade to match that specific picture's title in perfect synchrony!
      // 4. Hero Finale Hold (8.95 -> 10.15s): Final hero image ("SHORELINE") with giant title
      //    and caption pinned at center to conclude the page!
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * (window.innerWidth < 640 ? 4.5 : 6.5)}`,
          pin: stageRef.current,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // ── 1. Hold: Reading window (0.0s -> 1.0s) ──────────────────────────────
      tl.to({}, { duration: 1.0 }, 0);

      // ── 2. Transition out portrait & bio (1.0s -> 1.45s) ────────────────────
      tl.to(
        portraitRef.current,
        { y: -220, opacity: 0, duration: 0.45, ease: 'power2.in' },
        1.0
      );
      tl.to(
        bioRef.current,
        { opacity: 0, y: -25, duration: 0.35, ease: 'power1.in' },
        1.05
      );

      // ── 3. Base Card 0 arrives & Title 0 reveals (1.15s -> 2.30s) ───────────
      const card0 = cardRefs.current[0];
      const targetY0 = (0 - lastIdx) * 14;
      if (card0) {
        tl.to(
          card0,
          {
            y: targetY0,
            duration: 0.85,
            ease: 'power2.out',
          },
          1.15
        );
      }

      // Title 0 & Caption 0 crossfade in smoothly as Card 0 arrives into view
      const title0 = titleRefs.current[0];
      const caption0 = captionRefs.current[0];
      if (title0) {
        tl.to(
          title0,
          { opacity: 1, y: 0, duration: 0.6, ease: 'power1.out' },
          1.45
        );
      }
      if (caption0) {
        tl.to(
          caption0,
          { opacity: 1, y: 0, duration: 0.6, ease: 'power1.out' },
          1.45
        );
      }

      // Settle pause on Card 0
      tl.to({}, { duration: 0.35 }, 1.95);

      // ── 4. Subsequent Stack Wipe & Smooth Giant Title Flow (2.30s -> 8.95s) ───
      // For each subsequent card (1 through lastIdx):
      // As card[i] rises up and wipes over card[i-1], the giant title and caption
      // smoothly crossfade from picture[i-1] to picture[i] in perfect sync!
      const wipeStart = 2.30;
      const stepDuration = 0.95;

      for (let i = 1; i < totalCards; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;

        const tStart = wipeStart + (i - 1) * stepDuration;
        const targetY = (i - lastIdx) * 14;
        const cardRiseDuration = 0.80;

        // Card i rises from 110vh to stacked resting position
        tl.to(
          card,
          {
            y: targetY,
            duration: cardRiseDuration,
            ease: 'power2.out',
          },
          tStart
        );

        // Synchronized, butter-smooth crossfade of Giant Title & Caption
        // Exactly as card[i] wipes over card[i-1] in the center of the viewport
        const crossfadeStart = tStart + 0.22;
        const crossfadeDuration = 0.50;

        const prevTitle = titleRefs.current[i - 1];
        const prevCaption = captionRefs.current[i - 1];
        const currTitle = titleRefs.current[i];
        const currCaption = captionRefs.current[i];

        // Smoothly fade out previous title & caption
        if (prevTitle) {
          tl.to(
            prevTitle,
            { opacity: 0, y: -20, duration: crossfadeDuration, ease: 'power1.inOut' },
            crossfadeStart
          );
        }
        if (prevCaption) {
          tl.to(
            prevCaption,
            { opacity: 0, y: -10, duration: crossfadeDuration, ease: 'power1.inOut' },
            crossfadeStart
          );
        }

        // Smoothly fade in incoming title & caption
        if (currTitle) {
          tl.to(
            currTitle,
            { opacity: 1, y: 0, duration: crossfadeDuration, ease: 'power1.inOut' },
            crossfadeStart
          );
        }
        if (currCaption) {
          tl.to(
            currCaption,
            { opacity: 1, y: 0, duration: crossfadeDuration, ease: 'power1.inOut' },
            crossfadeStart
          );
        }
      }

      // ── 5. Grand Finale Hold (8.95s -> 10.15s) ──────────────────────────────
      // Pinned hold on the final hero image ("SHORELINE") with giant title and caption.
      // The page concludes right here with zero footer!
      const finaleStart = wipeStart + (totalCards - 1) * stepDuration;
      tl.to({}, { duration: 1.2 }, finaleStart);
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, [introComplete, config, totalCards, lastIdx]);

  return (
    <section id="about" ref={sectionRef} className="about-pinned-section">
      <div ref={stageRef} className="about-stage">
        {/* ── Profile picture and description (centered naturally after gallery) ── */}
        <div className="about-intro-content">
          <div ref={portraitRef} className="about-portrait-wrap">
            {config.portrait.images.map((src, idx) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={src}
                src={src}
                alt={config.portrait.alt}
                className="about-portrait-img"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 35%',
                  opacity: activePortraitIdx === idx ? 1 : 0,
                  transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            ))}
          </div>

          <div ref={bioRef} className="about-bio-wrap">
            <p className="about-bio-p">{config.bio.paragraph1}</p>
            <p className="about-bio-p">{config.bio.paragraph2}</p>
          </div>
        </div>

        {/* ── Giant Titles: Smoothly crossfading name for EACH picture in position ── */}
        <div className="about-title-container" aria-hidden="true">
          {config.stackImages.map((img, i) => (
            <div
              key={`title-${img.src}-${i}`}
              ref={(el) => {
                titleRefs.current[i] = el;
              }}
              className="about-giant-title"
            >
              {img.title}
            </div>
          ))}
        </div>

        {/* ── Captions: Smoothly crossfading caption for EACH picture in position ── */}
        <div className="about-caption-container">
          {config.stackImages.map((img, i) => (
            <div
              key={`caption-${img.src}-${i}`}
              ref={(el) => {
                captionRefs.current[i] = el;
              }}
              className="about-caption"
            >
              {img.caption}
            </div>
          ))}
        </div>

        {/* ── Stack of 8 portrait images (centered, no border radius, top edges exposed) ── */}
        <div className="about-stack-stage" aria-label="Selected photographic works">
          {config.stackImages.map((img, i) => (
            <div
              key={`${img.src}-${i}`}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className={`about-stack-card ${i === lastIdx ? 'about-stack-card--hero' : ''}`}
              style={{ zIndex: 10 + i }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.alt}
                className="about-stack-img"
                loading={i > 3 ? 'lazy' : 'eager'}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
