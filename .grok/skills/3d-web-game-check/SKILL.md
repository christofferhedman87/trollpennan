---
name: 3D web game check
description: >-
  Use when planning, prompting, testing or reviewing a 3D browser game (React
  Three Fiber / three.js) for kids on phones and tablets: scope, controls,
  camera, performance, screen-true tests and the traps AI builders fall into.
---
# 3D web game check

Use before writing a build prompt for a 3D feature, when designing its tests, and when reviewing a 3D build.

## Scope first
- Is 3D needed for the fun, or would 2.5D (billboards in a 3D scene, fixed camera) give the same feel cheaper? Default to the simplest that delights.
- One small scene that runs well beats a big world.

## Camera and controls for 7-12 year olds
- Fixed or gently following camera; no free orbit by default. Never let the camera go inside objects or lose the player.
- Tap to move or tap on things; touch targets at least ~44 px.
- Everything interactive looks interactive and reacts on tap.

## Performance on a mid-range phone
- Target 60 fps at 375x812; clamp devicePixelRatio (max 2).
- Few draw calls: merge static meshes, instancing, shared materials.
- Textures 512-1024 px, compressed; glTF with Draco or meshopt; low-poly.
- Point lights cost per pixel in every standard material: keep them few, and pool or drop them on low quality. At most one shadow-casting light or blob shadows.
- Lazy-load models and show something playable immediately.

## React Three Fiber guard rails (put the relevant ones in every prompt)
- No setState inside useFrame; mutate refs or use the store's getState.
- No new objects per frame; create once with useMemo.
- Dispose of geometries and textures when removed; useGLTF with preload, Instances.
- Game logic in a plain store, rendering in components.
- Handle WebGL context loss and a no-WebGL fallback.

## Screen-true tests (anything about what the player sees)
- The screen is the oracle. Measure visibility with an id or picking pass of the real render (visible pixels per object), not scene membership or bounding boxes.
- A rule that predicts the screen (placement, overlap, size) must use the same measure as the test: silhouette, not box; same rounding; same reference point. Compare them with a calibration script on identical states before tuning thresholds.
- Measure at a stable state: wait for animations to settle (or pause them) and require repeated identical readings longer than the longest animation cycle; fix seeds.
- Give each test block its own browser page so one crash doesn't kill the rest, and log the cause on timeout (readyState, console errors, failed requests).
- Keep a fast probe (one scene, one seed, minutes) separate from the full suite, and keep each job under 30 minutes.

## Review checklist
- fps and load time at phone size
- camera never loses the player; nothing interactive hidden behind geometry
- the child's own creations are always visible and never lost (stop-everything bug)
- text readable over the scene (HTML overlay for reading tasks)
- sound tied to events; mute separates music from voices
