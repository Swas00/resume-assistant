import { Cpu, Terminal, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from './Button';

export interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onRunTestPrompt?: () => void;
}

export function Navbar({ currentTab, onTabChange }: NavbarProps) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'frontend', label: 'Frontend (React 19)', icon: Sparkles },
    { id: 'backend', label: 'Backend (Express)', icon: ShieldCheck },
    { id: 'ai', label: 'AI Service (FastAPI)', icon: Cpu },
    { id: 'devops', label: 'DevOps & Cloud', icon: Terminal },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/20 text-white font-bold">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Antigravity Manager
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Multi-Service Micro-Agent Orchestrator
            </p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            All 4 Services Ready
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open('https://github.com', '_blank')}
          >
            Repo
          </Button>
        </div>
      </div>
    </header>
  );
}
