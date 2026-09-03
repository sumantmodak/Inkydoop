"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "inkydoop:favorites";

interface StoredFavorites {
  version: 1;
  packIds: string[];
}

function readFavorites(): StoredFavorites {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (
      parsed?.version === 1 &&
      Array.isArray(parsed.packIds) &&
      parsed.packIds.every((id: unknown) => typeof id === "string")
    ) {
      return { version: 1, packIds: parsed.packIds.slice(0, 100) };
    }
  } catch {
    // Treat unavailable or malformed device storage as empty.
  }
  return { version: 1, packIds: [] };
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("inkydoop:favorites", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("inkydoop:favorites", callback);
  };
}

export function SaveStoryButton({ packId }: { packId: string }) {
  const saved = useSyncExternalStore(
    subscribe,
    () => readFavorites().packIds.includes(packId),
    () => false,
  );

  function toggle() {
    const favorites = readFavorites();
    const next = favorites.packIds.includes(packId)
      ? favorites.packIds.filter((id) => id !== packId)
      : [packId, ...favorites.packIds].slice(0, 100);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, packIds: next }),
      );
      window.dispatchEvent(new Event("inkydoop:favorites"));
    } catch {
      // Saving is optional; reading remains available when storage is blocked.
    }
  }

  const label = saved ? "Remove saved story" : "Save story";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className="group relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white/60 bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/45 focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
      </svg>
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/85 px-2 py-1 text-xs group-hover:block group-focus-visible:block">
        {label}
      </span>
    </button>
  );
}