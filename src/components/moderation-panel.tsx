"use client";

import { useEffect, useState } from "react";
import { ModerationImage } from "@/components/moderation-image";
import { GenerationMetadata } from "@/components/generation-metadata";
import type {
  DailyPack,
  ModerationStatus,
  ModerationSummary,
} from "@/lib/schemas";
import {
  areGenerationModelsAllowed,
  type GenerationModels,
} from "@/lib/generation-models";

interface ReviewItem {
  id: string;
  date: string;
  pack: DailyPack;
  moderation: {
    status: ModerationStatus;
    createdAt: string;
    moderatedAt?: string;
    note?: string;
  };
}

interface ModerationPanelProps {
  adminKey: string;
  requestedId?: string;
  onReuseModels?: (
    models: GenerationModels,
    tier: DailyPack["tier"],
    date: string,
  ) => void;
}

const STATUSES: { value: ModerationStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function ModerationPanel({
  adminKey,
  requestedId,
  onReuseModels,
}: ModerationPanelProps) {
  const [status, setStatus] = useState<ModerationStatus>("pending");
  const [items, setItems] = useState<ModerationSummary[]>([]);
  const [selected, setSelected] = useState<ReviewItem | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  const headers = { "x-generate-key": adminKey };

  async function loadQueue(nextStatus: ModerationStatus = status) {
    if (!adminKey) {
      setMessage("Enter the generate key above first.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/admin/moderation?status=${nextStatus}`,
        { headers },
      );
      if (!response.ok) {
        setMessage(
          response.status === 401 ? "Wrong key." : "Could not load queue.",
        );
        return;
      }
      const data = (await response.json()) as { items: ModerationSummary[] };
      setItems(data.items);
      setStatus(nextStatus);
      setLoaded(true);
      setSelected(null);
      setNote("");
    } catch {
      setMessage("Could not load queue.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPack(id: string) {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/admin/moderation?id=${encodeURIComponent(id)}`,
        { headers },
      );
      if (!response.ok) {
        setMessage("Could not load the story for review.");
        return;
      }
      const data = (await response.json()) as { item: ReviewItem };
      setSelected(data.item);
      setNote(data.item.moderation.note ?? "");
    } catch {
      setMessage("Could not load the story for review.");
    } finally {
      setLoading(false);
    }
  }

  async function decide(action: "approve" | "reject") {
    if (!selected || loading) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, action, note }),
      });
      if (!response.ok) {
        setMessage("Could not save the moderation decision.");
        return;
      }
      setSelected(null);
      setNote("");
      await loadQueue(status);
      setMessage(action === "approve" ? "Story approved." : "Story rejected.");
    } catch {
      setMessage("Could not save the moderation decision.");
    } finally {
      setLoading(false);
    }
  }

  const story = selected?.pack.story;
  const cover = story?.images.find((image) => image.role === "cover");
  const scenes = story?.images.filter((image) => image.role === "scene") ?? [];
  const storedModels = selected?.pack.generation?.models;
  const reusableModels = areGenerationModelsAllowed(storedModels)
    ? storedModels
    : undefined;

  useEffect(() => {
    if (!adminKey || !requestedId) return;
    const reviewId = requestedId;
    const controller = new AbortController();
    async function loadGeneratedStory() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setLoading(true);
      setMessage("");
      try {
        const [queueResponse, itemResponse] = await Promise.all([
          fetch("/api/admin/moderation?status=pending", {
            headers: { "x-generate-key": adminKey },
            signal: controller.signal,
          }),
          fetch(`/api/admin/moderation?id=${encodeURIComponent(reviewId)}`, {
            headers: { "x-generate-key": adminKey },
            signal: controller.signal,
          }),
        ]);
        if (!queueResponse.ok || !itemResponse.ok) {
          throw new Error("review_load_failed");
        }
        const queue = (await queueResponse.json()) as {
          items: ModerationSummary[];
        };
        const detail = (await itemResponse.json()) as { item: ReviewItem };
        setStatus("pending");
        setItems(queue.items);
        setLoaded(true);
        setSelected(detail.item);
        setNote(detail.item.moderation.note ?? "");
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setMessage("Could not load the generated story for review.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadGeneratedStory();
    return () => controller.abort();
  }, [adminKey, requestedId]);

  return (
    <section aria-labelledby="moderation-heading" className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-surface-border pb-4">
        <div>
          <p className="font-display text-xs font-bold tracking-wide text-brand uppercase">
            Publication gate
          </p>
          <h2
            id="moderation-heading"
            className="font-display mt-1 text-3xl font-bold"
          >
            Story moderation
          </h2>
          <p className="mt-1 text-sm text-muted">
            New stories stay private until you approve them.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadQueue()}
          disabled={!adminKey || loading}
          className="font-display rounded-full bg-brand px-5 py-2.5 font-semibold text-white shadow-sm focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load stories"}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" aria-label="Moderation status">
        {STATUSES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => loadQueue(item.value)}
            aria-pressed={status === item.value}
            disabled={!adminKey || loading}
            className={`font-display rounded-full px-4 py-2 text-sm font-semibold focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none disabled:opacity-50 ${
              status === item.value
                ? "bg-brand text-white"
                : "border-2 border-surface-border bg-surface text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {message && (
        <p className="mt-4 text-sm font-semibold text-brand" role="status">
          {message}
        </p>
      )}

      <div className="mt-5 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div>
          <h3 className="font-display text-lg font-bold capitalize">
            {status} stories
          </h3>
          {items.length === 0 ? (
            <p className="mt-3 rounded-xl border-2 border-surface-border bg-surface p-4 text-sm text-muted">
              {loaded
                ? `No ${status} stories.`
                : `Load the queue to see ${status} stories.`}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => loadPack(item.id)}
                    className={`w-full rounded-xl border-2 p-3 text-left focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none ${
                      selected?.id === item.id
                        ? "border-brand bg-brand/5"
                        : "border-surface-border bg-surface hover:border-brand/40"
                    }`}
                  >
                    <span className="font-display block font-bold">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted capitalize">
                      {item.tier} · {item.genre} · {item.date}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0">
          {!selected || !story ? (
            <div className="rounded-xl border-2 border-dashed border-surface-border p-8 text-center text-muted">
              Select a story to read and review it.
            </div>
          ) : (
            <article className="overflow-hidden rounded-xl border-2 border-surface-border bg-surface shadow-sm">
              {cover && (
                <ModerationImage
                  adminKey={adminKey}
                  alt={cover.alt}
                  blobPath={cover.blobPath}
                  className="aspect-video w-full bg-black/5"
                />
              )}
              <div className="p-5 sm:p-8">
                <div className="flex flex-wrap gap-2 text-xs font-semibold capitalize text-muted">
                  <span>{selected.pack.tier}</span>
                  <span>·</span>
                  <span>{story.genre}</span>
                  <span>·</span>
                  <span>{story.theme}</span>
                </div>
                <h3 className="font-display mt-2 text-3xl font-bold text-brand">
                  {story.title}
                </h3>
                {story.hook && (
                  <p className="mt-2 text-lg text-foreground/80">
                    {story.hook}
                  </p>
                )}

                <section className="mt-8 border-y-2 border-surface-border py-5">
                  <h4 className="font-display text-xl font-bold">
                    Story and moderation metadata
                  </h4>
                  <dl className="mt-4 grid gap-x-5 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <dt className="text-muted">Pack ID</dt>
                      <dd className="mt-1 break-all font-semibold">
                        {selected.id}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Story date</dt>
                      <dd className="mt-1 font-semibold">{selected.date}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Tier</dt>
                      <dd className="mt-1 font-semibold">
                        {selected.pack.tier}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Moderation status</dt>
                      <dd className="mt-1 font-semibold">
                        {selected.moderation.status}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Created</dt>
                      <dd className="mt-1 font-semibold">
                        {selected.moderation.createdAt}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Moderated</dt>
                      <dd className="mt-1 font-semibold">
                        {selected.moderation.moderatedAt ?? "Not yet"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Reading time</dt>
                      <dd className="mt-1 font-semibold">
                        {story.readingTimeMin} minutes
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Target words</dt>
                      <dd className="mt-1 font-semibold">
                        {story.targetWords.join(", ") || "None"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Art style</dt>
                      <dd className="mt-1 font-semibold">
                        {story.artDirection.style}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Art setting</dt>
                      <dd className="mt-1 font-semibold">
                        {story.artDirection.setting}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-muted">Character references</dt>
                      <dd className="mt-1 space-y-1 font-semibold">
                        {story.artDirection.characters.length
                          ? story.artDirection.characters.map((character) => (
                              <span key={character.name} className="block">
                                {character.name}: {character.look}
                              </span>
                            ))
                          : "None"}
                      </dd>
                    </div>
                    {selected.moderation.note && (
                      <div className="sm:col-span-2 lg:col-span-3">
                        <dt className="text-muted">Existing review note</dt>
                        <dd className="mt-1 font-semibold">
                          {selected.moderation.note}
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>

                <div className="mt-8 space-y-5 text-lg leading-relaxed">
                  {story.paragraphs.map((paragraph, index) => (
                    <div key={index} className="space-y-5">
                      <p>{paragraph}</p>
                      {scenes
                        .filter((scene) => scene.afterParagraph === index)
                        .map((scene) => (
                          <figure key={scene.blobPath}>
                            <ModerationImage
                              adminKey={adminKey}
                              alt={scene.alt}
                              blobPath={scene.blobPath}
                              className="aspect-video w-full rounded-lg bg-black/5"
                            />
                            <figcaption className="mt-2 text-sm text-muted italic">
                              {scene.alt}
                            </figcaption>
                          </figure>
                        ))}
                    </div>
                  ))}
                </div>

                <section className="mt-10 border-t-2 border-surface-border pt-6">
                  <h4 className="font-display text-xl font-bold">Vocabulary</h4>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    {selected.pack.vocabulary.map((item) => (
                      <div
                        key={item.word}
                        className="rounded-lg bg-background p-3"
                      >
                        <dt className="font-display font-bold text-brand">
                          {item.word}
                        </dt>
                        <dd className="mt-1 text-sm">{item.definition}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section className="mt-10 border-t-2 border-surface-border pt-6">
                  <h4 className="font-display text-xl font-bold">
                    Comprehension and answer key
                  </h4>
                  <ol className="mt-4 list-decimal space-y-5 pl-5">
                    {selected.pack.questions.map((question) => (
                      <li key={question.id} className="pl-1">
                        <p className="font-semibold">{question.question}</p>
                        <p className="mt-1 text-sm text-brand">
                          Answer: {question.answer}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {question.explanation}
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>

                {selected.pack.generation ? (
                  <>
                    <GenerationMetadata metadata={selected.pack.generation} />
                    {onReuseModels && reusableModels && (
                        <button
                          type="button"
                          onClick={() =>
                            onReuseModels(
                              reusableModels,
                              selected.pack.tier,
                              selected.date,
                            )
                          }
                          className="font-display mt-5 rounded-full border-2 border-brand px-5 py-2.5 font-semibold text-brand hover:bg-brand/5 focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none"
                        >
                          Generate another with same models
                        </button>
                      )}
                  </>
                ) : (
                  <section className="mt-10 border-t-2 border-surface-border pt-6">
                    <h4 className="font-display text-xl font-bold">
                      Generation metadata
                    </h4>
                    <p className="mt-2 text-sm text-muted">
                      This legacy pack does not contain generation telemetry.
                    </p>
                  </section>
                )}

                <section className="mt-10 border-t-2 border-surface-border pt-6">
                  <label className="block">
                    <span className="font-display font-bold">Review note</span>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder="Optional reason or review note"
                      className="mt-2 w-full rounded-xl border-2 border-surface-border bg-background p-3 focus-visible:border-brand focus-visible:outline-none"
                    />
                  </label>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => decide("approve")}
                      disabled={loading}
                      className="font-display rounded-full bg-emerald-600 px-6 py-2.5 font-semibold text-white focus-visible:ring-4 focus-visible:ring-emerald-300 focus-visible:outline-none disabled:opacity-50"
                    >
                      Approve and publish
                    </button>
                    <button
                      type="button"
                      onClick={() => decide("reject")}
                      disabled={loading}
                      className="font-display rounded-full bg-rose-600 px-6 py-2.5 font-semibold text-white focus-visible:ring-4 focus-visible:ring-rose-300 focus-visible:outline-none disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </section>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
