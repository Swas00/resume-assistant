'use client';

import { useState, useEffect } from 'react';
import { GlowButton } from './glow-button';
import { Sparkles, Play, Pause, RotateCcw, MousePointer } from 'lucide-react';

export function InteractiveGlowDemo() {
  const [clickCount, setClickCount] = useState(0);
  const [buttonText, setButtonText] = useState('Get moving');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState<'idle' | 'moving' | 'hover' | 'clicking' | 'released'>('idle');

  const toggleSimulation = () => {
    setIsSimulating((prev) => {
      const next = !prev;
      if (!next) setSimStep('idle');
      return next;
    });
  };

  // Virtual cursor simulation loop matching Jitter preview
  useEffect(() => {
    if (!isSimulating) return;

    let isMounted = true;

    const runCycle = async () => {
      if (!isMounted) return;
      setSimStep('moving');

      // Move into hover
      await new Promise((r) => setTimeout(r, 600));
      if (!isMounted) return;
      setSimStep('hover');

      // Click down
      await new Promise((r) => setTimeout(r, 600));
      if (!isMounted) return;
      setSimStep('clicking');
      setClickCount((c) => c + 1);

      // Release click
      await new Promise((r) => setTimeout(r, 250));
      if (!isMounted) return;
      setSimStep('released');

      // Idle and repeat
      await new Promise((r) => setTimeout(r, 900));
      if (!isMounted) return;
      setSimStep('idle');

      await new Promise((r) => setTimeout(r, 500));
      if (isMounted && isSimulating) {
        runCycle();
      }
    };

    runCycle();

    return () => {
      isMounted = false;
    };
  }, [isSimulating]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#09031a]">
      {/* Ambient background lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Header controls bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 p-5 md:px-8 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">
              Jitter Micro-Interaction · Glow Button
            </h4>
            <p className="text-xs text-purple-200/60">
              Interactive click simulation based on Jitter motion template
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSimulation}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              isSimulating
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/10 hover:bg-white/15 text-white/80'
            }`}
          >
            {isSimulating ? <Pause size={13} /> : <Play size={13} />}
            {isSimulating ? 'Pause Auto-Play' : 'Simulate Cursor'}
          </button>

          <button
            onClick={() => setClickCount(0)}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/60 hover:text-white transition"
            title="Reset Counter"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Interactive Stage */}
      <div className="relative min-h-[320px] md:min-h-[380px] flex flex-col items-center justify-center p-8 select-none overflow-hidden">
        {/* The Glow Button Component */}
        <div className="relative">
          <GlowButton
            text={buttonText}
            onClick={() => setClickCount((c) => c + 1)}
            className={
              simStep === 'clicking'
                ? '!scale-[0.95] !translate-y-1'
                : simStep === 'hover' || simStep === 'released'
                ? '!scale-[1.03] !-translate-y-1'
                : ''
            }
          />

          {/* Simulated Cursor (from Jitter motion demo) */}
          {isSimulating && (
            <div
              className="absolute pointer-events-none transition-all duration-500 ease-out z-30"
              style={{
                left:
                  simStep === 'idle'
                    ? '140%'
                    : simStep === 'moving'
                    ? '80%'
                    : '50%',
                top:
                  simStep === 'idle'
                    ? '140%'
                    : simStep === 'moving'
                    ? '90%'
                    : '68%',
                transform: `translate(-50%, -50%) ${
                  simStep === 'clicking' ? 'scale(0.85)' : 'scale(1)'
                }`,
                opacity: simStep === 'idle' ? 0 : 1,
              }}
            >
              {/* Sleek SVG Cursor Matching Jitter */}
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
              >
                <path
                  d="M4 3L11 21L14.5 13.5L22 10L4 3Z"
                  fill="#000000"
                  stroke="#FFFFFF"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Real-time Click Feedback */}
        <div className="mt-8 flex items-center gap-3">
          <span className="text-xs font-mono uppercase tracking-wider text-purple-200/50">
            Interactive Clicks:
          </span>
          <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-xs font-bold font-mono text-purple-200">
            {clickCount} {clickCount === 1 ? 'click' : 'clicks'}
          </span>
        </div>
      </div>

      {/* Preset Customizer Toolbar */}
      <div className="p-4 md:px-8 bg-black/40 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-white/50">
          <MousePointer size={14} /> Try clicking or switch preset text:
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['Get moving', 'Launch AI Studio', 'Enhance with Claude', 'Analyze Resume'].map((label) => (
            <button
              key={label}
              onClick={() => setButtonText(label)}
              className={`px-3 py-1 rounded-lg transition-all ${
                buttonText === label
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InteractiveGlowDemo;
