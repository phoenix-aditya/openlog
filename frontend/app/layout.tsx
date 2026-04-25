import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "OpenLog",
  description: "A markdown-based blogging platform",
  icons: {
    icon: "/favicon.png",
  },
};

// Runs before React hydrates — reads cookie and applies dark class instantly (no flash)
const themeScript = `
(function() {
  try {
    var c = document.cookie.match(/theme=([^;]+)/);
    var theme = c ? c[1] : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
