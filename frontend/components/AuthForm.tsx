"use client";

import { FormEvent } from "react";

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (data: FormData) => Promise<void>;
  error?: string | null;
  loading?: boolean;
}

const inputClass =
  "w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent transition placeholder-gray-400 dark:placeholder-gray-600";

export default function AuthForm({ mode, onSubmit, error, loading }: AuthFormProps) {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(new FormData(e.currentTarget));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
      </div>

      {mode === "register" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
          <input id="username" name="username" type="text" required autoComplete="username" className={inputClass} />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
        <input
          id="password" name="password" type="password" required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className={inputClass}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading
          ? mode === "login" ? "Signing in…" : "Creating account…"
          : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
