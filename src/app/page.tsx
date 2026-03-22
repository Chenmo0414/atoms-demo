import Link from "next/link";
import { Zap, Cpu, Trophy, GitFork, Globe, History, Code2, Sparkles, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "Engineer Mode",
    description: "AI agents break down your request, write code, and iterate until your app is perfect.",
    color: "text-purple-400",
    bg: "bg-purple-900/20 border-purple-800/50",
  },
  {
    icon: Trophy,
    title: "Race Mode",
    description: "Two agents compete simultaneously with different approaches. You pick the winner.",
    color: "text-yellow-400",
    bg: "bg-yellow-900/20 border-yellow-800/50",
  },
  {
    icon: History,
    title: "Version History",
    description: "Every generation is saved. Browse your history and restore any previous version instantly.",
    color: "text-blue-400",
    bg: "bg-blue-900/20 border-blue-800/50",
  },
  {
    icon: GitFork,
    title: "Remix",
    description: "Fork any app and start iterating from a working foundation instead of scratch.",
    color: "text-green-400",
    bg: "bg-green-900/20 border-green-800/50",
  },
  {
    icon: Globe,
    title: "Publish",
    description: "Share your app with the world via a permanent public link in one click.",
    color: "text-cyan-400",
    bg: "bg-cyan-900/20 border-cyan-800/50",
  },
  {
    icon: Code2,
    title: "Code View",
    description: "Inspect, copy, or download the generated HTML/CSS/JS with syntax highlighting.",
    color: "text-orange-400",
    bg: "bg-orange-900/20 border-orange-800/50",
  },
];

const demoHtml = `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0f0f0f; color: white; font-family: system-ui, sans-serif; padding: 20px; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 16px; background: linear-gradient(135deg, #a855f7, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .card { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 16px; width: 100%; max-width: 320px; }
  input { width: 100%; background: #262626; border: 1px solid #404040; border-radius: 8px; padding: 8px 12px; color: white; font-size: 14px; margin-bottom: 8px; }
  input:focus { outline: none; border-color: #a855f7; }
  button { width: 100%; background: #a855f7; border: none; border-radius: 8px; padding: 9px; color: white; font-weight: 600; cursor: pointer; font-size: 14px; }
  button:hover { background: #9333ea; }
  ul { list-style: none; margin-top: 12px; }
  li { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #262626; font-size: 13px; color: #d4d4d4; }
  li:last-child { border: none; }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: #a855f7; }
</style>
</head>
<body>
<h1>✨ Todo App</h1>
<div class="card">
  <input id="inp" placeholder="Add a task..." />
  <button onclick="add()">Add Task</button>
  <ul id="list">
    <li><span class="dot"></span>Design landing page</li>
    <li><span class="dot"></span>Write API routes</li>
    <li><span class="dot"></span>Deploy to Vercel</li>
  </ul>
</div>
<script>
function add() {
  const v = document.getElementById('inp').value.trim();
  if (!v) return;
  const li = document.createElement('li');
  li.innerHTML = '<span class="dot"></span>' + v;
  document.getElementById('list').appendChild(li);
  document.getElementById('inp').value = '';
}
document.getElementById('inp').addEventListener('keydown', e => e.key === 'Enter' && add());
</script>
</body>
</html>`;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-800/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">Atoms</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-sm font-medium rounded-lg transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-900/30 border border-purple-700/40 rounded-full text-sm text-purple-300 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          AI agent-powered app generation
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
          Build Your Ideas{" "}
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            with Agents
          </span>
        </h1>

        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
          Describe what you want to build. Atoms AI agents write the code, generate
          your app, and let you preview it live — all in seconds.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/register"
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 font-semibold rounded-xl text-lg transition-colors"
          >
            Start building for free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold rounded-xl text-lg transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Demo preview */}
      <section className="max-w-5xl mx-auto px-6 mb-20">
        <div className="relative rounded-2xl overflow-hidden border border-zinc-700/50 shadow-2xl shadow-purple-900/20">
          {/* Fake toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-2 px-4 py-1 bg-zinc-800 rounded-lg text-xs text-zinc-500">
                <Zap className="w-3 h-3 text-purple-400" />
                atoms-demo.vercel.app/project/demo
              </div>
            </div>
          </div>
          {/* Split pane preview */}
          <div className="flex h-80 bg-zinc-950">
            {/* Chat side */}
            <div className="w-2/5 border-r border-zinc-800 p-4 flex flex-col gap-3">
              <div className="flex gap-2 justify-end">
                <div className="bg-purple-600 rounded-xl px-3 py-2 text-xs text-white max-w-[80%]">
                  Build a todo app with dark mode
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                  <Zap className="w-2.5 h-2.5 text-purple-400" />
                </div>
                <div className="bg-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-400 italic max-w-[80%]">
                  ✓ App generated — see preview
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-auto">
                <div className="bg-purple-600/80 rounded-xl px-3 py-2 text-xs text-white/80 max-w-[80%]">
                  make the button red
                </div>
              </div>
            </div>
            {/* Preview side */}
            <div className="flex-1 pointer-events-none">
              <iframe
                srcDoc={demoHtml}
                sandbox=""
                className="w-full h-full border-0"
                title="demo"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need to build faster
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`p-5 rounded-xl border ${f.bg} transition-transform hover:-translate-y-0.5`}
              >
                <div className={`w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-white mb-1.5">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-800 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to build?</h2>
        <p className="text-zinc-400 mb-8">
          Join thousands of builders creating apps with AI agents.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 font-semibold rounded-xl text-lg transition-colors"
        >
          Start for free <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-6 text-center text-sm text-zinc-600">
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center">
            <Zap className="w-2.5 h-2.5 text-white" />
          </div>
          <span>Atoms Demo — Built with Claude AI</span>
        </div>
      </footer>
    </div>
  );
}
