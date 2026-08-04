import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "../globals.css";

/**
 * The operator's panel lives outside the public site in every sense.
 *
 * It renders its own <html> and <body> because this app has no root layout:
 * every public page hangs off src/app/[locale]/layout.tsx, which IS the root
 * for that subtree. A page under /admin has nothing above it, so the document
 * shell has to start here.
 *
 * Nothing from the public chrome is mounted — no Header, Footer, FaqPanel,
 * LogoIntro splash, SeasonDetector, SnowParticles, Lenis smooth scroll or
 * analytics. Every one of those is a liability in a tool: the splash would
 * cover the login form on every visit, Lenis would fight a long form's native
 * scrolling, and there is no reason to send a page view to Yandex Metrica when
 * the operator edits a price.
 *
 * /admin is also excluded from the locale proxy (src/proxy.ts) and disallowed
 * in robots.ts.
 */

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Панель управления · CHIMGAN DARBAZA",
  // Belt and braces with robots.ts: a Disallow keeps a crawler from fetching
  // the page, this keeps it out of the index if it reaches it another way.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Every admin page reads the session cookie, so none of them can be
 * prerendered. Declaring it here means a new page under /admin cannot forget.
 */
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={sans.variable}>
      <body className="admin-root min-h-screen bg-[var(--surface)] font-sans text-[var(--ink)] antialiased">
        {children}
      </body>
    </html>
  );
}
