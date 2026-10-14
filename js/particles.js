/**
 * Happy Hour Slot - Canvas Particle & Floating Coins Engine
 * Embosses the authentic brand flower onto floating coins.
 */

// Brand Flower Paths extracted from the SVG logo
const FLOWER_CENTER_PATH = (typeof Path2D !== 'undefined') ? new Path2D(
  "M64.88,42.15c-.25,0-.45.18-.49.42-.02.13-1.94,11.8-4.94,14.78-3,2.98-14.68,4.83-14.81,4.85-.24.04-.42.24-.43.49,0,.25.18.45.42.49.13.02,11.8,1.94,14.78,4.94,2.98,3,4.83,14.68,4.85,14.81.03.24.24.42.49.42s.45-.18.49-.42c.02-.13,1.94-11.8,4.94-14.78,3-2.98,14.68-4.83,14.81-4.85.24-.03.42-.24.42-.49,0-.25-.18-.45-.42-.49-.13-.02-11.8-1.94-14.78-4.94-2.98-3-4.83-14.68-4.85-14.81-.03-.24-.24-.42-.49-.42h0Z"
) : null;

const FLOWER_PETALS_PATH = (typeof Path2D !== 'undefined') ? new Path2D(
  "M85.07,0 L64.88,12.11 L64.88,36.33 L85.07,24.22 Z " +
  "M29.39,6.8 L26.28,30.13 L45.22,45.23 L48.33,21.9 Z " +
  "M0,54.56 L16.3,71.54 L39.91,66.15 L23.61,49.17 Z " +
  "M19.02,107.33 L42.46,105.17 L52.96,83.35 L29.53,85.5 Z " +
  "M72.13,125.35 L85.06,105.68 L74.54,83.86 L61.62,103.53 Z " +
  "M119.33,95.07 L112.02,72.7 L88.4,67.31 L95.72,89.68 Z " +
  "M125.09,39.28 L103.03,31.05 L84.1,46.16 L106.15,54.38 Z"
) : null;

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

      // Embossed Brand Flower Relief
      if (FLOWER_PETALS_PATH && FLOWER_CENTER_PATH) {
        const flowerRadius = radius * (isBack ? 0.40 : 0.46);
        const s = flowerRadius / 62.5;

        // Shadow pass
        cctx.save();
        cctx.translate(cx + 1.2, cy + 1.5);
        cctx.scale(s, s);
        cctx.translate(-62.54, -62.67);
        cctx.fillStyle = 'rgba(38, 16, 0, 0.85)';
        cctx.fill(FLOWER_PETALS_PATH);
        cctx.fill(FLOWER_CENTER_PATH);
        cctx.restore();

        // Raised metallic face pass
        cctx.save();
        cctx.translate(cx, cy);
        cctx.scale(s, s);
        cctx.translate(-62.54, -62.67);
        cctx.fillStyle = isBack ? '#ffd54f' : '#fff9d6';
        cctx.fill(FLOWER_PETALS_PATH);
        cctx.fill(FLOWER_CENTER_PATH);
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
        color: isCoin ? '#ffd700' : (Math.random() > 0.5 ? '#fff4b8' : '#f59e0b'),
        alpha: 1,
        decay: 0.009 + Math.random() * 0.012
      });
    }
  }

  // Draw authentic 3D Extruded Gold Bullion Coin with tangible depth & embossed brand flower
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
