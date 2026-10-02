import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Send, CheckCircle, Database, ShieldAlert, Cpu } from 'lucide-react';

export function DashboardPage() {
  const [prompt, setPrompt] = useState('Analyze system latency and optimize caching strategy');
  const [provider, setProvider] = useState<'openai' | 'claude'>('openai');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendPrompt = async () => {
    setIsLoading(true);
    setResponse(null);
    try {
      const endpoint =
        provider === 'openai' ? '/ai/completion/openai' : '/ai/completion/claude';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, max_tokens: 300 }),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setResponse(data.content || JSON.stringify(data, null, 2));
    } catch {
      // Simulate response when offline
      setTimeout(() => {
        setResponse(
          `[Simulated response from ${provider.toUpperCase()}]\n` +
            `Received Prompt: "${prompt}"\n\n` +
            `Analysis:\n1. Implement Redis multi-tier caching at the gateway layer.\n` +
            `2. Optimize MongoDB index cardinality on user queries.\n` +
            `3. Enable HTTP connection keep-alive in FastAPI & Express.`
        );
        setIsLoading(false);
      }, 500);
      return;
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Agent Control Dashboard
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Interactive workbench to test backend queries, JWT claims, and LLM completions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card
          title="MongoDB State"
          subtitle="Database connectivity"
          className="md:col-span-1"
        >
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Status</span>
              <span className="flex items-center gap-1 font-medium text-emerald-600">
                <CheckCircle className="h-4 w-4" /> Ready
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Connection</span>
              <span className="font-mono text-xs">mongodb://mongo:27017</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Collections</span>
              <span className="font-mono text-xs">users, items</span>
            </div>
            <div className="pt-2">
              <Button size="sm" variant="outline" className="w-full" leftIcon={<Database className="h-4 w-4" />}>
                Sync Schema
              </Button>
            </div>
          </div>
        </Card>

        <Card
          title="JWT Auth Gate"
          subtitle="Bearer Token Validation"
          className="md:col-span-1"
        >
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Algorithm</span>
              <span className="font-mono text-xs font-semibold">HS256</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Expiration</span>
              <span className="font-mono text-xs">7d default</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Role Check</span>
              <span className="font-mono text-xs">Admin / User</span>
            </div>
            <div className="pt-2">
              <Button size="sm" variant="outline" className="w-full" leftIcon={<ShieldAlert className="h-4 w-4" />}>
                Test Token Guard
              </Button>
            </div>
          </div>
        </Card>

        <Card
          title="AI Orchestration"
          subtitle="OpenAI / Claude / LangChain"
          className="md:col-span-1"
        >
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">FastAPI</span>
              <span className="text-emerald-600 font-medium">Asynchronous</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Framework</span>
              <span className="font-mono text-xs">LangChain Core</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Parsers</span>
              <span className="font-mono text-xs">Pydantic v2</span>
            </div>
            <div className="pt-2">
              <Button size="sm" variant="outline" className="w-full" leftIcon={<Cpu className="h-4 w-4" />}>
                Inspect Chains
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Interactive LLM Prompt Console */}
      <Card
        title="Live LLM Interaction Console"
        subtitle="Dispatch requests through the FastAPI AI service skeleton"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-slate-500">Provider:</span>
            <button
              onClick={() => setProvider('openai')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                provider === 'openai'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              OpenAI (GPT-4o)
            </button>
            <button
              onClick={() => setProvider('claude')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                provider === 'claude'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Anthropic (Claude 3.5 Sonnet)
            </button>
          </div>

          <div>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your AI prompt..."
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSendPrompt}
              isLoading={isLoading}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Generate AI Output
            </Button>
          </div>

          {response && (
            <div className="mt-4 rounded-lg bg-slate-900 p-4 text-xs font-mono text-slate-200">
              <div className="mb-2 text-indigo-400 font-semibold text-xs border-b border-slate-800 pb-1">
                Prompt Result
              </div>
              <pre className="whitespace-pre-wrap">{response}</pre>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
