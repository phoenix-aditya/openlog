"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import * as api from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);

    const token = localStorage.getItem("token");
    if (!token) return;
    api.getMe()
      .then((me) => router.replace(`/${me.username}`))
      .catch(() => localStorage.removeItem("token"));
  }, [router]);

  return (
    <main className="max-w-2xl mx-auto px-6 py-28 text-center">
      <Image
        src={mounted && dark ? "/logo_white.png" : "/logo.png"}
        alt="OpenLog"
        width={320}
        height={100}
        className="mx-auto mb-8 w-80 h-auto"
        priority
      />
      <p className="text-xl text-gray-500 mb-10">
        Write and publish markdown blog posts. Simple, fast, yours.
      </p>
      <div className="flex justify-center gap-3">
        <Link
          href="/register"
          className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
