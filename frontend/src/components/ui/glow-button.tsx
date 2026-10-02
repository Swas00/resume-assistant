'use client';

import React, { useState, useRef } from 'react';

export interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  glowColor?: string;
  className?: string;
  showRipple?: boolean;
  tracking?: boolean;
  icon?: React.ReactNode;
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  (
    {
      text = 'Get moving',
      className = '',
      onClick,
      showRipple = true,
      tracking = true,
      icon,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLButtonElement | null>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
    const [isPressed, setIsPressed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [ripples, setRipples] = useState<Ripple[]>([]);

    // Combine forwarded ref and internal ref
    const setRef = (node: HTMLButtonElement | null) => {
      internalRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!tracking || !internalRef.current) return;
      const rect = internalRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      setIsPressed(false);
      setMousePos(null);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (showRipple && internalRef.current) {
        const rect = internalRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newRipple = { x, y, id: Date.now() };

        setRipples((prev) => [...prev.slice(-3), newRipple]);
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 900);
      }

      onClick?.(e);
    };

    return (
      <div className="relative inline-flex items-center justify-center group select-none">
        {/* Ambient Outer Diffuse Glow */}
        <div
          className={`absolute -inset-1.5 rounded-[26px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600 blur-xl transition-all duration-500 pointer-events-none ${
            isPressed
              ? 'opacity-95 scale-105 blur-2xl'
              : isHovered
              ? 'opacity-85 scale-102 blur-lg'
              : 'opacity-45 scale-98 blur-md'
          }`}
          style={{
            transform: isPressed ? 'scale(1.08)' : isHovered ? 'scale(1.03)' : 'scale(1)',
          }}
        />

        {/* Second Outer Pulse Ring for Click Burst */}
        <div
          className={`absolute -inset-3 rounded-[32px] bg-violet-500/30 blur-2xl transition-opacity duration-700 pointer-events-none ${
            isPressed ? 'opacity-100 scale-110' : isHovered ? 'opacity-60' : 'opacity-0'
          }`}
        />

        {/* Main Interactive Button Surface */}
        <button
          ref={setRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onClick={handleClick}
          {...props}
          className={`relative z-10 overflow-hidden rounded-[20px] px-8 py-3.5 md:px-10 md:py-4 font-bold text-base md:text-lg tracking-tight text-neutral-950 transition-all duration-300 ease-out active:scale-[0.95] cursor-pointer flex items-center justify-center gap-2.5 ${
            isPressed ? 'translate-y-0.5 scale-[0.96]' : isHovered ? '-translate-y-0.5 scale-[1.02]' : ''
          } ${className}`}
          style={{
            // Base Jitter button multi-layer gradient
            background:
              'linear-gradient(180deg, #FFFFFF 0%, #F5EEFF 35%, #D8B4FE 75%, #A855F7 100%)',
            boxShadow: isPressed
              ? '0 6px 20px rgba(124, 58, 237, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 8px rgba(109, 40, 217, 0.4)'
              : isHovered
              ? '0 16px 36px -4px rgba(124, 58, 237, 0.55), 0 0 24px rgba(168, 85, 247, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.95), inset 0 -2px 6px rgba(109, 40, 217, 0.3)'
              : '0 10px 25px -4px rgba(124, 58, 237, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -2px 5px rgba(109, 40, 217, 0.25)',
          }}
        >
          {/* Dynamic Radial Spotlight Tracking Cursor */}
          {tracking && mousePos && (
            <div
              className="absolute pointer-events-none rounded-full transition-opacity duration-300"
              style={{
                width: 220,
                height: 220,
                left: mousePos.x - 110,
                top: mousePos.y - 110,
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(243,232,255,0.3) 45%, transparent 70%)',
                mixBlendMode: 'overlay',
              }}
            />
          )}

          {/* Top Edge Specular Rim Highlight */}
          <div
            className="absolute top-0 left-0 right-0 h-[1.5px] pointer-events-none opacity-90"
            style={{
              background:
                'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.95) 45%, rgba(255,255,255,0.95) 55%, transparent 95%)',
            }}
          />

          {/* Bottom Magenta Glow Accent */}
          <div
            className="absolute bottom-0 left-1/4 right-1/4 h-[3px] pointer-events-none blur-[1px] opacity-75"
            style={{
              background:
                'radial-gradient(ellipse at bottom, rgba(244,114,182,0.9) 0%, rgba(192,38,211,0.6) 60%, transparent 100%)',
            }}
          />

          {/* Click Shockwave Ripples */}
          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              className="absolute rounded-full pointer-events-none animate-ping"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: 140,
                height: 140,
                transform: 'translate(-50%, -50%)',
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(192,132,252,0.5) 40%, transparent 80%)',
              }}
            />
          ))}

          {/* Button Text & Icon */}
          <span className="relative z-10 font-bold tracking-tight text-neutral-950 flex items-center gap-2 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
            {text}
            {icon}
          </span>
        </button>
      </div>
    );
  }
);

GlowButton.displayName = 'GlowButton';

export default GlowButton;
