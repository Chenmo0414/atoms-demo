"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { Zap, ArrowLeft, User, Lock } from "lucide-react";
import { useT } from "@/contexts/LangContext";
import { LangToggle } from "@/components/shared/LangToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type NameFormData = { name: string };
type PasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function SettingsPage() {
  const t = useT();
  const router = useRouter();
  const { data, mutate } = useSWR<{ user: { id: string; email: string; name: string | null } }>(
    "/api/user",
    fetcher
  );

  const [nameLoading, setNameLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const user = data?.user;

  // Name form
  const nameSchema = z.object({
    name: z.string().trim().min(1).max(50),
  });

  const {
    register: registerName,
    handleSubmit: handleSubmitName,
    formState: { errors: nameErrors },
    reset: resetName,
  } = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: "" },
  });

  // Password form
  const passwordSchema = z
    .object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t.passwordMismatch,
      path: ["confirmPassword"],
    });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Update name when user data loads
  useEffect(() => {
    if (user) {
      resetName({ name: user.name || "" });
    }
  }, [user, resetName]);

  const onNameSubmit = async (formData: NameFormData) => {
    setNameLoading(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      mutate();
      toast.success(t.nameChanged);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.somethingWentWrong);
    } finally {
      setNameLoading(false);
    }
  };

  const onPasswordSubmit = async (formData: PasswordFormData) => {
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      resetPassword();
      toast.success(t.passwordChanged);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.somethingWentWrong);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-zinc-900 dark:text-white">Atoms</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LangToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToDashboard}
        </Link>

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">
          {t.accountSettings}
        </h1>

        {!data ? (
          <div className="animate-pulse space-y-6">
            <div className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
            <div className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Info */}
            <section className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                {t.accountInfo}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                    {t.email}
                  </label>
                  <div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-500 dark:text-zinc-400">
                    {user?.email}
                  </div>
                </div>

                <form onSubmit={handleSubmitName(onNameSubmit)}>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                    {t.changeName}
                  </label>
                  <div className="flex gap-2">
                    <input
                      {...registerName("name")}
                      type="text"
                      placeholder={t.namePlaceholder}
                      className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={nameLoading}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {nameLoading ? t.saving : t.save}
                    </button>
                  </div>
                  {nameErrors.name && (
                    <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                      {nameErrors.name.message}
                    </p>
                  )}
                </form>
              </div>
            </section>

            {/* Change Password */}
            <section className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                {t.changePassword}
              </h2>

              <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                    {t.currentPassword}
                  </label>
                  <input
                    {...registerPassword("currentPassword")}
                    type="password"
                    placeholder={t.currentPasswordPlaceholder}
                    className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                    {t.newPassword}
                  </label>
                  <input
                    {...registerPassword("newPassword")}
                    type="password"
                    placeholder={t.newPasswordPlaceholder}
                    className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                    {t.confirmPassword}
                  </label>
                  <input
                    {...registerPassword("confirmPassword")}
                    type="password"
                    placeholder={t.confirmPasswordPlaceholder}
                    className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                >
                  {passwordLoading ? t.saving : t.changePassword}
                </button>
              </form>
            </section>

            {/* Sign Out */}
            <section className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg transition-colors"
              >
                {t.signOut}
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}