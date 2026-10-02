import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { Card } from './components/Card';
import { CheckCircle2, Code, Terminal, Server, Brain, Cloud } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar currentTab={activeTab} onTabChange={setActiveTab} />

      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'overview' && <HomePage />}
        {activeTab === 'frontend' && (
          <div className="space-y-6">
            <Card
              title="Agent Frontend Setup (React 19 + Vite + Tailwind)"
              subtitle="Full boilerplate configured with strict typing, optimized bundler, and design system"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  Frontend environment initialized and fully ready
                </div>
                <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-700 dark:text-slate-300">
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Architecture Features</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>React 19 with strict ES2022 TypeScript</li>
                      <li>Tailwind CSS v3.4 with forms & typography</li>
                      <li>Vite 6 with chunk splitting & proxy config</li>
                      <li>ESLint v9 Flat Config + Prettier 3 formatters</li>
                    </ul>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Folder Hierarchy</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><code>/src/components</code>: Button, Card, Navbar</li>
                      <li><code>/src/pages</code>: HomePage, DashboardPage</li>
                      <li><code>/src/hooks</code>: useAuth, useFetch</li>
                      <li><code>/src/utils</code>: cn, api client</li>
                    </ul>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900 p-4 text-xs font-mono text-slate-200">
                  <p className="text-slate-400"># Start Frontend Dev Server</p>
                  <p className="text-indigo-400">cd frontend && npm install && npm run dev</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'backend' && (
          <div className="space-y-6">
            <Card
              title="Agent Backend Setup (Express + MongoDB)"
              subtitle="Enterprise REST API skeleton with TypeScript, authentication, and error boundaries"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  Express + MongoDB environment initialized and fully ready
                </div>
                <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-700 dark:text-slate-300">
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Backend Highlights</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Express with CORS, Helmet, and express.json</li>
                      <li>Mongoose connection with retry & graceful shutdown</li>
                      <li>JWT Bearer authentication middleware</li>
                      <li>Custom AppError and centralized error middleware</li>
                    </ul>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Folder Hierarchy</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><code>/routes</code>: auth, user, item</li>
                      <li><code>/controllers</code>: auth, user, item</li>
                      <li><code>/models</code>: User, Item schemas</li>
                      <li><code>/middleware</code>: auth, error, validation</li>
                    </ul>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900 p-4 text-xs font-mono text-slate-200">
                  <p className="text-slate-400"># Start Backend Dev Server</p>
                  <p className="text-emerald-400">cd backend && npm install && npm run dev</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <Card
              title="Agent AI Service Setup (FastAPI + LangChain + OpenAI/Claude)"
              subtitle="High-performance async Python AI microservice with Pydantic validation"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  FastAPI AI service initialized and fully ready
                </div>
                <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-700 dark:text-slate-300">
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">AI Engine Highlights</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>FastAPI with lifespan handlers and CORS</li>
                      <li>OpenAI & Claude (Anthropic) SDK service classes</li>
                      <li>LangChain ChatPromptTemplate and LCEL execution</li>
                      <li>Pydantic v2 strict request and response models</li>
                    </ul>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Service Modules</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><code>/app/routers</code>: completion, chat, chain</li>
                      <li><code>/app/services</code>: openai, claude, langchain</li>
                      <li><code>/app/models</code>: request & response schemas</li>
                      <li><code>requirements.txt</code>: pinned, production dependencies</li>
                    </ul>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900 p-4 text-xs font-mono text-slate-200">
                  <p className="text-slate-400"># Start AI Service Server</p>
                  <p className="text-purple-400">cd ai-service && pip install -r requirements.txt && uvicorn app.main:app --reload</p>
                </div>
              </div>
            </Card>
            <DashboardPage />
          </div>
        )}

        {activeTab === 'devops' && (
          <div className="space-y-6">
            <Card
              title="Agent DevOps Setup (Docker + Cloud Deployments)"
              subtitle="Universal deployment infrastructure for local development, CI/CD, and multi-cloud targets"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  DevOps manifests and workflows generated
                </div>
                <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-700 dark:text-slate-300">
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Deployment Configurations</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><code>docker-compose.yml</code>: Frontend + Backend + AI + Mongo</li>
                      <li>Multi-stage production Dockerfiles with security hardening</li>
                      <li><code>.github/workflows/ci-cd.yml</code>: automated test & build</li>
                      <li><code>frontend/vercel.json</code>: Vercel SPA rewrites & security headers</li>
                    </ul>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Cloud Blueprints</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><code>railway.json</code>: Railway multi-service configuration</li>
                      <li><code>render.yaml</code>: Render infrastructure as code blueprint</li>
                      <li><code>.env.example</code>: Unified environment configuration</li>
                    </ul>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-900 p-4 text-xs font-mono text-slate-200">
                  <p className="text-slate-400"># Launch Local Stack</p>
                  <p className="text-amber-400">docker compose up --build</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Antigravity Manager Surface &copy; 2026. All 4 microservices scaffolded.</span>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1"><Code className="h-3.5 w-3.5" /> React 19</span>
            <span className="flex items-center gap-1"><Server className="h-3.5 w-3.5" /> Express</span>
            <span className="flex items-center gap-1"><Brain className="h-3.5 w-3.5" /> FastAPI</span>
            <span className="flex items-center gap-1"><Cloud className="h-3.5 w-3.5" /> Docker</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
