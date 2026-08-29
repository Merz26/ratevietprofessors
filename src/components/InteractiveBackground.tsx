import { useEffect, useRef } from 'react';
import { useAppTheme } from '../main';

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useAppTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Mouse position
    let mouseX = -1000;
    let mouseY = -1000;

    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    setSize();
    window.addEventListener('resize', setSize);

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    
    const onMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    const dotRadius = 1.5;
    const spacing = 28;
    const repulsionRadius = 150;
    const repulsionForce = 0.6;

    // Create a grid of dots
    const dots: { x: number; y: number; baseX: number; baseY: number }[] = [];
    
    const initDots = () => {
      dots.length = 0;
      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          dots.push({
            x: x + spacing / 2,
            y: y + spacing / 2,
            baseX: x + spacing / 2,
            baseY: y + spacing / 2,
          });
        }
      }
    };
    initDots();
    
    // Re-init on resize with debounce
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        initDots();
      }, 100);
    };
    window.addEventListener('resize', handleResize);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      const isDark = theme === 'dark';
      
      // Draw background gradient to match theme
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      if (isDark) {
        gradient.addColorStop(0, '#111827'); // gray-900
        gradient.addColorStop(1, '#030712'); // gray-950
      } else {
        gradient.addColorStop(0, '#f9fafb'); // gray-50
        gradient.addColorStop(1, '#f3f4f6'); // gray-100
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        
        // Calculate distance from mouse
        const dx = mouseX - dot.baseX;
        const dy = mouseY - dot.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Repulsion logic
        let targetX = dot.baseX;
        let targetY = dot.baseY;
        
        if (dist < repulsionRadius) {
          const force = (repulsionRadius - dist) / repulsionRadius;
          targetX -= dx * force * repulsionForce;
          targetY -= dy * force * repulsionForce;
        }
        
        // Spring back
        dot.x += (targetX - dot.x) * 0.15;
        dot.y += (targetY - dot.y) * 0.15;
        
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', setSize);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1]"
    />
  );
}
