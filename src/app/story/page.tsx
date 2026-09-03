import Link from "next/link";
import { StoryBody } from "@/components/story-body";
import { StoryImage } from "@/components/story-image";
import { StoryAudioPlayer } from "@/components/story-audio-player";
import { getServedPack } from "@/lib/store/read";
import { getTierCookie } from "@/lib/tier-cookie";

export const dynamic = "force-dynamic";

export default async function StoryPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const tier = await getTierCookie();
  const { pack, id: packId } = await getServedPack(id, tier);
  const story = pack.story;
  const vocabulary = pack.vocabulary;
  const cover = story.images.find((img) => img.role === "cover");
  const hook = story.hook.trim() || story.paragraphs[0] || "";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        <Link
          href="/"
          className="font-display inline-flex items-center gap-1 rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-brand shadow-sm transition-transform hover:-translate-x-0.5 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
        >
          ← Back
        </Link>
        <Link
          href={`/print/${packId}`}
          className="font-display inline-flex items-center gap-1 rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-brand shadow-sm transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
        >
          🖨 Teacher&apos;s Pack
        </Link>
      </div>

      {cover?.blobPath ? (
        <section className="animate-pop-in relative mt-5 flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl bg-black/10 shadow-xl ring-4 ring-white sm:aspect-[16/9] dark:ring-surface">
          <StoryImage
            alt=""
            blobPath={cover.blobPath}
            className="absolute inset-0 h-full w-full scale-110 opacity-75 blur-2xl"
          />
          <StoryImage
            alt={cover.alt}
            blobPath={cover.blobPath}
            fit="contain"
            className="absolute inset-0 h-full w-full"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"
          />
          <div className="relative z-10 max-w-3xl p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display rounded-full bg-sunny px-3 py-1 text-xs font-extrabold text-[#2b2d52] shadow-md">
                Story
              </span>
              <span className="rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-white capitalize backdrop-blur-sm">
                {story.genre}
              </span>
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand capitalize">
                {story.theme}
              </span>
            </div>
            <h1 className="font-display mt-4 text-4xl font-bold tracking-tight text-white drop-shadow-md sm:text-6xl">
              {story.title}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
              {hook}
            </p>
            <p className="mt-3 text-sm font-medium text-white/80">
              {story.readingTimeMin} min read · tap a{" "}
              <span className="font-semibold text-sunny">highlighted</span> word
              for its meaning
            </p>
          </div>
        </section>
      ) : (
        <div className="mx-auto mt-8 max-w-2xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl">
            {story.title}
          </h1>
          {story.hook && (
            <p className="mt-3 text-lg leading-relaxed text-foreground/80">
              {story.hook}
            </p>
          )}
          <p className="mt-2 text-sm text-muted">
            {story.readingTimeMin} min read · tap a{" "}
            <span className="font-semibold text-brand">highlighted</span> word
            for its meaning
          </p>
        </div>
      )}

      {story.narration && (
        <StoryAudioPlayer
          blobPath={story.narration.blobPath}
          title={story.title}
        />
      )}

      <article className="mt-10 sm:mt-14">
        <StoryBody
          paragraphs={story.paragraphs}
          images={story.images}
          vocabulary={vocabulary}
        />

        {pack.generation && (
          <section
            aria-labelledby="model-provenance-heading"
            className="mx-auto mt-10 max-w-2xl border-y-2 border-surface-border py-6"
          >
            <p className="font-display text-xs font-bold tracking-wide text-brand uppercase">
              Story notes
            </p>
            <h2
              id="model-provenance-heading"
              className="font-display mt-1 text-xl font-bold"
            >
              How this story was made
            </h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-3">
              {[
                ["Story generation model", pack.generation.models.story],
                ["Learning model", pack.generation.models.learning],
                ["Image model", pack.generation.models.image],
                ...(story.narration
                  ? [
                      ["Speech model", story.narration.model],
                      ["Narration voice", story.narration.voice],
                    ]
                  : []),
              ].map(([label, model]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs font-semibold text-muted">{label}</dt>
                  <dd className="mt-1 break-words text-sm font-semibold">
                    {model}
                  </dd>
                </div>
              ))}
            </dl>
            <details className="mt-6 border-t-2 border-surface-border pt-4">
              <summary className="font-display cursor-pointer font-semibold text-brand marker:text-muted">
                Finer details: prompts used
              </summary>
              {pack.generation.prompts?.length ? (
                <div className="mt-5 space-y-7">
                  {[
                    [
                      "Story generation model",
                      pack.generation.prompts.filter(
                        (prompt) => prompt.step === "story",
                      ),
                    ],
                    [
                      "Learning model",
                      pack.generation.prompts.filter(
                        (prompt) =>
                          prompt.step === "learning" ||
                          prompt.step === "image_specs",
                      ),
                    ],
                    [
                      "Image model",
                      pack.generation.prompts.filter(
                        (prompt) => prompt.step === "image",
                      ),
                    ],
                    [
                      "Speech model",
                      pack.generation.prompts.filter(
                        (prompt) => prompt.step === "audio",
                      ),
                    ],
                  ].map(([label, prompts]) => {
                    const records = prompts as NonNullable<
                      typeof pack.generation.prompts
                    >;
                    if (records.length === 0) return null;
                    return (
                      <section key={label as string}>
                        <h3 className="font-display font-bold">
                          {label as string}
                        </h3>
                        <div className="mt-3 space-y-4">
                          {records.map((prompt, index) => (
                            <div
                              key={`${prompt.step}-${prompt.attempt}-${index}`}
                            >
                              <p className="text-xs font-semibold text-muted">
                                {prompt.label ?? `Attempt ${prompt.attempt}`} ·{" "}
                                {prompt.model}
                              </p>
                              {prompt.system && (
                                <>
                                  <h4 className="mt-3 text-xs font-semibold text-muted uppercase">
                                    System prompt
                                  </h4>
                                  <pre className="mt-1 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-foreground/5 p-3 font-sans text-xs leading-relaxed break-words">
                                    {prompt.system}
                                  </pre>
                                </>
                              )}
                              <h4 className="mt-3 text-xs font-semibold text-muted uppercase">
                                {prompt.step === "image" ||
                                prompt.step === "audio"
                                  ? "Prompt"
                                  : "User prompt"}
                              </h4>
                              <pre className="mt-1 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-foreground/5 p-3 font-sans text-xs leading-relaxed break-words">
                                {prompt.user}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Exact prompts were not recorded for this story. Prompt audit
                  details are available on newly generated stories.
                </p>
              )}
            </details>
          </section>
        )}

        <Link
          href={`/vocabulary?id=${packId}`}
          className="hover-pop mx-auto mt-10 flex max-w-2xl items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-mint to-sky p-5 text-white shadow-md focus-visible:ring-4 focus-visible:ring-mint/40 focus-visible:outline-none"
        >
          <span>
            <span className="font-display block text-lg font-bold">
              Practice the words
            </span>
            <span className="text-white/85">Try a quick vocabulary quiz.</span>
          </span>
          <span className="font-display shrink-0 rounded-full bg-white px-5 py-2 font-semibold text-emerald-700">
            Let&apos;s go →
          </span>
        </Link>
      </article>
    </div>
  );
}
