'use client';

import { useEffect, useCallback, useRef } from 'react';

export interface LightboxPhoto {
  src: string;
  aspect?: number;
  title?: string;
  category?: string;
}

interface LightboxProps {
  isOpen: boolean;
  currentIndex: number;
  photos: LightboxPhoto[];
  onClose: () => void;
  onSelectIndex?: (index: number) => void;
  onNavigate?: (index: number) => void;
}

export default function Lightbox({
  isOpen,
  currentIndex,
  photos,
  onClose,
  onSelectIndex,
  onNavigate,
}: LightboxProps) {
  const currentPhoto = photos[currentIndex];

  const navigate = useCallback((index: number) => {
    if (typeof onSelectIndex === 'function') onSelectIndex(index);
    if (typeof onNavigate === 'function') onNavigate(index);
  }, [onSelectIndex, onNavigate]);

  const handlePrev = useCallback(() => {
    if (photos.length === 0) return;
    navigate((currentIndex - 1 + photos.length) % photos.length);
  }, [currentIndex, photos.length, navigate]);

  const handleNext = useCallback(() => {
    if (photos.length === 0) return;
    navigate((currentIndex + 1) % photos.length);
  }, [currentIndex, photos.length, navigate]);

  const touchStartXRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (deltaX > 45) {
      handlePrev();
    } else if (deltaX < -45) {
      handleNext();
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !currentPhoto) return null;

  const displayTitle = currentPhoto.title ||
    currentPhoto.src.split('/').pop()?.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') ||
    'Photograph';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="lightbox-overlay"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ── Top Bar ── */}
      <div className="lightbox-topbar">
        <div className="lightbox-counter">
          <span>{String(currentIndex + 1).padStart(2, '0')}</span>
          <span className="lightbox-sep">/</span>
          <span>{String(photos.length).padStart(2, '0')}</span>
        </div>

        <div className="lightbox-title">{displayTitle}</div>

        <button
          type="button"
          className="lightbox-close-btn"
          onClick={onClose}
          aria-label="Close lightbox"
        >
          <span className="lightbox-close-icon">✕</span>
          <span className="lightbox-close-text">Close</span>
        </button>
      </div>

      {/* ── Main Viewport ── */}
      <div className="lightbox-main" onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>
        {/* Prev Button */}
        <button
          type="button"
          className="lightbox-nav-btn lightbox-prev"
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          aria-label="Previous photograph"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Active Image */}
        <div className="lightbox-image-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={currentPhoto.src}
            src={currentPhoto.src}
            alt={displayTitle}
            className="lightbox-img"
          />
        </div>

        {/* Next Button */}
        <button
          type="button"
          className="lightbox-nav-btn lightbox-next"
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          aria-label="Next photograph"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* ── Bottom Controls & Hint ── */}
      <div className="lightbox-bottombar">
        <span className="lightbox-hint">Swipe or arrow keys to navigate · Tap outside to exit</span>
      </div>
    </div>
  );
}
