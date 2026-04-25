"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";

function setThemeCookie(theme: "dark" | "light") {
  document.cookie = `theme=${theme};path=/;max-age=31536000;SameSite=Lax`;
}

export default function Navbar() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  // Prevent rendering auth-dependent UI until client has hydrated
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read theme from the <html> class (already set by the inline script, no flash)
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);

    function syncAuth() {
      const token = localStorage.getItem("token");
      if (!token) { setUsername(null); return; }
      api.getMe()
        .then((me) => setUsername(me.username))
        .catch(() => { localStorage.removeItem("token"); setUsername(null); });
    }

    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth-change", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth-change", syncAuth);
    };
  }, []);

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    setDark(!dark);
    setThemeCookie(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setUsername(null);
    router.push("/");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 flex items-stretch justify-between bg-white dark:bg-gray-950">
      {/* Logo — fills full navbar height with no padding */}
      <a href={username ? `/${username}` : "/"} className="flex items-center">
        <Image
          src={mounted && dark ? "/logo_white.png" : "/logo.png"}
          alt="OpenLog"
          width={260}
          height={72}
          className="h-20 w-auto object-contain"
          priority
        />
      </a>

      {/* Nav links — hidden until mounted to prevent hydration flash */}
      <div className={`flex items-center gap-5 px-8 transition-opacity duration-150 ${mounted ? "opacity-100" : "opacity-0"}`}>
        {username ? (
          <>
            <Link href="/editor" className="text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors">
              Write
            </Link>
            <Link href="/drafts" className="text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors">
              Drafts
            </Link>
            <Link href={`/${username}`} className="text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors">
              {username}
            </Link>
            <button
              onClick={handleLogout}
              className="text-base text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-base px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 font-medium transition-colors"
            >
              Get started
            </Link>
          </>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
