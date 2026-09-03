"use client";

import { useState } from "react";

interface ShareButtonProps {
  path: string;
  title: string;
}

export function ShareButton({ path, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? "Story link copied" : "Share story"}
      title={copied ? "Link copied" : "Share story"}
      className="group relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white/60 bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/45 focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
      </svg>
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/85 px-2 py-1 text-xs group-hover:block group-focus-visible:block">
        {copied ? "Link copied" : "Share story"}
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Story link copied" : ""}
      </span>
    </button>
  );
}