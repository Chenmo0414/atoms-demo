"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Cpu, Trophy, GitFork, Globe, History, Code2, Sparkles, ArrowRight, Star, Rocket, CheckCircle, Target, BarChart3, ShoppingCart, Smartphone } from "lucide-react";
import { useT } from "@/contexts/LangContext";
import { LangToggle } from "@/components/shared/LangToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ModelSelector } from "@/components/workspace/ModelSelector";
import { resolveModel } from "@/lib/models";

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

// Animation hook
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

// Stats data
const stats = [
  { value: "10K+", label: "activeUsers" },
  { value: "50K+", label: "appsGenerated" },
  { value: "99.9%", label: "uptime" },
  { value: "4.9", label: "rating", suffix: "⭐" },
];

// Testimonials data
const testimonials = [
  { name: "Alex Chen", role: "Frontend Developer", content: "testimonial1", avatar: "AC" },
  { name: "Sarah Kim", role: "Product Manager", content: "testimonial2", avatar: "SK" },
  { name: "Mike Johnson", role: "Startup Founder", content: "testimonial3", avatar: "MJ" },
];

// Use cases data
const useCases = [
  { icon: Target, title: "useCaseLanding", desc: "useCaseLandingDesc", color: "text-purple-500" },
  { icon: BarChart3, title: "useCaseDashboard", desc: "useCaseDashboardDesc", color: "text-blue-500" },
  { icon: ShoppingCart, title: "useCaseEcommerce", desc: "useCaseEcommerceDesc", color: "text-green-500" },
  { icon: Smartphone, title: "useCaseMobile", desc: "useCaseMobileDesc", color: "text-orange-500" },
];

export default function LandingPage() {
  const t = useT();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [launching, setLaunching] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => resolveModel().id);
  const [user, setUser] = useState<{ id: string; email: string; name: string | null } | null>(null);

  // Animation refs
  const featuresSection = useInView(0.1);
  const demoSection = useInView(0.1);
  const statsSection = useInView(0.1);
  const useCasesSection = useInView(0.1);
  const testimonialsSection = useInView(0.1);
  const ctaSection = useInView(0.1);

  useEffect(() => {
    let mounted = true;
    const loadMe = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        if (mounted && json?.user) {
          setUser(json.user);
        }
      } catch {
        // ignore
      }
    };
    loadMe();
    return () => { mounted = false; };
  }, []);

  const userLabel = useMemo(() => {
    if (!user) return "";
    return user.name?.trim() || user.email;
  }, [user]);

  const handleLaunchFromPrompt = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || launching) return;

    setLaunching(true);
    try {
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const createRes = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed }),
        });
        const createJson = await createRes.json().catch(() => ({}));
        if (createRes.ok && createJson?.project?.id) {
          router.push(`/project/${createJson.project.id}?prompt=${encodeURIComponent(trimmed)}&model=${encodeURIComponent(selectedModel)}`);
          return;
        }
      }
      router.push(`/register?prompt=${encodeURIComponent(trimmed)}`);
    } finally {
      setLaunching(false);
    }
  };

  const features = [
    { icon: Cpu, title: t.engineerMode, description: t.engineerModeDesc, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800/50" },
    { icon: Trophy, title: t.raceMode, description: t.raceModeDesc, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/50" },
    { icon: History, title: t.versionHistoryFeature, description: t.versionHistoryDesc, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50" },
    { icon: GitFork, title: t.remix, description: t.remixDesc, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50" },
    { icon: Globe, title: t.publish, description: t.publishDesc, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800/50" },
    { icon: Code2, title: t.codeView, description: t.codeViewDesc, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800/50" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white overflow-x-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-100/40 via-transparent to-transparent dark:from-purple-900/20 animate-pulse-slow" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-100/40 via-transparent to-transparent dark:from-blue-900/20 animate-pulse-slow-delayed" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center animate-float">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">Atoms</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LangToggle />
            {user ? (
              <>
                <span className="hidden sm:inline-flex max-w-48 items-center truncate rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200">
                  {userLabel}
                </span>
                <Link href="/dashboard" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-all hover:scale-105">
                  {t.myProjects}
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                  {t.signIn}
                </Link>
                <Link href="/register" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-all hover:scale-105">
                  {t.getStartedFree}
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700/40 rounded-full text-sm text-purple-700 dark:text-purple-300 mb-6 animate-fade-in-up">
          <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
          {t.badge}
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in-up animation-delay-100">
          {t.heroTitle}{" "}
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
            {t.heroTitleHighlight}
          </span>
        </h1>

        <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-10 animate-fade-in-up animation-delay-200">
          {t.heroDesc}
        </p>

        <div className="max-w-3xl mx-auto mb-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3 sm:p-4 animate-fade-in-up animation-delay-300 shadow-xl shadow-purple-500/5">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleLaunchFromPrompt();
              }
            }}
            rows={2}
            placeholder={t.homepagePromptPlaceholder}
            className="w-full resize-none rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 mb-2 transition-all"
          />
          <div className="flex items-center justify-between gap-2">
            <ModelSelector value={selectedModel} onChange={setSelectedModel} disabled={launching} />
            <button
              onClick={handleLaunchFromPrompt}
              disabled={!prompt.trim() || launching}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-sm font-medium transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
            >
              {launching ? t.launchingBuilder : t.buildFromPrompt}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center animate-fade-in-up animation-delay-400">
          {user ? (
            <>
              <div className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold rounded-xl text-lg">
                {userLabel}
              </div>
              <Link href="/dashboard" className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25">
                {t.myProjects}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </>
          ) : (
            <>
              <Link href="/register" className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25">
                {t.startBuildingFree}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/40 hover:border-zinc-400 text-zinc-800 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-semibold rounded-xl text-lg transition-all hover:scale-105">
                {t.signIn}
              </Link>
            </>
          )}
        </div>
      </section>


      {/* Demo preview */}
      <section ref={demoSection.ref} className={`max-w-5xl mx-auto px-6 py-20 transition-all duration-1000 ${demoSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="relative rounded-2xl overflow-hidden border border-zinc-700/50 shadow-2xl shadow-purple-900/20 hover:shadow-purple-500/10 transition-shadow duration-500">
          <div className="flex items-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/70 hover:bg-red-500 transition-colors cursor-pointer" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70 hover:bg-yellow-500 transition-colors cursor-pointer" />
              <div className="w-3 h-3 rounded-full bg-green-500/70 hover:bg-green-500 transition-colors cursor-pointer" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-2 px-4 py-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-xs text-zinc-600 dark:text-zinc-500">
                <Zap className="w-3 h-3 text-purple-400" />
                atoms-demo.vercel.app/project/demo
              </div>
            </div>
          </div>
          <div className="flex h-80 bg-zinc-100 dark:bg-zinc-950">
            <div className="w-2/5 border-r border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-3">
              <div className="flex gap-2 justify-end">
                <div className="bg-purple-600 rounded-xl px-3 py-2 text-xs text-white max-w-[80%]">
                  {t.demoBuild}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                  <Zap className="w-2.5 h-2.5 text-purple-400" />
                </div>
                <div className="bg-zinc-200 dark:bg-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400 italic max-w-[80%]">
                  {t.demoGenerated}
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-auto">
                <div className="bg-purple-600/80 rounded-xl px-3 py-2 text-xs text-white/80 max-w-[80%]">
                  {t.demoIterate}
                </div>
              </div>
            </div>
            <div className="flex-1 pointer-events-none">
              <iframe srcDoc={demoHtml} sandbox="" className="w-full h-full border-0" title="demo" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresSection.ref} className={`max-w-6xl mx-auto px-6 pb-20 transition-all duration-1000 ${featuresSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="text-3xl font-bold text-center mb-12">{t.featuresTitle}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className={`p-5 rounded-xl border ${f.bg} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/5`} style={{ transitionDelay: `${i * 50}ms` }}>
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-3">
                  <Icon className={`w-4 h-4 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-1.5">{f.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Use Cases */}
      <section ref={useCasesSection.ref} className={`py-20 border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 transition-all duration-1000 ${useCasesSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">{t.useCasesTitle}</h2>
          <p className="text-center text-zinc-500 dark:text-zinc-400 mb-12 max-w-2xl mx-auto">{t.useCasesDesc}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((uc, i) => {
              const titleKey = uc.title as keyof typeof t;
              const descKey = uc.desc as keyof typeof t;
              const title = typeof t[titleKey] === 'string' ? t[titleKey] : titleKey;
              const desc = typeof t[descKey] === 'string' ? t[descKey] : descKey;
              const Icon = uc.icon;
              return (
                <div key={i} className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                    <Icon className={`w-5 h-5 ${uc.color}`} />
                  </div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section ref={testimonialsSection.ref} className={`max-w-6xl mx-auto px-6 py-20 transition-all duration-1000 ${testimonialsSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="text-3xl font-bold text-center mb-12">{t.whatUsersSay}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => {
            const contentKey = testimonial.content as keyof typeof t;
            const content = typeof t[contentKey] === 'string' ? t[contentKey] : contentKey;
            return (
              <div key={i} className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-lg transition-all duration-300" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-zinc-500">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
                  &ldquo;{content}&rdquo;
                </p>
                <div className="flex gap-0.5 mt-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">{t.howItWorks}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: Sparkles, title: t.step1Title, desc: t.step1Desc },
              { step: "02", icon: Rocket, title: t.step2Title, desc: t.step2Desc },
              { step: "03", icon: CheckCircle, title: t.step3Title, desc: t.step3Desc },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-4">
                  <item.icon className="w-8 h-8" />
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 text-6xl font-bold text-zinc-100 dark:text-zinc-800 -z-10">
                  {item.step}
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaSection.ref} className={`py-20 text-center transition-all duration-1000 ${ctaSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="text-3xl font-bold mb-4">{t.ctaTitle}</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">{t.ctaDesc}</p>
        <Link href={user ? "/dashboard" : "/register"} className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-lg transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25">
          {user ? t.myProjects : t.startFree} <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 px-6 text-center text-sm text-zinc-500 dark:text-zinc-600">
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center">
            <Zap className="w-2.5 h-2.5 text-white" />
          </div>
          <span>{t.footer}</span>
        </div>
      </footer>

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.6; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-gradient { background-size: 200% 200%; animation: gradient 4s ease infinite; }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
        .animate-pulse-slow-delayed { animation: pulse-slow 6s ease-in-out 2s infinite; }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
        .animation-delay-100 { animation-delay: 100ms; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-300 { animation-delay: 300ms; }
        .animation-delay-400 { animation-delay: 400ms; }
      `}</style>
    </div>
  );
}