# About Section Reference

`about-reference.mp4` is the target behaviour. Recreate this scroll sequence on my site
(Savio Joseph) directly after the end of the floating gallery. Keep my existing fonts,
colors, nav and footer; copy the layout and animation.

Ignore the small black box at the right edge of the video (screen-recorder overlay).

`frames/` holds numbered stills from the video in scroll order.

## Sequence (one pinned 100vh stage, scrubbed with GSAP ScrollTrigger + Lenis)

1. Intro: gallery images drift up and out. A small grayscale portrait (~210px wide, ~150px visible)
   rises to the horizontal center at the top under the nav. Two centered paragraphs
   (max-width ~750px, ~26px, line-height 1.4, dark gray) slide up beneath it. Hold ~1 viewport.
2. Stack wipe: text fades to light gray, portrait scrolls out the top. 7-8 portrait images
   (~400x540, centered, object-fit: cover, no radius) rise from the bottom, each sliding over the
   previous like stacked cards, overlapping so several edges show at once. Use my own photos.
3. Giant title: last image pins at center. A huge word (placeholder "CASABLANCA", ~20vw, near-black,
   left-aligned from ~2vw, anchored to the bottom, cut off by the right/bottom edge) fades in BEHIND
   the image. A tiny light-gray uppercase caption fades in at left, ~50% height. Then the pin releases.

## Details
- Scroll lengths: intro ~100vh, hold ~100vh, stack ~200vh, title ~100vh. Scrub ~0.6.
- Animate transform + opacity only. Mobile: stack ~70vw, paragraphs 18px, word 24vw.
- Respect prefers-reduced-motion. Keep nav fixed and on top.
- Put editable values (portrait, bio, stack images, big word, caption) in one config object.
