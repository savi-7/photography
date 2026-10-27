# Scroll skew effect: prompt for Antigravity

Attach the reference frames (skew_scroll_reference.zip and/or frames_second_recording) in /reference.

## Prompt (copy everything below)

Upgrade my gallery's scroll to match /reference. Keep my existing layout, photos and links. Only change the scroll behaviour.

1) Smooth scroll: use Lenis (lerp 0.09) driven by gsap.ticker (gsap.ticker.lagSmoothing(0)).

2) Velocity skew on every photo, skewX only (no rotation, no skewY, no scale):
   - speed = clamp(|lenis.velocity| / 40, 0, 1)
   - Smooth it asymmetrically every frame: speed += (target - speed) * (target > speed ? 0.25 : 0.08)
     (reacts fast, relaxes over about 0.35s)
   - For each photo, nx = (centerX - vw/2) / (vw/2) and ny = (centerY - scrollY - vh/2) / (vh/2)
   - skewX (deg) = clamp(-28 * speed * nx * ny, -8, 8)
   - The sign must NOT depend on scroll direction (use |velocity|).
   - Use gsap.quickSetter(el, "skewX", "deg"). Set transform-origin center and will-change: transform.
   - Use the photos' layout positions (offsetLeft/offsetTop) for centerX and centerY, not getBoundingClientRect (skew changes it).
     Measure again on resize. Skip photos far outside the viewport.
   - At rest (speed 0) every photo must be perfectly straight.

3) Name/title: position fixed at the middle of the screen, z-index below the photos, with a slow parallax: translateY = -scrollY * 0.3.

4) Keep "ARCHIVE" and "CONTACT" fixed in the top corners, about 10px, bold, uppercase.

5) Respect prefers-reduced-motion (no skew).

Verify: record a slow and a fast scroll, down and up. Compare with the reference frames.
Check the four corners lean as follows (scrolling either way):
  upper-left: bottom edge shifts left | lower-left: bottom edge shifts right
  upper-right: bottom edge shifts right | lower-right: bottom edge shifts left
Check photos are straight when idle. Tune 28 (strength), 40 (full-speed velocity) and 0.08 (relax) until it matches.
