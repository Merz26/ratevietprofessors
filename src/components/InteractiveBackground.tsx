import { useEffect, useRef, memo } from 'react';
import { useAppTheme } from '../main';

interface Dot {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isDisplaced: boolean;
}

function InteractiveBackground() {
  const { resolvedTheme } = useAppTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<{
    x: number;
    y: number;
    active: boolean;
    lastMovedTime: number;
    intensity: number;
  }>({
    x: -1000,
    y: -1000,
    active: false,
    lastMovedTime: 0,
    intensity: 0,
  });

  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const isTouchOnly = !window.matchMedia?.('(hover: hover)')?.matches && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    let animationFrameId: number;
    let dots: Dot[] = [];
    let movingDotsIndices: Set<number> = new Set();
    let cols = 0;
    let rows = 0;
    let offsetX = 0;
    let offsetY = 0;

    // Adaptive spacing: higher spacing on low-core or touch devices to reduce dot count
    const SPACING = isTouchOnly ? 36 : 30;
    const REPEL_RADIUS = 120;
    const REPEL_RADIUS_SQ = REPEL_RADIUS * REPEL_RADIUS;
    const REPEL_STRENGTH = 5.5;
    const SPRING_FACTOR = 0.08;
    const DAMPING = 0.82;
    const TWO_PI = Math.PI * 2;
    const baseRadius = 1.25;

    const restingColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(30, 41, 59, 0.07)';

    let isLoopRunning = false;
    const requestWakeup = () => {
      if (!isLoopRunning && !prefersReducedMotion) {
        isLoopRunning = true;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    function drawStaticGrid() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        ctx.moveTo(dot.baseX + baseRadius, dot.baseY);
        ctx.arc(dot.baseX, dot.baseY, baseRadius, 0, TWO_PI);
      }
      ctx.fillStyle = restingColor;
      ctx.fill();
    }

    // High performance render loop
    function render() {
      const mouse = mouseRef.current;
      const now = performance.now();
      const timeSinceMove = now - mouse.lastMovedTime;

      // Stillness threshold
      const STILL_DELAY = 800;
      const FADE_TIME = 500;

      let targetIntensity = 0;
      if (mouse.active) {
        if (timeSinceMove < STILL_DELAY) {
          targetIntensity = 1;
        } else {
          const progress = Math.min(1, (timeSinceMove - STILL_DELAY) / FADE_TIME);
          targetIntensity = Math.max(0, 1 - progress);
        }
      }

      if (targetIntensity > mouse.intensity) {
        mouse.intensity = Math.min(targetIntensity, mouse.intensity + 0.15);
      } else {
        mouse.intensity = Math.max(targetIntensity, mouse.intensity - 0.05);
      }

      const intensity = mouse.intensity;

      if (spotlightRef.current) {
        spotlightRef.current.style.opacity = intensity.toFixed(2);
      }

      // 1. Spatial Partitioning: only compute repel for dots within bounding box of mouse
      if (intensity > 0.01 && mouse.x >= -REPEL_RADIUS && mouse.y >= -REPEL_RADIUS) {
        const minC = Math.max(0, Math.floor((mouse.x - REPEL_RADIUS - offsetX) / SPACING));
        const maxC = Math.min(cols - 1, Math.ceil((mouse.x + REPEL_RADIUS - offsetX) / SPACING));
        const minR = Math.max(0, Math.floor((mouse.y - REPEL_RADIUS - offsetY) / SPACING));
        const maxR = Math.min(rows - 1, Math.ceil((mouse.y + REPEL_RADIUS - offsetY) / SPACING));

        for (let r = minR; r <= maxR; r++) {
          const rowOffset = r * cols;
          for (let c = minC; c <= maxC; c++) {
            const idx = rowOffset + c;
            const dot = dots[idx];
            if (!dot) continue;

            const dx = dot.x - mouse.x;
            const dy = dot.y - mouse.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < REPEL_RADIUS_SQ && distSq > 0.25) {
              const dist = Math.sqrt(distSq);
              const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * intensity * REPEL_STRENGTH;
              const invDist = 1 / dist;
              dot.vx += dx * invDist * force;
              dot.vy += dy * invDist * force;
              dot.isDisplaced = true;
              movingDotsIndices.add(idx);
            }
          }
        }
      }

      // 2. Physics update ONLY on currently moving dots
      const settledIndices: number[] = [];
      movingDotsIndices.forEach(idx => {
        const dot = dots[idx];
        const homeDx = dot.baseX - dot.x;
        const homeDy = dot.baseY - dot.y;

        dot.vx += homeDx * SPRING_FACTOR;
        dot.vy += homeDy * SPRING_FACTOR;
        dot.vx *= DAMPING;
        dot.vy *= DAMPING;

        dot.x += dot.vx;
        dot.y += dot.vy;

        const distFromHomeSq = homeDx * homeDx + homeDy * homeDy;
        const isStillMoving = distFromHomeSq > 0.25 || Math.abs(dot.vx) > 0.01 || Math.abs(dot.vy) > 0.01;

        if (!isStillMoving) {
          dot.x = dot.baseX;
          dot.y = dot.baseY;
          dot.vx = 0;
          dot.vy = 0;
          dot.isDisplaced = false;
          settledIndices.push(idx);
        } else {
          dot.isDisplaced = distFromHomeSq > 0.4;
        }
      });

      for (let i = 0; i < settledIndices.length; i++) {
        movingDotsIndices.delete(settledIndices[i]);
      }

      // 3. Batch Canvas Rendering: Single draw call for all resting dots
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      ctx.beginPath();
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        if (!dot.isDisplaced) {
          ctx.moveTo(dot.baseX + baseRadius, dot.baseY);
          ctx.arc(dot.baseX, dot.baseY, baseRadius, 0, TWO_PI);
        }
      }
      ctx.fillStyle = restingColor;
      ctx.fill();

      // Draw the few displaced dots with smooth color highlighting
      movingDotsIndices.forEach(idx => {
        const dot = dots[idx];
        if (dot.isDisplaced) {
          const homeDx = dot.baseX - dot.x;
          const homeDy = dot.baseY - dot.y;
          const distFromHome = Math.sqrt(homeDx * homeDx + homeDy * homeDy);
          const ratio = Math.min(distFromHome / 20, 1);
          const r = baseRadius + ratio * 0.6;

          ctx.beginPath();
          ctx.arc(dot.x, dot.y, r, 0, TWO_PI);
          ctx.fillStyle = isDark
            ? `rgba(165, 180, 252, ${0.15 + ratio * 0.45})`
            : `rgba(79, 70, 229, ${0.15 + ratio * 0.45})`;
          ctx.fill();
        }
      });

      // If all dots have settled and mouse is idle, sleep loop (0% CPU)
      if (movingDotsIndices.size === 0 && intensity <= 0.01 && !mouse.active) {
        isLoopRunning = false;
      } else {
        animationFrameId = requestAnimationFrame(render);
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Rebuild dot grid
      cols = Math.ceil(width / SPACING) + 1;
      rows = Math.ceil(height / SPACING) + 1;
      offsetX = (width - (cols - 1) * SPACING) / 2;
      offsetY = (height - (rows - 1) * SPACING) / 2;

      dots = new Array(cols * rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = offsetX + c * SPACING;
          const y = offsetY + r * SPACING;
          dots[r * cols + c] = {
            baseX: x,
            baseY: y,
            x,
            y,
            vx: 0,
            vy: 0,
            isDisplaced: false,
          };
        }
      }
      movingDotsIndices.clear();

      if (prefersReducedMotion) {
        drawStaticGrid();
      } else {
        requestWakeup();
      }
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    if (prefersReducedMotion) {
      return () => {
        window.removeEventListener('resize', resize);
      };
    }

    // Pointer events with passive listener
    const updatePointer = (clientX: number, clientY: number) => {
      const prevX = mouseRef.current.x;
      const prevY = mouseRef.current.y;
      const moved = Math.abs(clientX - prevX) > 1 || Math.abs(clientY - prevY) > 1;

      mouseRef.current.x = clientX;
      mouseRef.current.y = clientY;
      mouseRef.current.active = true;

      if (moved || mouseRef.current.lastMovedTime === 0) {
        mouseRef.current.lastMovedTime = performance.now();
      }

      if (spotlightRef.current) {
        spotlightRef.current.style.background = isDark
          ? `radial-gradient(500px circle at ${clientX}px ${clientY}px, rgba(99, 102, 241, 0.14), transparent 75%)`
          : `radial-gradient(500px circle at ${clientX}px ${clientY}px, rgba(99, 102, 241, 0.10), transparent 75%)`;
      }

      requestWakeup();
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePointer(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      requestWakeup();
    };

    // On touch devices, respond to tap rather than continuous touchmove to avoid scroll hitch
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      mouseRef.current.active = false;
      requestWakeup();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    requestWakeup();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDark]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none transform-gpu"
    >
      {/* Base Canvas Gradient */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isDark
            ? 'bg-gradient-to-br from-[#0a0f1d] via-[#0e1628] to-[#040711]'
            : 'bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]'
        }`}
      />

      {/* Hardware-accelerated ambient glow orbs without heavy rasterization blur filters */}
      <div
        className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full pointer-events-none transition-opacity duration-700 animate-pulse transform-gpu"
        style={{
          background: isDark
            ? 'radial-gradient(circle at center, rgba(79, 70, 229, 0.22) 0%, rgba(99, 102, 241, 0.08) 45%, transparent 70%)'
            : 'radial-gradient(circle at center, rgba(99, 102, 241, 0.20) 0%, rgba(129, 140, 248, 0.08) 45%, transparent 70%)',
          animationDuration: '8s',
          willChange: 'opacity',
        }}
      />
      <div
        className="absolute top-1/4 -right-28 w-[500px] h-[500px] rounded-full pointer-events-none transition-opacity duration-700 animate-pulse transform-gpu"
        style={{
          background: isDark
            ? 'radial-gradient(circle at center, rgba(147, 51, 234, 0.18) 0%, rgba(168, 85, 247, 0.07) 45%, transparent 70%)'
            : 'radial-gradient(circle at center, rgba(168, 85, 247, 0.18) 0%, rgba(192, 132, 252, 0.07) 45%, transparent 70%)',
          animationDuration: '10s',
          animationDelay: '2s',
          willChange: 'opacity',
        }}
      />
      <div
        className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] rounded-full pointer-events-none transition-opacity duration-700 animate-pulse transform-gpu"
        style={{
          background: isDark
            ? 'radial-gradient(circle at center, rgba(37, 99, 235, 0.16) 0%, rgba(59, 130, 246, 0.06) 45%, transparent 70%)'
            : 'radial-gradient(circle at center, rgba(56, 189, 248, 0.18) 0%, rgba(125, 211, 252, 0.06) 45%, transparent 70%)',
          animationDuration: '12s',
          animationDelay: '4s',
          willChange: 'opacity',
        }}
      />

      {/* Interactive Cursor Spotlight Glow */}
      <div
        ref={spotlightRef}
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 transform-gpu"
      />

      {/* Interactive Repelling Dot Pattern Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none transform-gpu"
      />
    </div>
  );
}

export default memo(InteractiveBackground);

