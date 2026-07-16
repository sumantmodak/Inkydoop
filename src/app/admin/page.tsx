"use client";

import { useState } from "react";
import Link from "next/link";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

type Status =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "done"; id: string; message: string }
  | { kind: "error"; message: string };

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [date, setDate] = useState(todayUtc());
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!key || status.kind === "running") return;
    setStatus({ kind: "running" });
    try {
      const res = await fetch(
        `/api/generate?date=${encodeURIComponent(date)}`,
        { method: "POST", headers: { "x-generate-key": key } },
      );
      const text = await res.text();
      if (res.status === 401) {
        setStatus({ kind: "error", message: "Wrong key." });
        return;
      }
      if (res.status === 429) {
        setStatus({ kind: "error", message: "Rate limited — wait a minute." });
        return;
      }
      if (!res.ok) {
        setStatus({ kind: "error", message: text || `HTTP ${res.status}` });
        return;
      }
      let id = "";
      try {
        id = (JSON.parse(text) as { id?: string }).id ?? "";
      } catch {
        // non-JSON body — leave id empty
      }
      setStatus({ kind: "done", id, message: text });
    } catch (err) {
      setStatus({ kind: "error", message: String(err) });
    }
  }

  const running = status.kind === "running";

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 sm:py-10">
      <Link
        href="/"
        className="font-display inline-flex items-center gap-1 rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-brand shadow-sm transition-transform hover:-translate-x-0.5 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
      >
        ← Back
      </Link>

      <h1 className="font-display mt-5 text-3xl font-bold text-brand sm:text-4xl">
        Generate a story
      </h1>
      <p className="mt-1 text-muted">
        Creates a new daily pack — story, vocabulary, questions, and
        illustrations. Takes a few minutes. Each run makes a new story; it never
        overwrites an existing one.
      </p>

      <form
        onSubmit={generate}
        className="mt-6 flex flex-col gap-4 rounded-3xl border-2 border-surface-border bg-surface p-5 shadow-sm"
      >
        <label className="flex flex-col gap-1">
          <span className="font-display text-sm font-semibold">
            Generate key
          </span>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
            placeholder="GENERATE_API_KEY"
            className="rounded-xl border-2 border-surface-border bg-background px-3 py-2 focus-visible:border-brand focus-visible:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-display text-sm font-semibold">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border-2 border-surface-border bg-background px-3 py-2 focus-visible:border-brand focus-visible:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={running || !key}
          className="font-display rounded-full bg-brand px-6 py-2.5 font-semibold text-white shadow-sm transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:outline-none disabled:opacity-60"
        >
          {running ? "Generating… (a few minutes)" : "Generate"}
        </button>
      </form>

      {status.kind === "running" && (
        <p className="mt-4 text-sm text-muted" aria-live="polite">
          Working… writing the story and painting the illustrations. Keep this
          tab open.
        </p>
      )}
      {status.kind === "done" && (
        <div
          role="status"
          className="mt-4 rounded-2xl border-2 border-mint/40 bg-mint/10 p-4 text-sm"
        >
          <p className="font-display font-bold text-emerald-700">Done! 🎉</p>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-emerald-900 dark:text-emerald-200">
            {status.message}
          </pre>
          <Link
            href={`/story?id=${status.id}`}
            className="font-display mt-3 inline-block rounded-full bg-brand px-4 py-1.5 font-semibold text-white"
          >
            Read it →
          </Link>
        </div>
      )}
      {status.kind === "error" && (
        <div
          role="alert"
          className="mt-4 rounded-2xl border-2 border-coral/40 bg-coral/10 p-4 text-sm text-rose-800 dark:text-rose-200"
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
