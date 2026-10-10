/**
 * IGT Slot - Canvas Particle & Floating Coins Engine
 * Embosses the authentic IGT Emblem onto 3D floating coins.
 */

// Official IGT Logo Paths (I - G - T) extracted from vector asset
const IGT_EMBLEM_PATHS = (typeof Path2D !== 'undefined') ? [
  // Letter I
  {
    path: new Path2D('M0 0 C9.57 0 19.14 0 29 0 C29.28 50.98 29.28 50.98 19.07 64.89 C17.64 67.72 18.03 69.02 19 72 C19.74 73.57 20.54 75.11 21.38 76.62 C31.23 95.7 29.12 119.21 29 140 C19.43 140 9.86 140 0 140 C-0.07 134.74 -0.13 129.48 -0.16 124.22 C-0.18 122.43 -0.2 120.65 -0.23 118.87 C-0.43 104.7 -0.61 89.92 6.75 77.31 C9.32 73.13 9.32 73.13 9.88 68.44 C8.87 65.65 7.58 63.21 6.12 60.62 C-0.66 47.23 -0.4 33.22 -0.19 18.56 C-0.17 16.75 -0.16 14.94 -0.15 13.13 C-0.12 8.75 -0.06 4.38 0 0 Z'),
    fill: '#B85AFD',
    tx: 1.0,
    ty: 5.0
  },
  // Letter G
  {
    path: new Path2D('M0 0 C1.01 0.01 2.02 0.02 3.06 0.02 C10.92 0.2 17.46 1.18 24.69 4.44 C26.07 5.04 26.07 5.04 27.49 5.65 C42.28 12.87 51.54 24.69 57.02 39.99 C57.69 42.44 57.69 42.44 57.69 46.44 C53.17 46.73 48.65 46.91 44.12 47.06 C42.85 47.15 41.57 47.23 40.26 47.32 C30.94 47.56 30.94 47.56 27.26 44.27 C24.78 40.79 23.04 37.49 21.69 33.44 C19.82 32.35 19.82 32.35 17.69 31.44 C16.54 30.65 15.39 29.86 14.25 29.06 C1.05 20.92 -14.66 20.52 -29.46 23.83 C-32.76 24.64 -36.03 25.54 -39.31 26.44 C-40.98 26.79 -42.64 27.13 -44.31 27.44 C-51.55 48.8 -54.31 73.86 -44.55 94.89 C-37.56 108.98 -28.58 117.09 -13.61 122.44 C-5.29 124.96 3.02 125.96 11.69 125.44 C12.54 125.45 13.4 125.46 14.29 125.48 C17.29 125.29 19.06 124.94 21.69 123.44 C29.14 113.09 30.55 101.95 31.69 89.44 C21.46 89.44 11.23 89.44 0.69 89.44 C0.69 82.18 0.69 74.92 0.69 67.44 C20.16 67.44 39.63 67.44 59.69 67.44 C59.69 86.77 55.48 102.73 41.62 116.74 C35.67 122.21 28.91 125.97 21.64 129.41 C19.41 130.59 17.43 131.98 15.38 133.44 C6.17 139.62 -2.68 141.12 -13.67 141.01 C-15.68 141 -17.68 141.03 -19.69 141.07 C-35.02 141.05 -49.01 134.99 -60.3 124.6 C-72.7 111.24 -79 94.43 -79.69 76.31 C-78.97 58.57 -71.78 45.38 -59.13 33.37 C-50.34 25.44 -50.34 25.44 -46.31 25.44 C-46.05 24.86 -45.78 24.28 -45.51 23.68 C-39.66 12.71 -28.27 5.6 -16.76 1.85 C-11.14 0.21 -5.83 -0.06 0 0 Z'),
    fill: '#B859FD',
    tx: 124.3125,
    ty: 4.5625
  },
  // Letter T
  {
    path: new Path2D('M0 0 C37.29 0 74.58 0 113 0 C113 8.25 113 16.5 113 25 C99.47 25 85.94 25 72 25 C71.67 30.94 71.34 36.88 71 43 C69.58 51.29 67.64 57.48 63.3 64.66 C61.62 67.67 61.62 67.67 61 71 C62.09 73.32 62.09 73.32 63.75 75.62 C75.26 94 72.18 119.37 72 140 C62.43 140 52.86 140 43 140 C42.93 135.04 42.87 130.08 42.84 125.13 C42.82 123.45 42.8 121.77 42.77 120.09 C42.51 102.71 43.31 84.5 54 70 C52.93 67.81 51.82 65.69 50.6 63.58 C47.32 57.67 45.3 52.11 44.12 45.5 C44.01 44.84 43.89 44.17 43.76 43.49 C42.77 37.19 43 31.57 43 25 C28.81 25 14.62 25 0 25 C0 16.75 0 8.5 0 0 Z'),
    fill: '#B640FC',
    tx: 187.0,
    ty: 5.0
  }
] : [];
const MAXBET_EMBLEM_PATHS = IGT_EMBLEM_PATHS;


class ParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.ambientCoins = [];
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.isRunning = true;

    if (this.canvas) {
      this.resize();
      this.initCoinCache();
      window.addEventListener('resize', () => this.resize());
      this.initAmbient();
      this.animate();
    }
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    if (this.ctx) {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
  }

  // Pre-render the high-resolution 3D coin face & back to an offscreen canvas once
  initCoinCache() {
    const size = 128;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.46;

    const createFace = (isBack = false) => {
      const cvs = document.createElement('canvas');
      cvs.width = size;
      cvs.height = size;
      const cctx = cvs.getContext('2d');

      // Base Radial Gold Gradient
      const faceGrad = cctx.createRadialGradient(cx - radius * 0.22, cy - radius * 0.25, radius * 0.08, cx, cy, radius);
      faceGrad.addColorStop(0, '#fffef4');
      faceGrad.addColorStop(0.22, '#f6cb4b');
      faceGrad.addColorStop(0.55, '#d49514');
      faceGrad.addColorStop(0.85, '#996000');
      faceGrad.addColorStop(1, '#472700');

      cctx.beginPath();
      cctx.arc(cx, cy, radius, 0, Math.PI * 2);
      cctx.fillStyle = faceGrad;
      cctx.fill();

      // Raised outer rim bevel
      cctx.lineWidth = radius * 0.12;
      cctx.strokeStyle = '#6e4000';
      cctx.stroke();

      // Inner specular ring highlight
      cctx.beginPath();
      cctx.arc(cx, cy, radius * 0.88, 0, Math.PI * 2);
      cctx.lineWidth = 1.5;
      cctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      cctx.stroke();

      // Recessed minted inner bed ring
      cctx.beginPath();
      cctx.arc(cx, cy, radius * 0.74, 0, Math.PI * 2);
      cctx.lineWidth = 1;
      cctx.strokeStyle = 'rgba(60, 30, 0, 0.6)';
      cctx.stroke();

      // Beveled beads along border
      const dotCount = 20;
      cctx.fillStyle = 'rgba(255, 245, 190, 0.85)';
      for (let d = 0; d < dotCount; d++) {
        const a = (d / dotCount) * Math.PI * 2;
        const dx = cx + Math.cos(a) * (radius * 0.81);
        const dy = cy + Math.sin(a) * (radius * 0.81);
        cctx.beginPath();
        cctx.arc(dx, dy, radius * 0.024, 0, Math.PI * 2);
        cctx.fill();
      }

      // Embossed IGT Logo Relief
      if (IGT_EMBLEM_PATHS && IGT_EMBLEM_PATHS.length > 0) {
        const emblemTargetWidth = radius * (isBack ? 1.25 : 1.35);
        const s = emblemTargetWidth / 300.0;

        // Shadow pass
        cctx.save();
        cctx.translate(cx + 1.2, cy + 1.5);
        cctx.scale(s, s);
        cctx.translate(-150, -75);
        cctx.fillStyle = 'rgba(38, 16, 0, 0.85)';
        for (let i = 0; i < IGT_EMBLEM_PATHS.length; i++) {
          const item = IGT_EMBLEM_PATHS[i];
          cctx.save();
          cctx.translate(item.tx, item.ty);
          cctx.fill(item.path);
          cctx.restore();
        }
        cctx.restore();

        // Authentic metallic / vibrant IGT purple emblem pass
        cctx.save();
        cctx.translate(cx, cy);
        cctx.scale(s, s);
        cctx.translate(-150, -75);
        for (let i = 0; i < IGT_EMBLEM_PATHS.length; i++) {
          const item = IGT_EMBLEM_PATHS[i];
          cctx.save();
          cctx.translate(item.tx, item.ty);
          cctx.fillStyle = item.fill;
          cctx.fill(item.path);
          cctx.restore();
        }
        cctx.restore();
      }

      return cvs;
    };

    this.coinFaceCanvas = createFace(false);
    this.coinBackCanvas = createFace(true);
  }

  initAmbient() {
    this.ambientCoins = [];
    // Lightweight, calm, high-performance ambient coins (6 on mobile, 8 on desktop)
    const isMobile = window.innerWidth < 600;
    const count = isMobile ? 6 : 8;
    for (let i = 0; i < count; i++) {
      this.ambientCoins.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 22 + Math.random() * 22,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.006, // slow, relaxing rotational spin
        tiltAngle: Math.random() * Math.PI * 2,
        tiltSpeed: 0.005 + Math.random() * 0.008, // slow, majestic 3D tumble
        tiltAxis: Math.random() * Math.PI,
        speedX: (Math.random() - 0.5) * 0.12, // very gentle horizontal drift
        speedY: -0.07 - Math.random() * 0.09, // calm, slow upward floating
        opacity: 0.4 + Math.random() * 0.4
      });
    }
  }

  // Spawn celebration explosion of 3D coins and sparks
  spawnCelebration(isJackpot = false) {
    const count = isJackpot ? 48 : 24;
    const originX = this.width / 2;
    const originY = this.height * 0.52;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * (isJackpot ? 14 : 9);
      const isCoin = Math.random() > 0.35;

      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isJackpot ? 6 : 3.5),
        gravity: 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.08,
        tiltAngle: Math.random() * Math.PI * 2,
        tiltSpeed: 0.03 + Math.random() * 0.05,
        tiltAxis: Math.random() * Math.PI,
        size: isCoin ? (16 + Math.random() * 18) : (3 + Math.random() * 5),
        isCoin: isCoin,
        color: isCoin ? '#ffd700' : (Math.random() > 0.5 ? '#fff4b8' : (Math.random() > 0.5 ? '#b859fd' : '#e040fb')),
        alpha: 1,
        decay: 0.009 + Math.random() * 0.012
      });
    }
  }

  // Draw authentic 3D Extruded Gold Bullion Coin with tangible depth & embossed IGT emblem
  draw3DCoin(x, y, radius, tiltAngle, tiltAxis, spinAngle, opacity) {
    if (opacity <= 0 || radius <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = opacity;

    // Rotate to the tilt plane axis so coin can tumble in any 3D direction
    ctx.rotate(tiltAxis);

    const cosT = Math.cos(tiltAngle);
    const sinT = Math.sin(tiltAngle);
    const absCos = Math.abs(cosT);
    const aspect = Math.max(0.08, absCos);

    // Thick gold coin: heavy bullion coin with depth proportional to tilt
    const h = radius * 0.28 * Math.abs(sinT);
    const isFrontFacing = cosT >= 0;
    const faceY = sinT >= 0 ? -h * 0.5 : h * 0.5;

    // 1. Draw 3D Extruded Cylindrical Side Wall (when tilted enough to see the edge)
    if (h > 0.8) {
      // Horizontal metallic gradient running across the side of the cylinder (-radius to +radius)
      const edgeGrad = ctx.createLinearGradient(-radius, 0, radius, 0);
      edgeGrad.addColorStop(0, '#381e00');
      edgeGrad.addColorStop(0.16, '#8c5400');
      edgeGrad.addColorStop(0.38, '#f7ca45');
      edgeGrad.addColorStop(0.55, '#fff9d6');
      edgeGrad.addColorStop(0.72, '#d99a18');
      edgeGrad.addColorStop(0.88, '#7a4500');
      edgeGrad.addColorStop(1, '#2e1800');

      ctx.beginPath();
      if (sinT >= 0) {
        // Bottom side visible: connects front face bottom arc with back face bottom arc
        ctx.ellipse(0, -h * 0.5, radius, radius * aspect, 0, Math.PI, 0, true);
        ctx.lineTo(radius, h * 0.5);
        ctx.ellipse(0, h * 0.5, radius, radius * aspect, 0, 0, Math.PI, false);
        ctx.lineTo(-radius, -h * 0.5);
      } else {
        // Top side visible: connects front face top arc with back face top arc
        ctx.ellipse(0, h * 0.5, radius, radius * aspect, 0, Math.PI, Math.PI * 2, false);
        ctx.lineTo(radius, -h * 0.5);
        ctx.ellipse(0, -h * 0.5, radius, radius * aspect, 0, Math.PI * 2, Math.PI, true);
        ctx.lineTo(-radius, h * 0.5);
      }
      ctx.closePath();
      ctx.fillStyle = edgeGrad;
      ctx.fill();
    }

    // 2. Draw the Visible Face using Pre-rendered GPU Sprite Texture
    const faceTexture = isFrontFacing ? this.coinFaceCanvas : this.coinBackCanvas;
    if (faceTexture) {
      ctx.save();
      ctx.translate(0, faceY);
      ctx.scale(1, aspect);
      ctx.rotate(spinAngle - tiltAxis);
      ctx.drawImage(faceTexture, -radius, -radius, radius * 2, radius * 2);
      ctx.restore();
    }

    // 3. Specular Glint Flare on the face edge
    if (aspect > 0.28) {
      ctx.save();
      const glintX = -radius * 0.42;
      const glintY = faceY - radius * aspect * 0.42;
      const glintGrad = ctx.createRadialGradient(glintX, glintY, 0, glintX, glintY, radius * 0.38);
      glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      glintGrad.addColorStop(0.4, 'rgba(255, 220, 100, 0.2)');
      glintGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glintGrad;
      ctx.beginPath();
      ctx.arc(glintX, glintY, radius * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore(); // restore coin translation & rotation
  }

  animate() {
    if (!this.isRunning) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Render Ambient 3D Coins with Milled Depth
    for (let i = 0; i < this.ambientCoins.length; i++) {
      const c = this.ambientCoins[i];
      c.x += c.speedX;
      c.y += c.speedY;
      c.rotation += c.rotSpeed;
      c.tiltAngle += c.tiltSpeed;

      // Screen wrapping
      if (c.y < -60) {
        c.y = this.height + 50;
        c.x = Math.random() * this.width;
      }
      if (c.x < -60) c.x = this.width + 50;
      if (c.x > this.width + 60) c.x = -50;

      this.draw3DCoin(c.x, c.y, c.size, c.tiltAngle, c.tiltAxis, c.rotation, c.opacity);
    }

    // 2. Render Explosive Celebration 3D Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= p.decay;
      p.rotation += p.rotSpeed;
      p.tiltAngle += p.tiltSpeed;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      if (p.isCoin) {
        this.draw3DCoin(p.x, p.y, p.size, p.tiltAngle, p.tiltAxis, p.rotation, p.alpha);
      } else {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = p.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    }

    requestAnimationFrame(() => this.animate());
  }
}

window.ParticleEngine = ParticleEngine;
