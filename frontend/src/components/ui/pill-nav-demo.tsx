'use client';

import React from 'react';
import { PillNav } from '@/components/ui/pill-nav';
import { Rocket } from 'lucide-react';

export const PillNavDemo: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('/');

  const navItems = [
    { label: 'Home', href: '/', onClick: () => setActiveTab('/') },
    { label: 'Collection', href: '/collection', onClick: () => setActiveTab('/collection') },
    { label: 'About', href: '/about', onClick: () => setActiveTab('/about') },
    { label: 'Contact', href: '/contact', onClick: () => setActiveTab('/contact') }
  ];

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-neutral-900 rounded-3xl border border-white/10 shadow-2xl">
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10 p-6 flex items-center justify-center relative overflow-visible">
        <PillNav 
          logo={<Rocket size={22} className="text-white" />}
          items={navItems}
          activeHref={activeTab}
          baseColor="#1A1A1B"
          pillColor="#F9F9F9"
          hoveredPillTextColor="#FFFFFF"
          pillTextColor="#1A1A1B"
        />
      </div>
      
      <div className="mt-6 text-center">
        <h3 className="text-lg font-semibold text-white tracking-tight">Pill Navigation</h3>
        <p className="text-neutral-400 text-xs mt-1 max-w-sm">
          A premium navigation component with GSAP rising circle animations and rotating logo interaction.
        </p>
      </div>
    </div>
  );
};

export default PillNavDemo;
