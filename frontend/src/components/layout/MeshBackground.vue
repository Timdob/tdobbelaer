<template>
  <div class="mesh" aria-hidden="true">
    <div class="mesh-blob mesh-blob-1"></div>
    <div class="mesh-blob mesh-blob-2"></div>
    <div class="mesh-blob mesh-blob-3"></div>
    <div class="mesh-grid"></div>
    <svg class="mesh-noise" xmlns="http://www.w3.org/2000/svg">
      <filter id="noise-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise-filter)" />
    </svg>
  </div>
</template>

<style scoped>
.mesh {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background:
    linear-gradient(180deg, #fffdf8 0%, var(--bg) 46%, color-mix(in srgb, var(--accent) 7%, var(--bg)) 100%);
}

.mesh-blob {
  position: absolute;
  filter: blur(80px);
  opacity: 0.28;
  will-change: transform;
}
.mesh-blob-1 {
  width: 70vw; height: 220px;
  top: -80px; left: -12vw;
  background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 32%, transparent), transparent);
  animation: drift-1 32s ease-in-out infinite alternate;
}
.mesh-blob-2 {
  width: 58vw; height: 190px;
  top: 35%; right: -16vw;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent-2) 28%, transparent));
  animation: drift-2 38s ease-in-out infinite alternate;
}
.mesh-blob-3 {
  width: 62vw; height: 180px;
  bottom: -80px; left: 20%;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 18%, var(--accent-2)), transparent);
  animation: drift-3 42s ease-in-out infinite alternate;
  opacity: 0.18;
}

.mesh-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
}

.mesh-noise {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  opacity: 0.025;
  mix-blend-mode: multiply;
  pointer-events: none;
}

@keyframes drift-1 {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to   { transform: translate3d(60px, 80px, 0) scale(1.08); }
}
@keyframes drift-2 {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to   { transform: translate3d(-80px, -60px, 0) scale(1.10); }
}
@keyframes drift-3 {
  from { transform: translate3d(0, 0, 0) scale(0.95); }
  to   { transform: translate3d(40px, -100px, 0) scale(1.12); }
}

@media (prefers-reduced-motion: reduce) {
  .mesh-blob { animation: none; }
}
</style>
