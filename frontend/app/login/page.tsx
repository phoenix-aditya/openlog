"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import * as api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      const { access_token } = await api.login(
        data.get("email") as string,
        data.get("password") as string,
      );
      localStorage.setItem("token", access_token);
      window.dispatchEvent(new Event("auth-change"));
      router.push("/drafts");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-57px)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>
        <AuthForm mode="login" onSubmit={handleSubmit} error={error} loading={loading} />
        <p className="text-sm text-gray-500 text-center mt-5">
          No account?{" "}
          <Link href="/register" className="text-gray-900 font-medium hover:underline">Register</Link>
        </p>
      </div>
    </main>
  );
}
