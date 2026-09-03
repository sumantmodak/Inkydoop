"use client";

import { useState } from "react";
import Link from "next/link";
import { TIER_IDS, type TierId } from "@/lib/schemas";
import { TIERS } from "@/lib/gen/tiers";
import { ModerationPanel } from "@/components/moderation-panel";
import {
  GENERATION_PRESETS,
  IMAGE_MODELS,
  LEARNING_MODELS,
  STORY_MODELS,
  type GenerationModels,
  type GenerationPresetId,
} from "@/lib/generation-models";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

type Status =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "done"; id: string }
  | { kind: "error"; message: string };

type PresetSelection = "environment" | GenerationPresetId | "custom";

const PRESET_OPTIONS: { value: PresetSelection; label: string }[] = [
  { value: "environment", label: "Environment defaults" },
  ...Object.entries(GENERATION_PRESETS).map(([value, preset]) => ({
    value: value as GenerationPresetId,
    label: preset.label,
  })),
  { value: "custom", label: "Custom" },
];

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [date, setDate] = useState(todayUtc());
  const [tier, setTier] = useState<TierId>("growing");
  const [preset, setPreset] = useState<PresetSelection>("environment");
  const [models, setModels] = useState<GenerationModels>({
    ...GENERATION_PRESETS.balanced.models,
  });
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function selectPreset(nextPreset: PresetSelection) {
    setPreset(nextPreset);
    if (nextPreset !== "environment" && nextPreset !== "custom") {
      setModels({ ...GENERATION_PRESETS[nextPreset].models });
    }
  }

  function reuseModels(
    selectedModels: GenerationModels,
    selectedTier: TierId,
    selectedDate: string,
  ) {
    setModels({ ...selectedModels });
    setPreset("custom");
    setTier(selectedTier);
    setDate(selectedDate);
    setStatus({ kind: "idle" });
    document.getElementById("generation-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!key || status.kind === "running") return;
    setStatus({ kind: "running" });
    try {
      const selectedModels =
        preset === "environment"
          ? undefined
          : preset === "custom"
            ? models
            : GENERATION_PRESETS[preset].models;
      const res = await fetch(
        `/api/generate?date=${encodeURIComponent(date)}&tier=${tier}`,
        {
          method: "POST",
          headers: {
            "x-generate-key": key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            selectedModels ? { models: selectedModels } : {},
          ),
        },
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
      setStatus({ kind: "done", id });
    } catch (err) {
      setStatus({ kind: "error", message: String(err) });
    }
  }

  const running = status.kind === "running";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="font-display inline-flex items-center gap-1 rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-brand shadow-sm transition-transform hover:-translate-x-0.5 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
      >
        ← Back
      </Link>

      <div className="max-w-lg">
        <h1 className="font-display mt-5 text-3xl font-bold text-brand sm:text-4xl">
          Story operations
        </h1>
        <p className="mt-1 text-muted">
          Generate private story packs, then review and approve them before they
          appear to readers.
        </p>

        <form
          id="generation-form"
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
            <span className="font-display text-sm font-semibold">
              Model preset
            </span>
            <select
              value={preset}
              onChange={(event) =>
                selectPreset(event.target.value as PresetSelection)
              }
              className="rounded-xl border-2 border-surface-border bg-background px-3 py-2 focus-visible:border-brand focus-visible:outline-none"
            >
              {PRESET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {preset === "environment" ? (
            <p className="rounded-xl bg-background p-3 text-sm text-muted">
              Uses the three server environment model settings.
            </p>
          ) : preset === "custom" ? (
            <div className="space-y-3 border-t-2 border-surface-border pt-4">
              <ModelSelect
                label="Story model"
                value={models.story}
                options={STORY_MODELS}
                onChange={(story) => setModels((current) => ({ ...current, story }))}
              />
              <ModelSelect
                label="Learning model"
                value={models.learning}
                options={LEARNING_MODELS}
                onChange={(learning) =>
                  setModels((current) => ({ ...current, learning }))
                }
              />
              <ModelSelect
                label="Image model"
                value={models.image}
                options={IMAGE_MODELS}
                onChange={(image) => setModels((current) => ({ ...current, image }))}
              />
            </div>
          ) : (
            <p className="rounded-xl bg-background p-3 text-sm text-muted">
              {GENERATION_PRESETS[preset].description}
              <span className="mt-1 block text-xs">
                Story: {GENERATION_PRESETS[preset].models.story} · Learning:{" "}
                {GENERATION_PRESETS[preset].models.learning} · Image:{" "}
                {GENERATION_PRESETS[preset].models.image}
              </span>
            </p>
          )}

          <label className="flex flex-col gap-1">
            <span className="font-display text-sm font-semibold">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border-2 border-surface-border bg-background px-3 py-2 focus-visible:border-brand focus-visible:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-display text-sm font-semibold">
              Reading tier
            </span>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as TierId)}
              className="rounded-xl border-2 border-surface-border bg-background px-3 py-2 focus-visible:border-brand focus-visible:outline-none"
            >
              {TIER_IDS.map((t) => (
                <option key={t} value={t}>
                  {TIERS[t].label} — grades {TIERS[t].grades}
                </option>
              ))}
            </select>
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
            <p className="font-display font-bold text-emerald-700">
              Generated and pending review
            </p>
            <p className="mt-1 text-emerald-900 dark:text-emerald-200">
              Pack {status.id} is private. Load the Pending queue below to
              review it.
            </p>
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

      <ModerationPanel
        adminKey={key}
        requestedId={status.kind === "done" ? status.id : undefined}
        onReuseModels={reuseModels}
      />
    </div>
  );
}

interface ModelOption<T extends string> {
  id: T;
  label: string;
  profile: string;
  cost: string;
}

function ModelSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly ModelOption<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-display text-sm font-semibold">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="rounded-xl border-2 border-surface-border bg-background px-3 py-2 focus-visible:border-brand focus-visible:outline-none"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label} — {option.profile} — {option.cost}
          </option>
        ))}
      </select>
    </label>
  );
}
