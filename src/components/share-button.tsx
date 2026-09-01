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
      className="font-display inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-white/60 bg-black/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/35 focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
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
      {copied ? "Link copied" : "Share"}
    </button>
  );
}