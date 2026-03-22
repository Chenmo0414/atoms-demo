"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Zap, GitFork } from "lucide-react";
import { useT } from "@/contexts/LangContext";
import { LangToggle } from "@/components/shared/LangToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

type FormData = { name?: string; email: string; password: string };

function RegisterForm() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const remixSlug = searchParams.get("remix");
  const prompt = searchParams.get("prompt")?.trim() || "";
  const [loading, setLoading] = useState(false);

  const schema = z.object({
    name: z.string().optional(),
    email: z.string().email(t.invalidEmail),
    password: z.string().min(8, t.passwordMin),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, remixSlug }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ? t.apiError(json.error) : t.registrationFailed);
        return;
      }
      toast.success(t.accountCreated);
      if (json.remixProjectId) {
        router.push(`/project/${json.remixProjectId}`);
      } else if (prompt) {
        const createRes = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const createJson = await createRes.json().catch(() => ({}));
        if (createRes.ok && createJson?.project?.id) {
          router.push(`/project/${createJson.project.id}?prompt=${encodeURIComponent(prompt)}`);
          return;
        }
        router.push("/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch {
      toast.error(t.somethingWentWrong);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-end gap-2 mb-2">
            <ThemeToggle />
            <LangToggle />
          </div>
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-white">Atoms</span>
          </Link>
          {remixSlug ? (
            <>
              <div className="flex items-center justify-center gap-2 text-sm text-purple-300 mb-2">
                <GitFork className="w-4 h-4" />
                {t.aboutToRemix}
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t.createAccount}</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">{t.signUpToRemix}</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t.createAccount}</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">{t.startBuilding}</p>
            </>
          )}
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                {t.nameOptional}
              </label>
              <input
                {...register("name")}
                type="text"
                placeholder={t.namePlaceholder}
                className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                {t.email}
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder={t.emailPlaceholder}
                className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              {errors.email && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                {t.password}
              </label>
              <input
                {...register("password")}
                type="password"
                placeholder={t.atLeast8Chars}
                className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              {errors.password && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {loading
                ? t.creatingAccount
                : remixSlug
                ? t.createAccountRemix
                : t.createAccountBtn}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-500 mt-4 text-sm">
          {t.alreadyHaveAccount}{" "}
          <Link href="/login" className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300">
            {t.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-zinc-950" />}>
      <RegisterForm />
    </Suspense>
  );
}
