import React, { useEffect, useRef } from 'react';
import useGamificationStore from '../../store/gamificationStore';

/**
 * ConfettiEffect – renders a canvas-based confetti burst.
 * Triggers whenever `triggerConfetti` is true in the gamification store.
 */
const ConfettiEffect = () => {
    const canvasRef = useRef(null);
    const animFrameRef = useRef(null);
    const { triggerConfetti, confettiReason, clearConfetti } = useGamificationStore();

    useEffect(() => {
        if (!triggerConfetti) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#8b5cf6', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316'];
        const shapes = ['circle', 'rect', 'triangle'];
        const count = confettiReason === 'perfect_score' ? 200 : 120;

        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: -20 - Math.random() * 200,
                vx: (Math.random() - 0.5) * 6,
                vy: 3 + Math.random() * 5,
                size: 6 + Math.random() * 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: shapes[Math.floor(Math.random() * shapes.length)],
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                opacity: 1,
                gravity: 0.08 + Math.random() * 0.05,
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = false;

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.rotation += p.rotationSpeed;
                if (p.y < canvas.height + 50) {
                    alive = true;
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    ctx.fillStyle = p.color;

                    if (p.shape === 'circle') {
                        ctx.beginPath();
                        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (p.shape === 'rect') {
                        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                    } else {
                        ctx.beginPath();
                        ctx.moveTo(0, -p.size / 2);
                        ctx.lineTo(p.size / 2, p.size / 2);
                        ctx.lineTo(-p.size / 2, p.size / 2);
                        ctx.closePath();
                        ctx.fill();
                    }
                    ctx.restore();
                }
            });

            if (alive) {
                animFrameRef.current = requestAnimationFrame(draw);
            } else {
                clearConfetti();
            }
        };

        animFrameRef.current = requestAnimationFrame(draw);
        // Auto-clear after 4s even if particles are still going
        const timeout = setTimeout(() => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            clearConfetti();
        }, 4000);

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            clearTimeout(timeout);
        };
    }, [triggerConfetti, clearConfetti, confettiReason]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[999] pointer-events-none"
            style={{ display: triggerConfetti ? 'block' : 'none' }}
        />
    );
};

export default ConfettiEffect;
