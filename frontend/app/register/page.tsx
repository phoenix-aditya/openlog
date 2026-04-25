"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import * as api from "@/lib/api";

function getErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Registration failed. Please try again.";
  const status = (err as Error & { status?: number }).status;
  if (status === 409) return err.message ?? "Email or username is already taken.";
  if (status === 400) return err.message ?? "Password must be at least 8 characters.";
  return err.message ?? "Registration failed. Please try again.";
}

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    try {
      const { access_token } = await api.register(
        data.get("email") as string,
        data.get("username") as string,
        data.get("password") as string,
      );
      localStorage.setItem("token", access_token);
      window.dispatchEvent(new Event("auth-change"));
      router.push("/drafts");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-57px)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1">Create an account</h1>
        <p className="text-sm text-gray-500 mb-6">Start writing and publishing today</p>
        <AuthForm mode="register" onSubmit={handleSubmit} error={error} loading={loading} />
        <p className="text-sm text-gray-500 text-center mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-gray-900 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
