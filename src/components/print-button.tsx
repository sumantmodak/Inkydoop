"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="font-display rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:outline-none"
    >
      Print / Save as PDF
    </button>
  );
}
