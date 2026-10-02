/**
 * PillNav - A premium, GSAP-powered navigation component.
 * Features:
 * - Rising circle background animation on hover
 * - Rotating logo animation
 * - Responsive mobile menu with GSAP transitions
 * - Support for both React Router Link, custom onClick callbacks, and standard anchor tags
 * - Customizable colors and easing
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { Menu, X } from 'lucide-react';

export type PillNavItem = {
  label: string;
  href: string;
  ariaLabel?: string;
  onClick?: (e?: React.MouseEvent) => void;
};

export interface PillNavProps {
  /** Logo icon component or source URL (image or SVG) */
  logo: React.ReactNode | string;
  /** Alt text for the logo */
  logoAlt?: string;
  /** Navigation items array */
  items: PillNavItem[];
  /** The current active href for highlighting */
  activeHref?: string;
  /** Optional extra class names for the nav container */
  className?: string;
  /** GSAP easing function */
  ease?: string;
  /** The base background color of the nav pills and logo container */
  baseColor?: string;
  /** The color of the pill when not hovered */
  pillColor?: string;
  /** Text color when the pill is hovered */
  hoveredPillTextColor?: string;
  /** Default text color for the pills */
  pillTextColor?: string;
  /** Callback for mobile menu toggle */
  onMobileMenuClick?: () => void;
  /** Callback when logo is clicked */
  onLogoClick?: (e?: React.MouseEvent) => void;
  /** Whether to play an entrance animation on mount */
  initialLoadAnimation?: boolean;
}

export const PillNav: React.FC<PillNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  activeHref,
  className = '',
  ease = 'power3.out',
  baseColor = '#111113',
  pillColor = '#ffffff',
  hoveredPillTextColor = '#ffffff',
  pillTextColor,
  onMobileMenuClick,
  onLogoClick,
  initialLoadAnimation = true
}) => {
  const resolvedPillTextColor = pillTextColor ?? '#111113';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const circleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const tlRefs = useRef<Array<gsap.core.Timeline | null>>([]);
  const activeTweenRefs = useRef<Array<gsap.core.Tween | null>>([]);
  const logoImgRef = useRef<HTMLDivElement | HTMLImageElement | null>(null);
  const logoTweenRef = useRef<gsap.core.Tween | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const navItemsRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLAnchorElement | HTMLDivElement | null>(null);

  const renderLogo = () => {
    if (typeof logo === 'string') {
      return (
        <img 
          src={logo} 
          alt={logoAlt} 
          ref={logoImgRef as React.RefObject<HTMLImageElement>} 
          className="w-6 h-6 object-contain pointer-events-none" 
        />
      );
    }
    return (
      <div ref={logoImgRef as React.RefObject<HTMLDivElement>} className="flex items-center justify-center pointer-events-none">
        {logo}
      </div>
    );
  };

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle, index) => {
        if (!circle?.parentElement) return;
        
        const pill = circle.parentElement as HTMLElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        if (w === 0 || h === 0) return;
        
        // Calculate the radius for the expanding circle to cover the pill
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;
        
        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`
        });

        const label = pill.querySelector<HTMLElement>('.pill-label');
        const white = pill.querySelector<HTMLElement>('.pill-label-hover');
        
        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });
        
        tl.to(circle, { 
          scale: 1.25, 
          xPercent: -50, 
          duration: 0.7, 
          ease, 
          overwrite: 'auto' 
        }, 0);
        
        if (label) {
          tl.to(label, { 
            y: -(h + 8), 
            duration: 0.55, 
            ease, 
            overwrite: 'auto' 
          }, 0);
        }
        
        if (white) {
          gsap.set(white, { y: Math.ceil(h + 20), opacity: 0 });
          tl.to(white, { 
            y: 0, 
            opacity: 1, 
            duration: 0.55, 
            ease, 
            overwrite: 'auto' 
          }, 0);
        }
        
        tlRefs.current[index] = tl;
      });
    };

    layout();
    
    const onResize = () => layout();
    window.addEventListener('resize', onResize);
    
    if (document.fonts) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    // Initial load animation
    if (initialLoadAnimation) {
      const logoEl = logoRef.current;
      const navItems = navItemsRef.current;
      
      if (logoEl) {
        gsap.set(logoEl, { scale: 0, opacity: 0 });
        gsap.to(logoEl, {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: "back.out(1.7)"
        });
      }
      
      if (navItems) {
        const listItems = navItems.querySelectorAll('li');
        gsap.set(listItems, { opacity: 0, x: -16 });
        gsap.to(listItems, {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.04,
          ease: "power2.out",
          delay: 0.15
        });
      }
    }

    return () => window.removeEventListener('resize', onResize);
  }, [items, ease, initialLoadAnimation]);

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.35,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.3,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLogoEnter = () => {
    const img = logoImgRef.current;
    if (!img) return;
    logoTweenRef.current?.kill();
    logoTweenRef.current = gsap.to(img, {
      rotate: 360,
      duration: 0.8,
      ease: "elastic.out(1, 0.5)",
      overwrite: 'auto',
      onComplete: () => gsap.set(img, { rotate: 0 })
    });
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    
    const menu = mobileMenuRef.current;
    if (menu) {
      if (newState) {
        gsap.set(menu, { display: 'block', opacity: 0, y: -16 });
        gsap.to(menu, {
          opacity: 1,
          y: 0,
          duration: 0.35,
          ease: "power3.out"
        });
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: -16,
          duration: 0.25,
          ease: "power3.in",
          onComplete: () => {
            gsap.set(menu, { display: 'none' });
          }
        });
      }
    }
    onMobileMenuClick?.();
  };

  const isExternalLink = (href: string) =>
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#');

  const isRouterLink = (href?: string) => !!href && !isExternalLink(href);

  const cssVars = {
    '--base': baseColor,
    '--pill-bg': pillColor,
    '--hover-text': hoveredPillTextColor,
    '--pill-text': resolvedPillTextColor,
    '--nav-h': '50px',
    '--logo-size': '42px',
    '--pill-pad-x': '18px',
    '--pill-gap': '6px'
  } as React.CSSProperties;

  return (
    <div className={`relative z-[100] w-full max-w-5xl mx-auto ${className}`} style={cssVars}>
      <nav
        className="w-full flex items-center justify-between md:justify-center p-3 gap-3"
        aria-label="Primary"
      >
        {/* Logo Section */}
        <div 
          ref={el => { logoRef.current = el; }}
          onMouseEnter={handleLogoEnter}
          className="flex-shrink-0"
        >
          {items[0] && isRouterLink(items[0].href) ? (
            <Link
              to={items[0].href}
              onClick={(e) => {
                if (onLogoClick) {
                  e.preventDefault();
                  onLogoClick(e);
                }
              }}
              className="flex items-center justify-center rounded-full overflow-hidden transition-transform duration-300 hover:scale-105 active:scale-95 shadow-md"
              style={{
                width: 'var(--nav-h)',
                height: 'var(--nav-h)',
                background: 'var(--base)',
                color: 'var(--pill-bg)'
              }}
            >
              {renderLogo()}
            </Link>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                if (onLogoClick) onLogoClick(e);
                else if (items[0]?.onClick) items[0].onClick(e);
              }}
              className="flex items-center justify-center rounded-full overflow-hidden transition-transform duration-300 hover:scale-105 active:scale-95 shadow-md cursor-pointer border-0"
              style={{
                width: 'var(--nav-h)',
                height: 'var(--nav-h)',
                background: 'var(--base)',
                color: 'var(--pill-bg)'
              }}
            >
              {renderLogo()}
            </button>
          )}
        </div>

        {/* Desktop Menu */}
        <div
          ref={navItemsRef}
          className="hidden md:flex items-center rounded-full px-2 shadow-lg backdrop-blur-md"
          style={{
            height: 'var(--nav-h)',
            background: 'var(--base)'
          }}
        >
          <ul
            role="menubar"
            className="list-none flex items-stretch m-0 p-0 h-full"
            style={{ gap: 'var(--pill-gap)' }}
          >
            {items.map((item, i) => {
              const isActive = activeHref === item.href;
              
              const pillStyle: React.CSSProperties = {
                background: isActive ? 'var(--base)' : 'var(--pill-bg)',
                color: isActive ? 'var(--hover-text)' : 'var(--pill-text)',
                paddingLeft: 'var(--pill-pad-x)',
                paddingRight: 'var(--pill-pad-x)'
              };

              const PillContent = (
                <>
                  <span
                    className="hover-circle absolute left-1/2 bottom-0 rounded-full z-[1] block pointer-events-none"
                    style={{
                      background: 'var(--base)',
                      willChange: 'transform'
                    }}
                    aria-hidden="true"
                    ref={el => {
                      circleRefs.current[i] = el;
                    }}
                  />
                  <span className="label-stack relative inline-block leading-none z-[2] overflow-hidden py-1">
                    <span
                      className="pill-label relative z-[2] inline-block font-medium tracking-wide text-xs"
                      style={{ willChange: 'transform' }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="pill-label-hover absolute left-0 top-1 z-[3] inline-block w-full text-center font-medium tracking-wide text-xs"
                      style={{
                        color: 'var(--hover-text)',
                        willChange: 'transform, opacity'
                      }}
                      aria-hidden="true"
                    >
                      {item.label}
                    </span>
                  </span>
                  {isActive && (
                    <span
                      className="absolute left-1/2 -bottom-0.5 -translate-x-1/2 w-1.5 h-1.5 rounded-full z-[4] bg-blue-500 shadow-sm"
                      aria-hidden="true"
                    />
                  )}
                </>
              );

              const basePillClasses = "relative overflow-hidden inline-flex items-center justify-center h-[calc(var(--nav-h)-12px)] self-center no-underline rounded-full box-border font-semibold text-xs uppercase tracking-wider cursor-pointer transition-all duration-200 hover:z-10 select-none";

              return (
                <li key={item.href || i} role="none" className="flex items-center">
                  {item.onClick ? (
                    <button
                      type="button"
                      role="menuitem"
                      className={`${basePillClasses} border-0`}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      onClick={(e) => item.onClick?.(e)}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                    >
                      {PillContent}
                    </button>
                  ) : isRouterLink(item.href) ? (
                    <Link
                      role="menuitem"
                      to={item.href}
                      className={basePillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                    >
                      {PillContent}
                    </Link>
                  ) : (
                    <a
                      role="menuitem"
                      href={item.href}
                      className={basePillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                    >
                      {PillContent}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Mobile Hamburger */}
        <button
          ref={hamburgerRef}
          type="button"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
          className="md:hidden flex items-center justify-center rounded-full transition-transform active:scale-90 shadow-md cursor-pointer border-0"
          style={{
            width: 'var(--nav-h)',
            height: 'var(--nav-h)',
            background: 'var(--base)',
            color: 'var(--pill-bg)'
          }}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      <div
        ref={mobileMenuRef}
        className="md:hidden absolute top-full left-4 right-4 mt-2 rounded-2xl overflow-hidden shadow-2xl z-[999] hidden border border-white/10 backdrop-blur-xl"
        style={{
          background: 'var(--base)'
        }}
      >
        <ul className="list-none m-0 p-3 flex flex-col gap-1.5">
          {items.map((item) => {
            const isActive = activeHref === item.href;
            const mobileItemClass = `block py-3 px-5 text-xs font-semibold uppercase tracking-widest rounded-xl transition-all ${
              isActive 
                ? 'bg-white/20 text-white font-bold' 
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`;

            return (
              <li key={item.href}>
                {item.onClick ? (
                  <button
                    type="button"
                    className={`w-full text-left cursor-pointer border-0 ${mobileItemClass}`}
                    onClick={(e) => {
                      item.onClick?.(e);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {item.label}
                  </button>
                ) : isRouterLink(item.href) ? (
                  <Link
                    to={item.href}
                    className={mobileItemClass}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className={mobileItemClass}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PillNav;
