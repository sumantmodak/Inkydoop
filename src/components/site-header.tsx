import Link from "next/link";
import { Mascot } from "@/components/mascot";
import { ThemeToggle } from "@/components/theme-toggle";
import { TierSelect } from "@/components/tier-select";
import { getTierCookie } from "@/lib/tier-cookie";

export async function SiteHeader() {
  const tier = await getTierCookie();

  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-6 sm:pt-8 print:hidden">
      <div className="flex w-full items-center justify-between sm:w-auto">
        <Link
          href="/"
          aria-label="Inkydoop home"
          className="group flex items-center gap-2 rounded-md focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none sm:gap-3"
        >
          <Mascot className="animate-bob h-12 w-12 sm:h-16 sm:w-16" />
          <span>
            <span className="font-display block text-2xl leading-none font-bold text-brand sm:text-4xl">
              Inkydoop
            </span>
            <span className="font-display mt-1 block text-[0.68rem] leading-tight font-medium text-muted group-hover:text-brand sm:text-sm">
              Stories to read, hear, and grow with.
            </span>
          </span>
        </Link>
        <div className="sm:hidden">
          <ThemeToggle />
        </div>
      </div>
      <nav
        aria-label="Main navigation"
        className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end"
      >
        <TierSelect current={tier} />
        <Link
          href="/library"
          className="font-display rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-brand shadow-sm transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
        >
          Library
        </Link>
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
