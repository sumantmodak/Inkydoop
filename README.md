# Inkydoop

An AI‑powered English Language Arts (ELA) web app for **elementary school students (grades 3–5)**. Every day brings a fresh word, a short AI‑generated story, vocabulary practice, and reading‑comprehension questions — all in a kid‑friendly UI.

---

## 1. Goals

- Make daily reading fun and habit‑forming.
- Build **vocabulary** through context, not memorization.
- Strengthen **reading comprehension** with thoughtful Q&A.
- Keep content **age‑appropriate and safe** for elementary readers.
- Use AI (via **OpenRouter**) so content is fresh every day without manual authoring.

## 2. Target Audience

| Audience | Grades | Reading Level | Story Length | Vocabulary Difficulty |
|----------|--------|---------------|--------------|-----------------------|
| Elementary | 3–5 | Lexile ~600–1100 | ~1,000 words | Tier 1–2 words |

All generated content targets this single band; no grade selector is required.

## 3. Core Features

### 3.1 Front Page
- **Word of the Day** card
  - Word, pronunciation, part of speech
  - Kid‑friendly definition
  - 2–3 example sentences
  - “Use it in a sentence” mini prompt
- **Interesting Sentences** strip
  - 3–5 vivid, well‑crafted sentences (mix of imagery, idiom, strong verbs)
  - Each sentence tagged with what makes it interesting (e.g., *metaphor*, *strong verb*, *alliteration*)
- **Today’s Story** entry point (cover image / title / 1‑line hook)
- Theme toggle

> The **cover image** is the first `story.images[]` entry (`role: cover`), served from Azure Blob Storage.

### 3.2 Story
- AI‑generated, **~1,000 words**, divided into short paragraphs/chapters.
- Genre rotates daily (adventure, mystery, sci‑fi, friendship, fable, historical…).
- Includes a small set of **target vocabulary** woven naturally into the prose.
- **3 illustrations** per story — 1 cover + 2 inline scene images — generated to match the text and served from Azure Blob Storage (see §6.1 Step 4.5). Images are **non‑blocking**: a failed illustration never invalidates a valid text pack.
- Inline “tap‑a‑word” feature: tap any word → quick definition popup.
- Estimated reading time displayed.

### 3.3 Vocabulary Builder
- Pulls **5–10 interesting words** from today’s story.
- For each word:
  - Definition, part of speech, example sentence (from the story)
  - Synonyms / antonyms
  - A short interactive activity (cycled):
    - Multiple choice
    - Fill in the blank
    - Match word ↔ definition
    - Use in your own sentence (AI feedback)

### 3.4 Comprehension Q&A
- 5–8 questions generated from the story, mixing:
  - **Literal** (“Who…”, “Where…”)
  - **Inferential** (“Why did…”, “What might happen if…”)
  - **Vocabulary in context**
  - **Theme / main idea**
- Answers are **hidden by default**:
  - User answers (free text or MC) → submit → app reveals correct answer + short explanation.
  - “Show answer” button available but de‑emphasized.
- **Free‑text answers are graded by a multi‑agent pipeline** (see §6.5): a friendly 3‑tier grade (`nailed_it` / `almost` / `lets_look_again`) plus one or two sentences of encouraging, specific feedback. MC and short literal answers are graded instantly by exact/fuzzy match — no LLM.
- Optional score summary at the end.

### 3.5 Story Library (browse the archive)
- A **browse page** listing **every** past daily pack, newest‑first.
- Each entry is a card showing lightweight **metadata**: cover thumbnail, title, genre, theme, date, and reading time — no full story loaded until you open it.
- **Paginated / infinite scroll** so the list stays fast as the archive grows (the store returns a continuation cursor, see §5.4).
- Clicking a card **loads that day’s story** in the Story view (§3.2) via `GET /api/story?date=YYYY-MM-DD`, with its vocabulary and quiz for that date.
- Optional lightweight **filter** by genre and **search** by title (client‑side over the loaded metadata page).

## 4. User Flow

```
Landing page
  ├─ Word of the Day card
  ├─ Interesting Sentences
  ├─ [Browse Library] ──▶ Story Library (all packs, newest‑first)
  │                         └─ pick a date ──▶ Story view (loads that pack)
  └─ [Read Today’s Story] ──▶ Story view
                                ├─ Read story (tap‑a‑word)
                                ├─ [Vocabulary Builder] ──▶ exercises
                                └─ [Comprehension Quiz] ──▶ Q&A with hidden answers
```

## 5. Architecture

### 5.1 High level

```
┌────────────┐    HTTPS    ┌──────────────┐    HTTPS    ┌──────────────────┐
│  Browser   │ ──────────▶ │  Web App API │ ──────────▶ │  OpenRouter LLMs │
│ (React UI) │ ◀────────── │  (Next.js)   │ ◀────────── │  + Image API     │
└────────────┘             │              │             └──────────────────┘
                           │  + cache /   │
                           │  daily store │
                           └──────┬───────┘
                                  │
                 ┌────────────────┴────────────────┐
                 │                                 │
        ┌────────▼───────────┐          ┌──────────▼───────────┐
        │  DailyPack store   │          │  Story images        │
        │  Azure Table       │          │  Azure Blob Storage  │
        │  Storage (JSON)    │          │  (WebP illustrations)│
        └────────────────────┘          └──────────────────────┘
```

### 5.2 Suggested Stack

- **Frontend:** Next.js (React) + TypeScript + Tailwind CSS
- **Backend:** Next.js API routes (single deployable — TypeScript end‑to‑end; Go/C# were considered and rejected to avoid a two‑language system)
- **AI:** OpenRouter API for text (model‑agnostic; default to a strong, low‑cost model) + a dedicated **image‑generation API** for illustrations
- **Storage:** **Azure Table Storage** (`@azure/data-tables`) for the daily JSON pack + **Azure Blob Storage** (`@azure/storage-blob`) for story images — same drivers in dev and prod (dev uses the free **Azurite** emulator, which emulates both Table and Blob). See §5.4.
- **Hosting:** Azure Container Apps (Managed Identity to both Table and Blob)

### 5.3 Why OpenRouter
- One API key, many models — easy to A/B test quality vs. cost.
- Can pin a specific model per content type (e.g. story vs. quiz generation).

### 5.4 Storage: Azure Table + Blob Storage

We use two Azure Storage primitives in one Storage Account:
- **Table Storage** for the daily JSON pack (tiny, keyed reads/writes).
- **Blob Storage** for story images (binary, too large for Table's 64 KB/property cap).

Our Table access pattern is tiny:
- Write ≤ 1 row per day from `/api/generate`.
- Read by exact key `date` or *“latest row where `date ≤ today`”*.
- No joins, no relational queries, no user data yet.

We use **Azure Table Storage in both dev and prod** — one driver, one code path, no environment drift.

- **Dev:** run the **Azurite** emulator locally (`npm i -g azurite` or the VS Code extension). Point `AZURE_STORAGE_CONNECTION_STRING` at `UseDevelopmentStorage=true`.
- **Prod:** a real Storage Account + Table. Cost is effectively free at our scale (cents/month).

#### Entity design

- `PartitionKey` = `"daily"` (constant) — all rows live in one partition, keeping scans cheap and ordered.
- `RowKey` = **inverted date** so an ascending scan is newest‑first:
  `rowKey = (99999999 - Number(date.replaceAll('-',''))).toString().padStart(8,'0')`
  e.g. `2026-06-30` → `"79736970"`.
  “Latest available” becomes: `PartitionKey eq 'daily' and RowKey ge <invertedToday>` with `top=1`.
- Properties: `date` (`"YYYY-MM-DD"`), `packJson` (string; gzip only if approaching the 64 KB per‑property limit — our packs are well under it), `createdAt`.
- **Denormalized metadata columns** — `title`, `genre`, `theme`, `coverBlobPath`, `readingTimeMin` — stored **alongside** `packJson`. The Story Library (§3.5) lists these via a projected query (`select` only the metadata columns), so browsing never deserializes full packs. `packJson` is fetched only when a single story is opened.
- Exact lookup uses `PartitionKey + RowKey` — a single point read, the cheapest/fastest op Table Storage offers.
- **Browse** is a single‑partition scan projecting the metadata columns, already newest‑first thanks to the inverted `RowKey`; `@azure/data-tables` returns a **continuation token** for paging.

#### Access layer

```ts
interface DailyPackStore {
  get(date: string): Promise<DailyPack | null>;
  getLatest(onOrBefore: string): Promise<{ date: string; pack: DailyPack } | null>;
  upsert(date: string, pack: DailyPack): Promise<void>;
  // Story Library (§3.5): metadata-only, paged, newest-first.
  list(opts?: { limit?: number; cursor?: string }):
    Promise<{ items: PackSummary[]; nextCursor?: string }>;
}

class AzureTableDailyPackStore implements DailyPackStore {
  // uses @azure/data-tables TableClient
}
```

#### Notes / gotchas

- `TableClient.upsertEntity(entity, "Replace")` gives idempotent writes for `force=true` regenerations.
- Wrap Azurite startup in an npm script (`"dev:storage": "azurite --silent --location .azurite --debug .azurite/debug.log"`) so `.azurite/` can be gitignored.
- One table (`DailyPacks`) is enough. If we later add users/progress, add separate tables rather than mixing entities.

#### Blob Storage (story images)

Images are far too large for a Table property, so illustrations live in **Azure Blob Storage** (same Storage Account, same Azurite emulator in dev).

- **Container:** `story-images` (public‑read or served via the app / CDN).
- **Path:** `{date}/{role}-{n}.webp` — e.g. `2026-07-14/cover.webp`, `2026-07-14/scene-1.webp`, `2026-07-14/scene-2.webp`. Deterministic paths mean a `force` regenerate overwrites in place.
- **Format:** WebP (small, wide browser support). Target < 300 KB per image.
- **What's stored in Table:** only the **blob path** (and `alt` text) inside the pack — never the image bytes. Table stays tiny; Blob holds the pixels.
- **Access layer:** `@azure/storage-blob` `BlockBlobClient`; generation uploads bytes, reads serve the blob URL. In prod, the app's Managed Identity has **Storage Blob Data Contributor**; in dev, Azurite via the connection string.
- **Lifecycle (optional):** a Blob lifecycle rule can cool/delete images older than N days to keep costs near zero, since only recent packs are ever served.

## 6. Content Generation Strategy

To keep cost low and quality high, generate content **once per day** and cache it. Generation is triggered **only** by the explicit, key‑protected `POST /api/generate` endpoint (see §6.2). No cron, no lazy fallback.

### 6.1 LLM generation flow

Each call to `/api/generate` runs the pipeline below. All LLM calls go through **OpenRouter** with `response_format: { type: "json_object" }` so we get parseable JSON, and every response is validated with **Zod** before we move on.

#### Step 0 — Seed the day
- Compute a deterministic seed from `date` (e.g. SHA‑256 → int).
- Use the seed to pick:
  - **Genre** from a rotating list (adventure, mystery, sci‑fi, friendship, fable, historical, slice‑of‑life…).
  - **Theme / motif** (e.g. *courage*, *curiosity*, *teamwork*, *change*).
  - **Setting hint** (forest, space station, small town, ancient market…).
- Fixed constraints: target Lexile 500–800, ~1,000 words, Tier 1–2 vocabulary, short sentences.

Determinism here means a `force` regenerate for the same date picks the same genre/theme — only the LLM output changes. This makes debugging predictable.

#### Step 1 — Generate the story (one big call)
- **Model:** `OPENROUTER_MODEL_STORY` (a stronger model, e.g. a 70B‑class instruct model).
- **Inputs:** genre, theme, setting, target word count (~1,000), Lexile band (500–800), safety rules, a small list of **seed words** we’d like woven in (optional — story can introduce its own too).
- **Output (JSON):** the story author also emits an **“art bible”** (`artDirection`) and the **image specs** (`images`) in the same call, so the model that knows the characters/setting/pacing is the one that describes them for illustration — this is what keeps characters consistent across images (see §6.1 Step 4.5).
  ```json
  {
    "title": "...",
    "genre": "mystery",
    "theme": "curiosity",
    "paragraphs": ["...", "..."],
    "candidateVocab": ["lantern", "echoed", "stubborn"],
    "artDirection": {
      "style": "soft watercolor children's-book illustration, warm palette",
      "characters": [{ "name": "Mia", "look": "9-year-old, curly brown hair, red raincoat" }],
      "setting": "a foggy seaside town at dusk"
    },
    "images": [
      { "role": "cover", "afterParagraph": -1, "prompt": "...", "alt": "..." },
      { "role": "scene", "afterParagraph": 2,  "prompt": "...", "alt": "..." },
      { "role": "scene", "afterParagraph": 5,  "prompt": "...", "alt": "..." }
    ]
  }
  ```
- **Validation:**
  - Word count within ±15% of target.
  - Flesch–Kincaid grade within target band; if off, retry once with a corrective prompt (“simplify” / “raise complexity”).
  - Safety filter pass (regex + lightweight moderation model). On fail → regenerate up to N=2 times, then abort with an error.
  - `artDirection` present and each `images[]` entry has a `prompt`, `alt`, and valid `afterParagraph`. If this block is missing/malformed, a cheap small‑model follow‑up regenerates **only** these fields from the finished story — the story text itself is not re‑rolled.

Why one call instead of chapter‑by‑chapter: keeps narrative coherence, costs less than multi‑turn drafting, and at ~1,000 words it fits comfortably in modern context windows. Emitting the art bible here (rather than re‑reading the story in a later call) means the illustrations share one canonical character/setting description — no drift from a second model re‑inferring what everyone looks like.

#### Step 2 — Extract vocabulary from the story
- **Model:** `OPENROUTER_MODEL_VOCAB` (smaller/cheaper model is fine).
- **Inputs:** the full story text + `candidateVocab` hint.
- **Task:** pick **5–10** words that are (a) actually present in the story, (b) appropriately challenging for grades 3–5, (c) varied (no two near‑synonyms).
- **Output (JSON):**
  ```json
  [
    {
      "word": "lantern",
      "pos": "noun",
      "definition": "a portable light with a protective case",
      "exampleFromStory": "She lifted the lantern and stepped into the cave.",
      "synonyms": ["lamp", "torch"],
      "antonyms": []
    }
  ]
  ```
- **Validation:** every `exampleFromStory` must be a substring of the story (case‑insensitive); definitions max ~140 chars; reject duplicates.

#### Step 3 — Generate comprehension questions
- **Model:** `OPENROUTER_MODEL_QUIZ` (small model — questions are structured and short).
- **Inputs:** the full story + the chosen vocabulary list.
- **Task:** produce **5–8** questions with a required mix:
  - 2 **literal** (who/what/where/when),
  - 2 **inferential** (why/how/predict),
  - 1 **vocabulary‑in‑context** (uses one of the chosen vocab words),
  - 1 **theme / main idea**,
  - 0–2 extras (author’s craft, sequencing, character motivation).
- **Output (JSON):**
  ```json
  [
    {
      "id": "q1",
      "type": "literal",
      "question": "Where did Mia find the lantern?",
      "choices": ["In the attic", "Under the bed", "In the garden", "At school"],
      "answer": "In the attic",
      "explanation": "Paragraph 2 says Mia 'climbed to the attic and discovered the lantern.'",
      "rubric": {
        "mustInclude": ["Mia was in the attic"],
        "niceToHave": ["mentions the lantern was dusty/hidden"],
        "commonWrongPatterns": ["confuses attic with basement"]
      }
    }
  ]
  ```
- **Rubric (for grading, see §6.5):** every question also carries a **pre‑computed rubric** — frozen grading criteria written *before* any student answer exists. `mustInclude` = concepts required for full credit; `niceToHave` = optional extras; `commonWrongPatterns` = known misconceptions to catch. Pre‑computing keeps grading consistent across all students, prevents answer‑influenced rubric drift, and lets an admin review criteria before they go live.
- **Validation:** answer must be one of `choices` (when present); every `explanation` should reference something verifiable in the story (we cheaply check that key answer phrases appear in the text); each `mustInclude` bullet must be non‑empty. On failure → regenerate that question only.

#### Step 4 — Generate front‑page extras (independent of the story)
- **Model:** `OPENROUTER_MODEL_WOTD` (small model).
- Two parallel sub‑calls:
  1. **Word of the Day** — a word appropriate for grades 3–5 (not necessarily in the story), with pronunciation, kid‑friendly definition, 2–3 example sentences, and a one‑line “try using it” prompt.
  2. **Interesting Sentences** — 3–5 vivid sentences, each tagged with the device that makes it interesting (`metaphor`, `simile`, `alliteration`, `strong verb`, `imagery`, `personification`).
- These are **independent of the story** so the front page can refresh even if a story regeneration is in flight.

#### Step 4.5 — Render illustrations (specs → images → Blob)
The image **specs and art bible already exist** from Step 1 — this step is purely mechanical, no further story inference.
- **Assemble each prompt:** `artDirection.style` + the relevant character `look`(s) + the spec's scene `prompt`, so every image shares one canonical style and character description (consistency by construction).
- **Image model:** call the dedicated **image API** (`IMAGE_API_KEY` / `IMAGE_MODEL`) once per spec.
- **Safety:** every prompt carries kid‑safe constraints (no scary/violent imagery). Each returned image passes a **moderation check** before upload; on a trip, regenerate up to N=2, then drop that image.
- **Upload:** convert to WebP, upload to Blob at `{date}/{role}-{n}.webp`, and record `{ role, afterParagraph, alt, blobPath }` in `story.images[]`.
- **Non‑blocking:** illustrations never block a valid text pack. If an image fails after retries, the pack is still persisted with whatever images succeeded (or none) — the UI simply renders text without the missing image.

#### Step 5 — Assemble, safety‑check, persist
- Combine outputs into a single `DailyPack` (see §7).
- Run the final **safety filter pass** over the whole pack (story + questions + WOTD + sentences + image alt text). If anything trips the filter at this stage, regenerate only the offending piece.
- Compute `readingTimeMin` = `wordCount / 150` rounded up.
- Persist image bytes to **Blob** and the JSON pack (with `story.images[]` blob paths) to **Table** with `UPSERT` on `date`; if `force=false` and a row exists, the endpoint returns `{ generated: false, reason: "exists" }` without calling any model.

#### Cost & latency profile (rough)
| Step | Model class | Tokens out | Notes |
|------|-------------|-----------|-------|
| 1 Story | Large | ~1.5k–2.5k | |
| 2 Vocab | Small | ~300 | |
| 3 Quiz | Small | ~500 | |
| 4 WOTD + Sentences | Small | ~250 (parallel) | |
| 4.5 Illustrations | Image API | 3 images | **New dominant cost** — ~1–4¢/image → ~3–12¢/day |
| **Total per day** | — | text ~2.5k–3.5k + 3 images | Text ≈ a few cents; images dominate but still ~$1–4/month |

A full daily generation is **one HTTP call to `/api/generate`** and typically completes in ~15–50s (image generation adds ~5–20s). This is fine — generation is a manual admin call, off the read path; reads serve cached blobs instantly.

#### Error handling
- Each step has a **retry budget** (default 2) with a corrective prompt seeded from the validator’s complaint.
- If a step fails after retries, the endpoint returns `{ ok: false, step, error }` and writes **nothing** (transactional — no half‑packs).
- Token usage per step is recorded in the response for visibility.

### 6.2 `/generate` endpoint (key‑protected)

A single admin route triggers generation on demand. It is the **only** way to (re)create a `DailyPack`.

- **Path:** `POST /api/generate` (also accepts `GET` for easy manual triggering from a browser/cURL).
- **Auth:** caller must supply a secret key that matches `GENERATE_API_KEY` in env.
  - Preferred: HTTP header `x-generate-key: <key>`.
  - Also accepted: `?key=<key>` query param (handy for manual runs; treat as lower‑trust).
- **Inputs (optional):**
  - `date` (defaults to today, UTC) — `YYYY-MM-DD`
  - `force` — `true` to overwrite an existing pack for that date
- **Behavior:**
  - Validates key with **constant‑time compare**; on mismatch returns `401` with no detail.
  - Rate‑limited (e.g. 5 req/min per IP) to limit abuse if the key leaks.
  - Runs the generation flow (6.1), validates JSON with Zod, runs safety filter, persists `DailyPack`.
  - Returns a summary: `{ date, generated: true, durationMs, tokensUsed }` (never the key).
- **Logging:** every call logs `{ timestamp, ip, date, success, durationMs }`. Key is **never** logged.

**Example calls**

```bash
# Generate today's pack
curl -X POST https://inkydoop.com/api/generate \
  -H "x-generate-key: $GENERATE_API_KEY"

# Regenerate a specific day
curl -X POST "https://inkydoop.com/api/generate?date=2026-07-01&force=true" \
  -H "x-generate-key: $GENERATE_API_KEY"
```

**Sketch**

```ts
// app/api/generate/route.ts
import { timingSafeEqual } from 'node:crypto';

function authorized(req: Request): boolean {
  const provided =
    req.headers.get('x-generate-key') ??
    new URL(req.url).searchParams.get('key') ?? '';
  const expected = process.env.GENERATE_API_KEY ?? '';
  if (!expected || provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function POST(req: Request) {
  if (!authorized(req)) return new Response('unauthorized', { status: 401 });
  const { date, force = false } = await parseParams(req);
  const result = await generateAndStore({ date, force });
  return Response.json({ ok: true, result });
}
export const GET = POST; // allow manual trigger
```

### 6.3 How daily generation actually happens

**Manual trigger only.** Generation runs **exclusively** when someone calls `POST /api/generate` with the correct key. There is **no lazy fallback** and **no external scheduler**.

- Read endpoints (story, vocab, quiz, front page) only read from the cache — they never call the LLM.
- **Browse the archive.** `GET /api/stories?limit=&cursor=` returns a metadata‑only, newest‑first page for the Story Library (§3.5): `{ items: PackSummary[], nextCursor? }`. It projects the denormalized metadata columns (§5.4) — no `packJson`, no LLM. `GET /api/story?date=YYYY-MM-DD` then loads a single full pack on demand.
- **Fallback to latest available pack.** When a read endpoint is hit:
  1. Look up `DailyPack` for `today`.
  2. If missing, return the **most recent** `DailyPack` (highest `date <= today`).
  3. The response includes a `meta` block so the UI can show context:
     ```json
     { "meta": { "requestedDate": "2026-07-01", "servedDate": "2026-06-29", "isFresh": false } }
     ```
  4. Only if **no pack exists at all** does the API return HTTP 404.
- The UI shows a small banner when `isFresh: false`, e.g. *“Today’s pack isn’t ready yet — here’s the latest from {servedDate}.”*
- To produce today’s content, run (locally or in any shell):

  ```bash
  curl -X POST https://inkydoop.com/api/generate \
    -H "x-generate-key: $GENERATE_API_KEY"
  ```

This keeps the system simple and predictable: zero hidden LLM calls, no surprise costs, no scheduler infra to maintain — and the site is never empty as long as one pack has ever been generated.

### 6.4 Prompt Design (sketch)

**Story prompt**
```
You are writing a {genre} story for elementary students in grades 3–5 (Lexile ~{lexile}).
Length: {wordCount} words. Tone: engaging, age‑appropriate, no violence/scary content.
Weave these target words naturally: {targetWords}.
Also act as art director: define a consistent visual style + character looks, then
write 3 illustration prompts (1 cover + 2 scenes) that reuse those exact descriptions.
Return JSON: {
  "title": ..., "paragraphs": [...], "targetWords": [...],
  "artDirection": { "style": ..., "characters": [{ "name", "look" }], "setting": ... },
  "images": [{ "role": "cover"|"scene", "afterParagraph", "prompt", "alt" }]
}
```

**Quiz prompt**
```
Given this story, create 6 comprehension questions for elementary students in grades 3–5.
Mix: 2 literal, 2 inferential, 1 vocabulary‑in‑context, 1 theme.
Return JSON: [{ "id", "type", "question", "answer", "explanation", "choices?" }]
```

All LLM calls request **structured JSON** and are validated with a schema (e.g. Zod) before being cached.

### 6.5 Answer Grading (multi‑agent)

Free‑text comprehension answers (inferential, theme, vocabulary‑in‑context) are graded by a small multi‑agent pipeline anchored on the **pre‑computed rubric** from §6.1 Step 3. MC and short literal answers never reach it. The design principle: **each agent gets the smallest slice of context that lets it do its one job well**, which makes grading measurably more reliable than one big prompt.

```
Student answer
   │
   ▼
① Router (code)      ── MC / short literal ──► exact / fuzzy match ──► grade + done
   │ open‑ended
   ▼
② Guard (small)      detect prompt‑injection + unsafe content; wrap answer in <student_answer> tags
   ▼
③ Grader ×2 (small, parallel)   score vs. rubric + story; charity rules (ignore spelling, concept over keywords)
   ▼
④ Judge (medium)     ONLY if graders disagree or confidence is low; arbitrates from rubric + structured grader outputs
   ▼
⑤ Feedback (small)   turn the grade into 1–2 kind, specific sentences
```

**Step 1 — Router** (code, no LLM). MC → exact match; short literal → normalize + fuzzy match (Levenshtein ≥ 0.85) against `answer`. Both short‑circuit here. Only inferential / theme / vocab‑in‑context (or an empty/ambiguous literal) continue.

**Step 2 — Guard** (`OPENROUTER_MODEL_QUIZ`, small). Treats the student's text as **untrusted**: detects prompt‑injection (“ignore previous…”, role‑play, fake schema) and unsafe content, then wraps the answer in `<student_answer>…</student_answer>` so every downstream prompt treats it as data, never instructions. On `injection: true` → skip grading, return a neutral `lets_look_again` (never reveal that injection was detected).

**Step 3 — Graders ×2** (`OPENROUTER_MODEL_GRADER`, small, run in parallel). Both receive the **same** inputs — the pre‑computed rubric, the story, and the wrapped answer — and each emits `{ score, mustIncludeHits[], mustIncludeMissed[], wrongPatternHits[], confidence }`. Use two independent variants (different temperatures or model framings) so their **agreement rate** is a real quality signal. **Charity rules** in every grader prompt: ignore spelling/grammar; accept the most generous reading that still matches a rubric bullet; concept match ≥ keyword match; never penalize brevity.

**Step 4 — Judge** (`OPENROUTER_MODEL_JUDGE`, medium). Runs **only** when the two graders disagree, or either confidence is low. It sees the rubric + both graders' **structured outputs** (scores and rubric hits — *not* their free‑text justifications, which cause anchoring) and re‑adjudicates. When graders agree with high confidence, the judge is skipped — that's the cost savings (~80% of answers). On judge failure → default to the **more forgiving** of the two grades.

**Step 5 — Feedback** (`OPENROUTER_MODEL_WOTD`, small). Turns the final grade + rubric hits/misses into one or two encouraging, kid‑appropriate sentences. Kept **separate from grading** so “be kind” never inflates the score. Never says “wrong” — on a miss it offers a concrete hint (“Reread paragraph 3…”). On failure → fall back to a static template keyed on the grade.

**Grade scale.** Three tiers for grades 3–5: `nailed_it` / `almost` / `lets_look_again`. `almost` = 1+ `mustInclude` hits but not all. No numeric percentages — they pretend more precision than the graders have and demoralize kids.

**Cost per open‑ended answer:** ~2–4 small‑model calls (guard, 2 graders, feedback) + judge on ~20% → ~1–1.5k tokens, ~2–4s. Easy question types cost **zero** LLM calls.

## 7. Data Model (initial)

```ts
DailyPack {
  date: string            // YYYY-MM-DD
  wordOfTheDay: { word, pos, pronunciation, definition, examples[] }
  interestingSentences: { text, tag }[]
  story: {
    title, genre, paragraphs[], readingTimeMin, targetWords[],
    artDirection: { style: string, characters: { name: string, look: string }[], setting: string },
    images: { role: 'cover'|'scene', afterParagraph: number, alt: string, blobPath: string }[]
  }
  vocabulary: { word, pos, definition, exampleFromStory, synonyms[], antonyms[] }[]
  questions: {
    id, type, question, answer, explanation, choices?,
    rubric: { mustInclude: string[], niceToHave: string[], commonWrongPatterns: string[] }
  }[]
}

// Metadata-only projection for the Story Library (§3.5) — never carries packJson:
PackSummary {
  date: string            // YYYY-MM-DD
  title: string
  genre: string
  theme: string
  readingTimeMin: number
  coverBlobPath: string | null   // cover thumbnail; null if illustrations failed
}

// Produced by the §6.5 grading pipeline (not persisted until we add accounts):
QuizAttempt {
  questionId: string
  studentAnswer: string
  grade: 'nailed_it' | 'almost' | 'lets_look_again'
  mustIncludeHits: string[]
  feedback: string
  graderAgreement: boolean   // telemetry: did the two graders match?
  judged: boolean            // telemetry: did the judge have to arbitrate?
}
```

Optional later: `User`, `Progress` (persist `QuizAttempt` per user).

## 8. Safety & Quality

- **Content guardrails** in the system prompt (no violence, romance, scary content, profanity, politics).
- Post‑generation **filter pass** (regex + lightweight moderation model) before caching.
- **Student‑input is untrusted.** The grading Guard agent (§6.5 Step 2) detects prompt‑injection and unsafe content in submitted answers and wraps them in `<student_answer>` tags so downstream graders treat them as data, never instructions.
- **Image safety.** Every illustration prompt (§6.1 Step 4.5) carries kid‑safe constraints; each generated image passes a **moderation check** before it's uploaded to Blob, and `alt` text is mandatory (accessibility + a second content check).
- Manual override: an admin can regenerate a day’s pack.
- Reading‑level check (e.g. Flesch‑Kincaid) to verify story matches the grades 3–5 band; regenerate if off.

## 9. UX Principles

- **Big, friendly typography**; high contrast; dyslexia‑friendly font option.
- Minimal chrome — content first.
- Encouraging tone, no harsh “wrong” feedback.
- Works on **tablet and desktop**; mobile‑responsive.
- Optional **read‑aloud** (browser SpeechSynthesis) for accessibility.

## 10. Milestones

| # | Milestone | Output |
|---|-----------|--------|
| M0 | Project scaffold | Next.js + TS + Tailwind, env config, OpenRouter client |
| M1 | Story generation | API route returns a validated story JSON |
| M2 | Front page | Word of the Day + Interesting Sentences (static fallback + AI) |
| M3 | Story view | Renders story, tap‑a‑word definitions |
| M4 | Vocabulary builder | Word list + 1 exercise type (MC) |
| M5 | Comprehension Q&A | Questions with hidden answers, reveal on submit; multi‑agent grading of free‑text answers (§6.5) |
| M6 | Daily caching + generation API | `DailyPack` persistence; key‑protected `POST /api/generate` as the **only** generation path; read endpoints fall back to the latest available pack when today’s is missing |
| M6.5 | Illustrations | 3 images/story (cover + 2 scenes) generated, moderated, stored in Blob; rendered inline + as cover |
| M6.6 | Story Library | Browse all packs (metadata‑only, paged, newest‑first); open any date to load its story (§3.5) |
| M7 | Polish | Read‑aloud, theme, accessibility pass, deploy |
| M8 | Teacher mode | Printable **PDF of today’s pack** (story + vocabulary + Q&A with answer key) |

## 11. Configuration

Environment variables (`.env.local`):

```
OPENROUTER_API_KEY=...
OPENROUTER_MODEL_STORY=meta-llama/llama-3.1-70b-instruct
OPENROUTER_MODEL_VOCAB=meta-llama/llama-3.1-8b-instruct
OPENROUTER_MODEL_QUIZ=meta-llama/llama-3.1-8b-instruct
OPENROUTER_MODEL_WOTD=meta-llama/llama-3.1-8b-instruct
# Answer grading (§6.5). Guard reuses QUIZ, feedback reuses WOTD.
OPENROUTER_MODEL_GRADER=meta-llama/llama-3.1-8b-instruct
OPENROUTER_MODEL_JUDGE=meta-llama/llama-3.1-70b-instruct

# Story illustrations (§6.1 Step 4.5)
IMAGE_API_KEY=...
IMAGE_MODEL=...            # e.g. a hosted SDXL/FLUX or provider image model

# Azure Storage — one account, Table for JSON + Blob for images
# (used in dev via Azurite, and in prod via a real Storage Account)
# Dev with Azurite emulator:
AZURE_STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true
# Prod: paste the connection string from your Storage Account
# AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net
AZURE_TABLE_NAME=DailyPacks
AZURE_BLOB_CONTAINER=story-images

# Secret used to authorize POST /api/generate. Generate with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
GENERATE_API_KEY=replace-with-long-random-string
```

**Key handling rules**
- Treat `GENERATE_API_KEY` as a secret: never commit, never log, never expose to the client bundle (server‑side only — do **not** prefix with `NEXT_PUBLIC_`).
- Use a long random value (≥ 32 bytes hex).
- Rotate by updating the env var and redeploying.

## 12. Deployment

Since we already committed to **Azure Table + Blob Storage**, the path of least friction is to host the whole app on Azure too — one bill, one identity model, one portal, and Managed Identity access to the storage account (no connection strings in prod).

### 12.1 Recommended target: **Azure Container Apps** (ACA)

Next.js runs great as a container, and ACA gives us:
- HTTPS + custom domains + auto‑scaling out of the box.
- **Scale‑to‑zero** for a hobby workload — you pay only when someone hits the site.
- Simple **revisions** (blue/green) and per‑revision env vars.
- **Managed Identity** to talk to Storage without secrets.

**Topology**

```
Resource Group: rg-inkydoop
├─ Storage Account: stinkydoop<suffix>
│    ├─ Table: DailyPacks          (daily JSON pack)
│    └─ Blob container: story-images (WebP illustrations)
├─ Container Apps Environment: cae-inkydoop
│    └─ Container App: ca-inkydoop-web  (Next.js image)
├─ Container Registry: crinkydoop<suffix>  (or use GHCR)
└─ Log Analytics Workspace: log-inkydoop
```

**One‑time setup (sketch)**

```bash
# Variables
RG=rg-inkydoop
LOC=eastus
ST=stinkydoop$RANDOM
ENV=cae-inkydoop
APP=ca-inkydoop-web
ACR=crinkydoop$RANDOM

az group create -n $RG -l $LOC

# Storage account + table + blob container
az storage account create -n $ST -g $RG -l $LOC --sku Standard_LRS
az storage table create --account-name $ST -n DailyPacks
az storage container create --account-name $ST -n story-images

# Container registry (skip if using GHCR)
az acr create -n $ACR -g $RG --sku Basic --admin-enabled false

# Container Apps environment
az containerapp env create -n $ENV -g $RG -l $LOC

# The app itself (image built and pushed separately in CI — see 12.3)
az containerapp create \
  -n $APP -g $RG --environment $ENV \
  --image $ACR.azurecr.io/inkydoop:latest \
  --ingress external --target-port 3000 \
  --min-replicas 0 --max-replicas 2 \
  --system-assigned \
  --secrets openrouter-key=$OPENROUTER_API_KEY generate-key=$GENERATE_API_KEY image-key=$IMAGE_API_KEY \
  --env-vars \
      AZURE_STORAGE_ACCOUNT=$ST \
      AZURE_TABLE_NAME=DailyPacks \
      AZURE_BLOB_CONTAINER=story-images \
      OPENROUTER_API_KEY=secretref:openrouter-key \
      GENERATE_API_KEY=secretref:generate-key \
      IMAGE_API_KEY=secretref:image-key \
      OPENROUTER_MODEL_STORY=meta-llama/llama-3.1-70b-instruct \
      OPENROUTER_MODEL_VOCAB=meta-llama/llama-3.1-8b-instruct \
      OPENROUTER_MODEL_QUIZ=meta-llama/llama-3.1-8b-instruct \
      OPENROUTER_MODEL_WOTD=meta-llama/llama-3.1-8b-instruct \
      OPENROUTER_MODEL_GRADER=meta-llama/llama-3.1-8b-instruct \
      OPENROUTER_MODEL_JUDGE=meta-llama/llama-3.1-70b-instruct

# Grant the app's managed identity access to Table + Blob
PRINCIPAL_ID=$(az containerapp show -n $APP -g $RG --query identity.principalId -o tsv)
STORAGE_ID=$(az storage account show -n $ST -g $RG --query id -o tsv)
az role assignment create --assignee $PRINCIPAL_ID \
  --role "Storage Table Data Contributor" \
  --scope $STORAGE_ID
az role assignment create --assignee $PRINCIPAL_ID \
  --role "Storage Blob Data Contributor" \
  --scope $STORAGE_ID
```

**Prod auth to storage**: the app uses `DefaultAzureCredential` from `@azure/identity` with `TableClient` (Table) and `BlobServiceClient` (Blob). No `AZURE_STORAGE_CONNECTION_STRING` in prod — the connection string is only used in dev (Azurite).

### 12.2 Dockerfile (Next.js standalone)

```dockerfile
# Dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build   # next.config.js: output: 'standalone'

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### 12.3 CI/CD (GitHub Actions)

Two workflows:

1. **`ci.yml`** — on every PR: `npm ci`, `npm run lint`, `npm test`, `npm run build`.
2. **`deploy.yml`** — on push to `main`:
   - Log in to Azure via OIDC (federated credentials — no long‑lived secrets).
   - `docker build` + push to ACR (or GHCR).
   - `az containerapp update -n ca-inkydoop-web -g rg-inkydoop --image <acr>/inkydoop:${{ github.sha }}` — ACA creates a new revision and shifts traffic.

Secrets stored as GitHub Environment secrets: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`. App runtime secrets live in ACA (as above), **not** in GitHub.

### 12.4 Alternatives (and why we\u2019re not picking them)

| Option | Verdict |
|---|---|
| **Vercel** | Fastest to ship Next.js, but adds a second vendor and a second bill. Fine if you want zero‑config previews; Azure Table still works from Vercel (via connection string). |
| **Azure Static Web Apps + Functions** | Great for pure static + light API, but our `/api/generate` can run 10–30s (LLM). SWA managed Functions have short defaults; ACA is simpler. |
| **Azure App Service (Linux, Node)** | Works fine; slightly more expensive at idle than ACA scale‑to‑zero. Pick this if you dislike containers. |
| **AKS** | Overkill for a single web app. |

### 12.5 Cost sketch (hobby scale)

- **ACA**: min‑replicas=0 → ~$0 idle; per‑request compute is fractions of a cent.
- **Storage Account (LRS)**: pennies/month for our Table + Blob volume (a month of WebP images is a few MB).
- **Log Analytics**: keep retention low (30 days); a few dollars/month at most.
- **OpenRouter (text)**: ~3.5k output tokens per pack × ~30 days ≈ 105k tokens/month — well under a dollar for small models, a few dollars if the story model is large.
- **Image API**: the new dominant cost — 3 images/day × ~1–4¢ × 30 days ≈ **$1–4/month**.

### 12.6 Deployment checklist

- [ ] `GENERATE_API_KEY` set as an ACA **secret** (not a plain env var).
- [ ] `OPENROUTER_API_KEY` and `IMAGE_API_KEY` set as ACA **secrets**.
- [ ] App’s Managed Identity has **Storage Table Data Contributor** and **Storage Blob Data Contributor** on the storage account.
- [ ] `AZURE_STORAGE_ACCOUNT`, `AZURE_TABLE_NAME`, `AZURE_BLOB_CONTAINER` env vars set (no connection string in prod).
- [ ] Custom domain + managed cert bound in ACA.
- [ ] Log Analytics receiving container logs; a saved query for `/api/generate` calls.
- [ ] First manual `curl -X POST .../api/generate -H "x-generate-key: ..."` succeeds and writes the `DailyPacks` row **and** the `story-images` blobs.
- [ ] Confirm read endpoints fall back to the latest pack when today’s row is absent, and that images render from Blob.

## 13. Decisions

1. **Accounts** — **Anonymous-only** at first. No login or progress tracking in v1; `QuizAttempt` (§7) stays in-memory/session-only until accounts are added later.
2. **Languages** — **English only** for now. ESL/Spanish deferred.
3. **Teacher mode** — **Yes.** Provide a printable **PDF of today’s pack** (story + vocabulary + comprehension Q&A with an answer key) — see milestone M8.

## 14. Execution Plan

Task-by-task plan grouped by milestone. Each task lists **outputs** and **dependencies** (by task ID). A task is *done* when its acceptance check passes. Conventions: `T{milestone}.{n}`; TypeScript throughout; every LLM/IO boundary validated with **Zod**.

### M0 — Project scaffold
- [ ] **T0.1 Init repo** — `create-next-app` (App Router, TS, ESLint, Tailwind, `src/`), set `next.config.js` → `output: 'standalone'`. Add `pnpm` + Node 22 `.nvmrc`. *Dep:* —
- [ ] **T0.2 Tooling** — Prettier, ESLint config, `vitest` + `@testing-library`, Playwright, `.editorconfig`. Scripts: `dev`, `build`, `lint`, `test`, `test:e2e`. *Dep:* T0.1
- [ ] **T0.3 Env plumbing** — `src/lib/env.ts`: Zod-validate all env vars from §11; fail fast on boot. `.env.example` committed; `.env.local` gitignored. *Dep:* T0.1
- [ ] **T0.4 OpenRouter client** — `src/lib/ai/openrouter.ts`: typed `chatJson<T>(model, messages, schema)` that sets `response_format: json_object`, parses, and Zod-validates with a retry-on-invalid-JSON budget. *Dep:* T0.3
- [ ] **T0.5 Azurite dev storage** — `dev:storage` npm script; `.azurite/` gitignored; README dev-setup note. *Dep:* T0.1
- [ ] **T0.6 Shared schemas** — `src/lib/schemas.ts`: Zod schemas + inferred types for `DailyPack`, `story` (incl. `artDirection`, `images`), `vocabulary`, `questions` (incl. `rubric`), `QuizAttempt` (§7). Single source of truth for UI + API. *Dep:* T0.3
- [ ] **T0.7 CI** — `.github/workflows/ci.yml`: `pnpm i`, lint, test, build on PR. *Dep:* T0.2
- **Acceptance:** `pnpm build` + `pnpm test` green; boot fails clearly on a missing env var.

### M1 — Story generation
- [ ] **T1.1 Seed** — `src/lib/gen/seed.ts`: deterministic `date → { genre, theme, setting }` via SHA-256 (§6.1 Step 0) + unit tests proving determinism. *Dep:* T0.6
- [ ] **T1.2 Story prompt** — `src/lib/gen/story.ts`: build the §6.4 story prompt (incl. art-director instructions) and call `chatJson` with the story schema. *Dep:* T0.4, T1.1
- [ ] **T1.3 Validators** — word-count ±15%, Flesch–Kincaid band check, safety regex/moderation, `artDirection`/`images` presence; corrective-retry loop (N=2); image-fields-only fallback regen. *Dep:* T1.2
- [ ] **T1.4 Story API (dev)** — temporary `GET /api/dev/story` returning a validated story for manual inspection. *Dep:* T1.3
- **Acceptance:** repeated calls for a fixed date yield the same genre/theme; output passes all validators.

### M2 — Front page
- [ ] **T2.1 WOTD + Sentences gen** — `src/lib/gen/frontpage.ts`: two parallel small-model calls (§6.1 Step 4), Zod-validated. *Dep:* T0.4
- [ ] **T2.2 Static fallback** — bundled default WOTD + sentences so the page never renders empty. *Dep:* T0.6
- [ ] **T2.3 Landing UI** — `/` page: WOTD card, Interesting Sentences strip, Today’s Story hook (cover slot), theme toggle. Tailwind + accessible components. *Dep:* T2.1, T2.2
- **Acceptance:** landing renders from a sample pack and from static fallback; Lighthouse a11y ≥ 90.

### M3 — Story view
- [ ] **T3.1 Story renderer** — `/story` route: paragraphs, reading-time, cover + inline images placed by `afterParagraph` (graceful when an image is missing). *Dep:* T2.3, T1.3
- [ ] **T3.2 Tap-a-word** — client popover: tap a word → definition (from pack vocab first, else a lightweight lookup). Keyboard + touch accessible. *Dep:* T3.1
- **Acceptance:** story renders with 0–3 images correctly; tap-a-word works on touch and keyboard.

### M4 — Vocabulary builder
- [ ] **T4.1 Vocab gen** — `src/lib/gen/vocab.ts`: §6.1 Step 2 extraction, substring validation, dedupe. *Dep:* T1.3
- [ ] **T4.2 Vocab UI + MC exercise** — word list with definition/synonyms; one Multiple-Choice activity with immediate, encouraging feedback. *Dep:* T4.1, T2.3
- **Acceptance:** every `exampleFromStory` is a real substring; MC exercise scores correctly.

### M5 — Comprehension Q&A + grading
- [ ] **T5.1 Question gen** — `src/lib/gen/quiz.ts`: §6.1 Step 3 with required type mix + **pre-computed rubric** per question; validators. *Dep:* T1.3, T4.1
- [ ] **T5.2 Router (Step 1)** — `src/lib/grade/router.ts`: MC exact-match, literal fuzzy-match (Levenshtein ≥ 0.85); no LLM. Unit tests. *Dep:* T0.6
- [ ] **T5.3 Guard (Step 2)** — injection + safety detection; wrap answer in `<student_answer>` tags. *Dep:* T0.4
- [ ] **T5.4 Graders ×2 (Step 3)** — two parallel variants vs. rubric + story; charity rules; structured output. *Dep:* T5.1, T5.3
- [ ] **T5.5 Judge (Step 4)** — runs only on disagreement/low-confidence; structured inputs only; forgiving default on failure. *Dep:* T5.4
- [ ] **T5.6 Feedback (Step 5)** — kind, specific message; static template fallback. *Dep:* T5.4
- [ ] **T5.7 Grade API** — `POST /api/grade`: orchestrate Steps 1–5, return `{ grade, feedback, telemetry }`. Rate-limited. *Dep:* T5.2–T5.6
- [ ] **T5.8 Quiz UI** — questions with hidden answers, submit → reveal + feedback; de-emphasized “Show answer”; optional score summary. *Dep:* T5.7, T2.3
- **Acceptance:** MC/literal grade with zero LLM calls; an injection attempt is neutralized; grader-agreement + judged flags recorded.

### M6 — Daily caching + generation API
- [ ] **T6.1 Table store** — `src/lib/store/tableStore.ts`: `AzureTableDailyPackStore` (`get`/`getLatest`/`upsert`), inverted-date RowKey (§5.4). *Dep:* T0.5, T0.6
- [ ] **T6.2 Assemble + persist (Step 5)** — combine all gen outputs into `DailyPack`, final safety pass, `readingTimeMin`, upsert; also write the denormalized metadata columns (`title`, `genre`, `theme`, `coverBlobPath`, `readingTimeMin`) for the Story Library (§5.4). *Dep:* T1.3, T2.1, T4.1, T5.1, T6.1
- [ ] **T6.3 `/api/generate`** — key-protected (`timingSafeEqual`), `date`/`force` params, rate-limit, structured summary, safe logging (§6.2). `GET = POST`. *Dep:* T6.2
- [ ] **T6.4 Read endpoints + fallback** — story/vocab/quiz/front-page reads serve cache; latest-pack fallback + `meta.isFresh` banner (§6.3). *Dep:* T6.1
- [ ] **T6.5 Wire UI to reads** — replace dev/sample data in M2–M5 with real read endpoints. *Dep:* T6.4, T2.3, T3.1, T4.2, T5.8
- **Acceptance:** one `/api/generate` call populates a day; reads serve it; missing-today falls back with the banner; 404 only when no pack ever existed.

### M6.5 — Illustrations
- [ ] **T6.5.1 Blob store** — `src/lib/store/blobStore.ts`: upload WebP to `story-images` at `{date}/{role}-{n}.webp`; Managed Identity in prod, Azurite in dev. *Dep:* T6.1
- [ ] **T6.5.2 Image render (Step 4.5)** — assemble prompt from `artDirection` + spec; call image API; **moderate**; WebP-encode; upload; record `blobPath`. Non-blocking on failure. *Dep:* T6.5.1, T1.3
- [ ] **T6.5.3 Hook into generate** — call T6.5.2 within `/api/generate`; persist `story.images[]` paths. *Dep:* T6.5.2, T6.3
- [ ] **T6.5.4 Serve images** — resolve `blobPath` → URL in story + cover UI; alt text applied. *Dep:* T3.1, T6.5.3
- **Acceptance:** generate produces ≤3 moderated WebP blobs; a failed/blocked image leaves a valid text pack; images render with alt text.

### M6.6 — Story Library
- [ ] **T6.6.1 Store `list()`** — add `list({ limit, cursor })` to `AzureTableDailyPackStore`: single-partition scan projecting metadata columns only, newest-first, returning `{ items: PackSummary[], nextCursor? }` from the Table continuation token (§5.4). Unit test paging. *Dep:* T6.1, T6.2
- [ ] **T6.6.2 `/api/stories`** — `GET /api/stories?limit=&cursor=` returns a metadata-only page; no `packJson`, no LLM. Zod-validate the response. *Dep:* T6.6.1
- [ ] **T6.6.3 Library UI** — `/library` route: responsive card grid (cover thumb, title, genre, theme, date, reading time) with infinite scroll / “load more” via `nextCursor`; graceful cover fallback when `coverBlobPath` is null. *Dep:* T6.6.2, T6.5.4
- [ ] **T6.6.4 Open a story** — card → `/story?date=YYYY-MM-DD` loads that pack via `GET /api/story?date=` and reuses the Story view (§3.2). *Dep:* T6.6.3, T3.1, T6.4
- [ ] **T6.6.5 Filter/search (optional)** — client-side genre filter + title search over the loaded metadata pages. *Dep:* T6.6.3
- **Acceptance:** the library lists all packs newest-first without loading full stories; paging works past one page; clicking any card loads that date’s story, vocab, and quiz.

### M7 — Polish
- [ ] **T7.1 Read-aloud** — SpeechSynthesis controls on story/WOTD; play/pause/stop. *Dep:* T3.1
- [ ] **T7.2 Theme + fonts** — light/dark toggle (persisted); dyslexia-friendly font option (§9). *Dep:* T2.3
- [ ] **T7.3 Accessibility pass** — keyboard nav, focus states, ARIA, contrast; Playwright + axe checks. *Dep:* M2–M6.5 UI
- [ ] **T7.4 Dockerfile + deploy** — §12.2 Dockerfile; §12 one-time Azure setup; `deploy.yml` (OIDC → ACR → `containerapp update`); run the §12.6 checklist. *Dep:* T6.5.4, T0.7
- **Acceptance:** deployed to ACA on a custom domain; §12.6 checklist fully green.

### M8 — Teacher mode (PDF)
- [ ] **T8.1 Printable route** — `/print/[date]` server-rendered, print-optimized layout: story + vocabulary + Q&A **with answer key**. *Dep:* T6.4
- [ ] **T8.2 PDF export** — print CSS (`@media print`) for browser “Save as PDF”; if fidelity needs more, a server route rendering via headless Chromium. Decide based on T8.1 output. *Dep:* T8.1
- [ ] **T8.3 Teacher entry point** — a discreet “Print today’s pack” action. *Dep:* T8.1
- **Acceptance:** a clean one-to-two-page PDF for any cached date, answer key included.

### Cross-cutting (do alongside, not last)
- [ ] **X.1 Telemetry** — persist grader-agreement / judged / token-usage counters; a Log Analytics saved query. *Dep:* T5.7, T7.4
- [ ] **X.2 Error contract** — consistent `{ ok:false, step, error }` shape across generation + grading (§6.1 error handling). *Dep:* T1.3, T5.7
- [ ] **X.3 Rate limiting** — shared limiter for `/api/generate` and `/api/grade`. *Dep:* T5.7, T6.3
- [ ] **X.4 Content safety review** — spot-check a week of generated packs before public launch. *Dep:* T6.3, T6.5.3

---

> **Next step:** start **M0** at T0.1. Each task is sized to land in a single focused change with its acceptance check.
