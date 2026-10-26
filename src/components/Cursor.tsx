'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Cursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = 0, mouseY = 0;
    let ringX  = 0, ringY  = 0;
    let raf: number;
    let shown  = false;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      gsap.set(dot, { x: mouseX, y: mouseY });

      // Fade in on first mouse move
      if (!shown) {
        shown = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.4, ease: 'power2.out' });
      }
    };

    // Ring follows with eased lag
    const tick = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      gsap.set(ring, { x: ringX, y: ringY });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Hover states
    const onEnterPhoto = () => {
      dot.classList.add('cursor--hover');
      ring.style.opacity = '0';
    };
    const onLeavePhoto = () => {
      dot.classList.remove('cursor--hover');
      if (shown) ring.style.opacity = '1';
    };
    const onEnterLink = () => dot.classList.add('cursor--link');
    const onLeaveLink = () => dot.classList.remove('cursor--link');

    const bindHovers = () => {
      document.querySelectorAll('.photo-wrap').forEach(el => {
        el.addEventListener('mouseenter', onEnterPhoto);
        el.addEventListener('mouseleave', onLeavePhoto);
      });
      document.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('mouseenter', onEnterLink);
        el.addEventListener('mouseleave', onLeaveLink);
      });
    };

    window.addEventListener('mousemove', onMove);
    const t = setTimeout(bindHovers, 600);

    const observer = new MutationObserver(bindHovers);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      clearTimeout(t);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={dotRef}  className="cursor"      style={{ opacity: 0 }} />
      <div ref={ringRef} className="cursor-ring" style={{ opacity: 0 }} />
    </>
  );
}
