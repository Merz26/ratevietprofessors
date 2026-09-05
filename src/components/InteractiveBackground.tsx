import { useEffect, useRef } from 'react';
import { useAppTheme } from '../main';

interface Dot {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function InteractiveBackground() {
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
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let dots: Dot[] = [];

    const SPACING = 28;
    const REPEL_RADIUS = 130;
    const REPEL_STRENGTH = 6.5;
    const SPRING_FACTOR = 0.07;
    const DAMPING = 0.84;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Rebuild dot grid
      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;
      const offsetX = (width - (cols - 1) * SPACING) / 2;
      const offsetY = (height - (rows - 1) * SPACING) / 2;

      dots = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = offsetX + c * SPACING;
          const y = offsetY + r * SPACING;
          dots.push({
            baseX: x,
            baseY: y,
            x,
            y,
            vx: 0,
            vy: 0,
          });
        }
      }
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Track mouse & touch movements with idle detection
    const updatePointer = (clientX: number, clientY: number) => {
      const prevX = mouseRef.current.x;
      const prevY = mouseRef.current.y;
      const moved = Math.abs(clientX - prevX) > 0.5 || Math.abs(clientY - prevY) > 0.5;

      mouseRef.current.x = clientX;
      mouseRef.current.y = clientY;
      mouseRef.current.active = true;

      if (moved || mouseRef.current.lastMovedTime === 0) {
        mouseRef.current.lastMovedTime = performance.now();
      }

      if (spotlightRef.current) {
        spotlightRef.current.style.background = isDark
          ? `radial-gradient(550px circle at ${clientX}px ${clientY}px, rgba(99, 102, 241, 0.16), transparent 80%)`
          : `radial-gradient(550px circle at ${clientX}px ${clientY}px, rgba(99, 102, 241, 0.12), transparent 80%)`;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePointer(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      // When touch input is released, immediately mark inactive so effect returns to normal
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const mouse = mouseRef.current;
      const now = performance.now();
      const timeSinceMove = now - mouse.lastMovedTime;

      // Stillness threshold: after 900ms of no movement, start dialing down to normal over 600ms
      const STILL_DELAY = 900;
      const FADE_TIME = 600;

      let targetIntensity = 0;
      if (mouse.active) {
        if (timeSinceMove < STILL_DELAY) {
          targetIntensity = 1;
        } else {
          // Progressively dial down back to 0
          const progress = Math.min(1, (timeSinceMove - STILL_DELAY) / FADE_TIME);
          targetIntensity = Math.max(0, 1 - progress);
        }
      } else {
        // No touch or mouse left window -> immediately dial down to 0
        targetIntensity = 0;
      }

      // Smooth easing of intensity: responsive to new movement, gentle returning to normal
      if (targetIntensity > mouse.intensity) {
        mouse.intensity = Math.min(targetIntensity, mouse.intensity + 0.12);
      } else {
        mouse.intensity = Math.max(targetIntensity, mouse.intensity - 0.04);
      }

      const intensity = mouse.intensity;

      // Sync spotlight opacity with dialed intensity
      if (spotlightRef.current) {
        spotlightRef.current.style.opacity = intensity.toFixed(3);
      }

      const baseRadius = 1.25;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // Repel from cursor scaled by dialed intensity
        if (intensity > 0.001) {
          const dx = dot.x - mouse.x;
          const dy = dot.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < REPEL_RADIUS && dist > 0.1) {
            const force = Math.pow((REPEL_RADIUS - dist) / REPEL_RADIUS, 1.3) * intensity;
            const angle = Math.atan2(dy, dx);
            dot.vx += Math.cos(angle) * force * REPEL_STRENGTH;
            dot.vy += Math.sin(angle) * force * REPEL_STRENGTH;
          }
        }

        // Spring force returning to base position
        const homeDx = dot.baseX - dot.x;
        const homeDy = dot.baseY - dot.y;
        dot.vx += homeDx * SPRING_FACTOR;
        dot.vy += homeDy * SPRING_FACTOR;

        // Friction damping
        dot.vx *= DAMPING;
        dot.vy *= DAMPING;

        // Move dot
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Render dot
        const distFromHome = Math.sqrt(homeDx * homeDx + homeDy * homeDy);
        const isDisplaced = distFromHome > 0.8;

        ctx.beginPath();
        if (isDisplaced) {
          const ratio = Math.min(distFromHome / 25, 1);
          const r = baseRadius + ratio * 0.7;
          ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);
          ctx.fillStyle = isDark
            ? `rgba(165, 180, 252, ${0.12 + ratio * 0.5})`
            : `rgba(79, 70, 229, ${0.12 + ratio * 0.45})`;
        } else {
          ctx.arc(dot.x, dot.y, baseRadius, 0, Math.PI * 2);
          ctx.fillStyle = isDark
            ? 'rgba(255, 255, 255, 0.09)'
            : 'rgba(30, 41, 59, 0.08)';
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDark]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
    >
      {/* Base Canvas Gradient */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isDark
            ? 'bg-gradient-to-br from-[#0a0f1d] via-[#0e1628] to-[#040711]'
            : 'bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]'
        }`}
      />

      {/* Ambient Aurora Glow Orbs */}
      <div
        className={`absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full blur-[110px] pointer-events-none transition-opacity duration-700 animate-pulse ${
          isDark ? 'bg-indigo-600/20' : 'bg-indigo-400/25'
        }`}
        style={{ animationDuration: '8s' }}
      />
      <div
        className={`absolute top-1/4 -right-28 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-opacity duration-700 animate-pulse ${
          isDark ? 'bg-purple-600/18' : 'bg-purple-400/20'
        }`}
        style={{ animationDuration: '10s', animationDelay: '2s' }}
      />
      <div
        className={`absolute -bottom-32 left-1/3 w-[600px] h-[600px] rounded-full blur-[130px] pointer-events-none transition-opacity duration-700 animate-pulse ${
          isDark ? 'bg-blue-600/16' : 'bg-sky-400/20'
        }`}
        style={{ animationDuration: '12s', animationDelay: '4s' }}
      />

      {/* Interactive Cursor Spotlight Glow */}
      <div
        ref={spotlightRef}
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0"
      />

      {/* Interactive Repelling Dot Pattern Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}

