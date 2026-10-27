// Starter hook for the scroll skew effect (React + TypeScript).
// Photos need data-photo, the title needs data-title. Constants are measured estimates: tune them.
import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";

const MAX_SKEW = 8;   // degrees at full speed
const K = 28;         // strength
const VMAX = 40;      // Lenis velocity counted as full speed
const RISE = 0.25;    // how fast skew builds
const FALL = 0.08;    // how slowly it relaxes
const TITLE_PARALLAX = 0.3;

export function useSkewScroll(container: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const root = container.current;
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.09 });
    const photos = Array.from(root.querySelectorAll<HTMLElement>("[data-photo]"));
    const title = root.querySelector<HTMLElement>("[data-title]");
    const setSkew = photos.map((el) => gsap.quickSetter(el, "skewX", "deg"));
    let centers: { x: number; y: number }[] = [];

    const measure = () => {
      // layout values (offset*), not getBoundingClientRect, because skew changes the latter
      centers = photos.map((el) => ({
        x: el.offsetLeft + el.offsetWidth / 2,
        y: el.offsetTop + el.offsetHeight / 2,
      }));
    };
    measure();

    let speed = 0;
    const tick = (time: number) => {
      lenis.raf(time * 1000);
      const target = Math.min(Math.abs(lenis.velocity) / VMAX, 1);
      speed += (target - speed) * (target > speed ? RISE : FALL);
      if (speed < 0.001) speed = 0;

      const vw = innerWidth, vh = innerHeight, sy = lenis.scroll;
      photos.forEach((_, i) => {
        const nx = (centers[i].x - vw / 2) / (vw / 2);
        const ny = (centers[i].y - sy - vh / 2) / (vh / 2);
        if (Math.abs(ny) > 1.4) return; // off screen
        setSkew[i](gsap.utils.clamp(-MAX_SKEW, MAX_SKEW, -K * speed * nx * ny));
      });
      if (title) gsap.set(title, { y: -sy * TITLE_PARALLAX });
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    addEventListener("resize", measure);
    return () => {
      gsap.ticker.remove(tick);
      removeEventListener("resize", measure);
      lenis.destroy();
    };
  }, [container]);
}
