/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

export default function HeroBackgroundScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    // Handle resizing
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = canvas.width = entry.contentRect.width;
        height = canvas.height = entry.contentRect.height;
      }
    });
    resizeObserver.observe(canvas);

    // Globe properties
    let rotationY = 0;
    const radius = Math.min(width, height) * 0.35;
    const dotsCount = 180;
    const dots: Array<{ x: number; y: number; z: number; size: number; pulseSpeed: number; pulsePhase: number }> = [];

    // Generate random nodes on wireframe sphere
    for (let i = 0; i < dotsCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      dots.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(phi),
        size: Math.random() * 1.5 + 0.5,
        pulseSpeed: Math.random() * 0.05 + 0.01,
        pulsePhase: Math.random() * Math.PI
      });
    }

    // Dynamic signals floating around globe
    const signals: Array<{
      progress: number;
      speed: number;
      startTheta: number;
      startPhi: number;
      endTheta: number;
      endPhi: number;
    }> = [];

    // Populate active signaling lines
    for (let i = 0; i < 8; i++) {
      signals.push({
        progress: Math.random(),
        speed: Math.random() * 0.01 + 0.005,
        startTheta: Math.random() * Math.PI * 2,
        startPhi: Math.random() * Math.PI,
        endTheta: Math.random() * Math.PI * 2,
        endPhi: Math.random() * Math.PI,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Center coordinates
      const cx = width / 2;
      const cy = height / 2;

      // Draw subtle orbital rings
      ctx.strokeStyle = 'rgba(62, 244, 255, 0.03)';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.6, 0, Math.PI * 2);
      ctx.stroke();

      // Rotate sphere
      rotationY += 0.0018;

      // Projection mapping parameters
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);

      // Draw wireframe grid rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      for (let r = 1; r < 4; r++) {
        const ringRadius = radius * (r / 4);
        ctx.beginPath();
        ctx.ellipse(cx, cy, ringRadius, ringRadius * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw nodes and connect them
      const projectedDots: Array<{ x: number; y: number; z: number; size: number; alpha: number }> = [];

      dots.forEach((dot) => {
        // Rotate points
        const x1 = dot.x * cosY - dot.z * sinY;
        const z1 = dot.x * sinY + dot.z * cosY;
        const y1 = dot.y;

        // Projection
        const scale = 1 / (1 + z1 * 0.35); // orthographic perspective
        const px = cx + x1 * radius * scale;
        const py = cy + y1 * radius * scale;

        // Depth/Alpha calculation (fade back nodes)
        const alpha = Math.max(0.08, (1 - z1) * 0.4);

        projectedDots.push({
          x: px,
          y: py,
          z: z1,
          size: dot.size * scale,
          alpha
        });
      });

      // Draw connection wires on front-facing nodes
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projectedDots.length; i++) {
        const d1 = projectedDots[i];
        if (d1.z > 0.3) continue; // Skip back nodes to clear viewport clutter

        let connections = 0;
        for (let j = i + 1; j < projectedDots.length; j++) {
          const d2 = projectedDots[j];
          if (d2.z > 0.3) continue;

          const dist = Math.hypot(d1.x - d2.x, d1.y - d2.y);
          if (dist < radius * 0.45 && connections < 2) {
            ctx.strokeStyle = `rgba(62, 244, 255, ${0.05 * (1 - dist / (radius * 0.45))})`;
            ctx.beginPath();
            ctx.moveTo(d1.x, d1.y);
            ctx.lineTo(d2.x, d2.y);
            ctx.stroke();
            connections++;
          }
        }
      }

      // Render front nodes with soft glow
      projectedDots.forEach((d) => {
        ctx.fillStyle = d.z < 0 ? `rgba(62, 244, 255, ${d.alpha * 1.5})` : `rgba(139, 92, 255, ${d.alpha * 0.75})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect on extremely bright nodes
        if (d.z < -0.8 && Math.random() > 0.8) {
          ctx.strokeStyle = 'rgba(62, 244, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.size * 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Draw signals (arcs traveling between positions)
      signals.forEach((sig) => {
        sig.progress += sig.speed;
        if (sig.progress >= 1.0) {
          sig.progress = 0;
          sig.startTheta = Math.random() * Math.PI * 2;
          sig.startPhi = Math.random() * Math.PI;
          sig.endTheta = Math.random() * Math.PI * 2;
          sig.endPhi = Math.random() * Math.PI;
        }

        // Interpolation on sphere surface
        const t = sig.progress;
        const theta = sig.startTheta + (sig.endTheta - sig.startTheta) * t;
        const phi = sig.startPhi + (sig.endPhi - sig.startPhi) * t;

        const sx = Math.sin(phi) * Math.cos(theta);
        const sy = Math.sin(phi) * Math.sin(theta);
        const sz = Math.cos(phi);

        // Rotation
        const rx = sx * cosY - sz * sinY;
        const rz = sx * sinY + sz * cosY;
        const ry = sy;

        // Projection
        const scale = 1 / (1 + rz * 0.35);
        const px = cx + rx * radius * scale;
        const py = cy + ry * radius * scale;

        if (rz < 0.2) { // only show on front
          ctx.fillStyle = 'rgba(62, 244, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(62, 244, 255, 0.2)';
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none bg-brand-bg">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      
      {/* Dynamic Earth Sphere */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Cybernetic Radial Shading Mask */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,var(--color-brand-bg)_80%)] pointer-events-none" />
    </div>
  );
}
