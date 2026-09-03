"use client";

import { useRouter } from "next/navigation";

interface SurpriseStoryButtonProps {
  currentId: string;
  storyIds: string[];
}

export function SurpriseStoryButton({
  currentId,
  storyIds,
}: SurpriseStoryButtonProps) {
  const router = useRouter();

  function surprise() {
    const alternatives = storyIds.filter((id) => id !== currentId);
    const choices = alternatives.length > 0 ? alternatives : storyIds;
    if (choices.length === 0) return;

    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    const storyId = choices[values[0] % choices.length];
    router.push(`/story?id=${encodeURIComponent(storyId)}`);
  }

  return (
    <button
      type="button"
      onClick={surprise}
      disabled={storyIds.length === 0}
      className="font-display inline-flex min-h-12 items-center gap-2 rounded-full bg-coral px-6 py-2.5 font-bold text-white shadow-md transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-coral/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
        <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
      </svg>
      Surprise me
    </button>
  );
}
