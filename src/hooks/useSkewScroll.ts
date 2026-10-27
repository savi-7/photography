'use client';

import { useEffect, useRef, useCallback } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';

// ─── Tuned 3D Spatial & Fluid Physics Constants ──────────────────────────────
const MAX_SKEW = 8.5;       // degrees at full velocity
const K = 34;               // strength constant for visible, fluid flex
const VMAX = 15;            // full-speed velocity threshold
const RISE = 0.28;          // reacts fast on flick/scroll start
const FALL = 0.055;         // relaxes gently over ~0.4s for luxurious elastic return
const SKEW_LERP = 0.18;     // per-photo fluid interpolation for liquid-smooth bending
const TITLE_PARALLAX = 0.3; // translateY = -scrollY * 0.3

interface UseSkewScrollOptions {
  enabled: boolean;
}

export function useSkewScroll(
  containerRef: React.RefObject<HTMLElement | null>,
  options: UseSkewScrollOptions = { enabled: true }
) {
  const lenisRef = useRef<Lenis | null>(null);

  const scrollTo = useCallback((target: string | number) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { duration: 1.5 });
    } else {
      if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: 'smooth' });
      } else {
        const el = document.querySelector(target);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1) Smooth scroll: Lenis with ultra-buttery inertia driven by gsap.ticker
    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.6,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    if (!options.enabled) {
      lenis.stop();
    } else {
      lenis.start();
    }

    // Query all photos and title
    const photos = Array.from(root.querySelectorAll<HTMLElement>('[data-photo]'));
    const title = root.querySelector<HTMLElement>('[data-title]');

    // Initialize 3D container & transform-origin on photos
    root.classList.add('gallery-3d-scene');
    photos.forEach((el) => {
      gsap.set(el, { transformOrigin: 'center center', willChange: 'transform' });
    });

    // GPU-accelerated setters for 3D spatial properties
    const setContainerZ = gsap.quickSetter(root, 'z', 'px');
    const setContainerRotX = gsap.quickSetter(root, 'rotationX', 'deg');

    const setSkewX = photos.map((el) => gsap.quickSetter(el, 'skewX', 'deg'));
    const setRotY  = photos.map((el) => gsap.quickSetter(el, 'rotationY', 'deg'));
    const setRotX  = photos.map((el) => gsap.quickSetter(el, 'rotationX', 'deg'));
    const setZ     = photos.map((el) => gsap.quickSetter(el, 'z', 'px'));

    const currentSkews = new Float32Array(photos.length);
    const currentRotY  = new Float32Array(photos.length);
    const currentRotX  = new Float32Array(photos.length);
    const currentZ     = new Float32Array(photos.length);

    let currentContZ = 0;
    let currentContRotX = 0;
    let centers: { x: number; y: number }[] = [];

    // Measure layout positions (immune to transforms)
    const measure = () => {
      centers = photos.map((el) => {
        let top = el.offsetTop;
        let left = el.offsetLeft;
        let p = el.offsetParent as HTMLElement | null;
        while (p && p !== root && p !== document.body) {
          top += p.offsetTop;
          left += p.offsetLeft;
          p = p.offsetParent as HTMLElement | null;
        }
        return {
          x: left + el.offsetWidth / 2,
          y: top + el.offsetHeight / 2,
        };
      });
    };

    measure();

    let speed = 0;
    const tick = (time: number) => {
      lenis.raf(time * 1000);

      const sy = lenis.scroll;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // 3) Title slow parallax
      if (title) {
        gsap.set(title, {
          xPercent: -50,
          yPercent: -50,
          y: -sy * TITLE_PARALLAX,
          force3D: true,
        });
      }

      // If prefers-reduced-motion is active, disable 3D & skew
      if (prefersReducedMotion) {
        photos.forEach((_, i) => {
          setSkewX[i](0);
          setRotY[i](0);
          setRotX[i](0);
          setZ[i](0);
        });
        setContainerZ(0);
        setContainerRotX(0);
        return;
      }

      // 2) Velocity calculation with asymmetric smoothing
      const target = Math.min(Math.abs(lenis.velocity) / VMAX, 1);
      speed += (target - speed) * (target > speed ? RISE : FALL);
      if (speed < 0.0003) speed = 0;

      // Whole page / scene 3D reaction: pull back slightly into 3D depth and tilt
      const targetContZ = speed === 0 ? 0 : -speed * 42;
      const targetContRotX = speed === 0 ? 0 : gsap.utils.clamp(-3, 3, (lenis.velocity / 20) * -1.8);
      currentContZ += (targetContZ - currentContZ) * SKEW_LERP;
      currentContRotX += (targetContRotX - currentContRotX) * SKEW_LERP;
      if (Math.abs(currentContZ) < 0.01) currentContZ = 0;
      if (Math.abs(currentContRotX) < 0.01) currentContRotX = 0;
      setContainerZ(currentContZ);
      setContainerRotX(currentContRotX);

      // Photos 3D spatial & skew deformation
      photos.forEach((_, i) => {
        if (!centers[i]) return;
        const nx = (centers[i].x - vw / 2) / (vw / 2);
        const ny = (centers[i].y - sy - vh / 2) / (vh / 2);

        // If photo is far off screen, relax to 0
        if (Math.abs(ny) > 1.5) {
          currentSkews[i] += (0 - currentSkews[i]) * 0.25;
          currentRotY[i]  += (0 - currentRotY[i]) * 0.25;
          currentRotX[i]  += (0 - currentRotX[i]) * 0.25;
          currentZ[i]     += (0 - currentZ[i]) * 0.25;
          setSkewX[i](currentSkews[i]);
          setRotY[i](currentRotY[i]);
          setRotX[i](currentRotX[i]);
          setZ[i](currentZ[i]);
          return;
        }

        // Target calculations:
        // skewX: corners lean in classic vortex direction
        const targetSkewX = speed === 0 ? 0 : gsap.utils.clamp(-MAX_SKEW, MAX_SKEW, -K * speed * nx * ny);
        // rotateY: photos turn slightly inward towards the vertical centerline (cylindrical bowl)
        const targetRotY  = speed === 0 ? 0 : gsap.utils.clamp(-10, 10, nx * speed * 9.5);
        // rotateX: photos pitch slightly towards horizontal centerline
        const targetRotX  = speed === 0 ? 0 : gsap.utils.clamp(-7, 7, -ny * speed * 6.5);
        // z: outer photos recede into 3D background along the bowl curve
        const r2 = nx * nx + ny * ny;
        const targetZ     = speed === 0 ? 0 : -r2 * speed * 55;

        // Fluid interpolation for liquid-smooth response
        currentSkews[i] += (targetSkewX - currentSkews[i]) * SKEW_LERP;
        currentRotY[i]  += (targetRotY  - currentRotY[i])  * SKEW_LERP;
        currentRotX[i]  += (targetRotX  - currentRotX[i])  * SKEW_LERP;
        currentZ[i]     += (targetZ     - currentZ[i])     * SKEW_LERP;

        if (Math.abs(currentSkews[i]) < 0.0008) currentSkews[i] = 0;
        if (Math.abs(currentRotY[i])  < 0.0008) currentRotY[i]  = 0;
        if (Math.abs(currentRotX[i])  < 0.0008) currentRotX[i]  = 0;
        if (Math.abs(currentZ[i])     < 0.01)   currentZ[i]     = 0;

        setSkewX[i](currentSkews[i]);
        setRotY[i](currentRotY[i]);
        setRotX[i](currentRotX[i]);
        setZ[i](currentZ[i]);
      });
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onResize = () => {
      measure();
    };

    window.addEventListener('resize', onResize);
    const remeasureTimer = setTimeout(measure, 150);

    return () => {
      clearTimeout(remeasureTimer);
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', onResize);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [containerRef, options.enabled]);

  return {
    scrollTo,
  };
}
