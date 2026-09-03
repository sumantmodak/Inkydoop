# Inkydoop

Inkydoop is an AI-powered English Language Arts reading app. It generates illustrated stories for three reading tiers, then builds vocabulary practice and comprehension questions from each finished story.

The application is anonymous and story-first. Readers can open the latest story for their reading tier, browse previously generated packs, practice vocabulary, review comprehension questions, and print a teacher worksheet with an answer key.

See [roadmap.md](roadmap.md) for planned discovery, retention, sharing, trust, analytics, performance, and accessibility work. See [google-auth-user-design.md](google-auth-user-design.md) for the proposed adult Google sign-in, user, reader-profile, and synchronized-progress architecture.

## Current Status

The implemented application includes:

- Tier-aware story generation with corrective validation retries.
- One combined AI call for vocabulary and comprehension materials.
- Up to three non-blocking story illustrations.
- An archive of append-only story packs.
- Inline word definitions with story vocabulary and dictionary lookup fallback.
- A scored, client-side multiple-choice vocabulary exercise.
- Manual comprehension self-review with answer and explanation reveal.
- A printable teacher pack with an answer key.
- A key-protected admin generation page and API.
- A human moderation gate that keeps generated stories and images private until approval.
- A story-first landing page with recent stories, genre discovery, sharing, direct learning actions, and a teacher entry point.
- Immersive full-width story covers and inline scene illustrations that preserve their complete composition, with a constrained reading column.
- Persisted generation telemetry covering provider calls, costs, retries, validation, timings, and image outputs.
- Light and dark themes.
- Azure Table and Blob Storage support, with Azurite for local development.
- A server-side grading API that is implemented but not used by the current quiz UI.

## Technology

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Zod 4
- OpenRouter for text and image model requests
- Azure Table Storage for story packs
- Azure Blob Storage for story images
- Azure Identity for production storage authentication
- Azurite for local storage emulation
- Vitest for unit tests
- Playwright configured for browser tests

The project uses Node.js 22 or newer and pnpm.

## Reader Experience

### Home

The home page resolves the most recently generated pack for the saved reading tier and presents it in an editorial featured-story hero. It displays:

- Cover art, a spoiler-free hook, tier, genre, theme, reading time, vocabulary count, and question count.
- A truthful publication label for today's story, yesterday's story, older stories, and sample content.
- Exact links to read the story, practice its vocabulary, and review its questions.
- A dominant reading action with compact native sharing and device-local Save controls.
- A spoiler-free preview of the first three vocabulary words with a link to the full activity.
- An image-backed, tier-filtered shelf of recently added stories with stable book-cover dimensions, tier badges, reading times, and recent-publication labels.
- A `Surprise me` command that opens a random approved story for the saved reading tier.
- Genre shortcuts that open filtered Story Library views.
- Up to six themes derived from approved stories for the saved reading tier. The section appears only when at least three distinct themes are available.
- A teacher-focused entry point for printable packs.
- An adult trust strip describing publication review, anonymous reader access, and printable learning packs.
- The reading-level selector, Story Library link, and persisted theme toggle.

The landing sections alternate restrained background bands and unframed layouts to distinguish story discovery, the reading path, genre browsing, and grown-up actions without stacking decorative cards.

If no matching tier exists, the app tries the latest pack from any tier. If storage is unavailable or contains no packs, it displays the bundled sample pack.

The Save control stores at most 100 immutable pack IDs in browser local storage. It does not require an account or send favorites to the server. Saved-story shelves and Save controls outside the featured hero are not implemented yet.

### Story

The story page displays:

- An immersive cover with the title, hook, genre, theme, and estimated reading time. The complete illustration is contained over a soft full-frame backdrop rather than cropped.
- Story paragraphs constrained to a comfortable reading width.
- Large scene illustrations that preserve the full image while expanding to the story canvas and remaining inline with their configured paragraphs.
- Tap-a-word definitions.
- Story-generation, learning, and illustration model IDs when generation metadata is available.
- Links to the vocabulary activity and printable teacher pack.

Generated vocabulary words are highlighted and use definitions stored in the pack. Other clicked words are looked up through `dictionaryapi.dev`.

### Vocabulary

The vocabulary page lists each selected word with:

- Part of speech.
- Kid-friendly definition.
- A verbatim example from the story.
- Synonyms and antonyms when available.

It also creates a local multiple-choice definition exercise. Answers are scored in the browser and can be replayed without an API request.

### Comprehension

The comprehension page supports multiple-choice and free-text responses. Readers can reveal the stored answer and explanation for manual comparison.

The current UI does not automatically grade, score, or submit comprehension answers.

### Story Library

The Story Library loads pack metadata without loading complete story JSON. It displays stories newest-first with:

- Cover image or fallback art.
- Reading tier.
- Genre and theme.
- Reading time and generation date.
- A link to the exact pack by immutable ID.

The first 12 results are server-rendered. Additional pages load through a continuation cursor. The optional `genre` and `theme` query parameters filter both the initial result and subsequent pages.

### Teacher Pack

`/print/[id]` renders a print-oriented worksheet containing:

- Story text.
- Vocabulary definitions and examples.
- Comprehension questions.
- A separate answer-key section.

The Print button opens the browser print dialog, which can print the worksheet or save it as a PDF.

### Admin Operations and Moderation

`/admin` provides a key-protected workspace for generation and publication review.

- Choose a date and reading tier and generate a new pack.
- Choose Environment defaults, Economy, Balanced, Quality, or a Custom allowlisted story/learning/image model combination.
- Review pending, approved, or rejected queues.
- Read the complete story and inspect every illustration.
- Check vocabulary, comprehension questions, answer key, story/art-direction metadata, and the complete generation audit record.
- Inspect versions, random selection, models, tokens, costs, retries, validation attempts, step timings, every provider call, and every image result.
- Expand the raw normalized generation JSON when exact field-level inspection is needed.
- Add an optional review note.
- Approve and publish or reject the pack.
- Repopulate the generation form from an existing pack with `Generate another with same models`.

Every successful generation creates a private `pending` pack. Existing packs are not overwritten. Approval publishes the story, learning pages, print view, library metadata, and images together. Rejection keeps them private.

## Reading Tiers

Tier configuration lives in `src/lib/gen/tiers.ts`.

| ID        | Label   | Grade guidance | Lexile guidance | Target words | Accepted words | FK grade range |
| --------- | ------- | -------------- | --------------- | -----------: | -------------: | -------------: |
| `early`   | Early   | K-2            | 200-500         |          450 |        300-650 |        0.5-2.9 |
| `growing` | Growing | 3-6            | 500-850         |        1,000 |      700-1,300 |        2.0-6.5 |
| `middle`  | Middle  | 6-8            | 800-1050        |        1,200 |    1,000-1,500 |        6.0-9.0 |

`growing` is the default. The selected tier is stored in a one-year `tier` cookie so server-rendered pages can resolve the appropriate pack.

## Application Routes

| Route                      | Behavior                                                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/`                        | Featured story, vocabulary preview, recent shelf, genre/theme discovery, teacher actions, trust strip, and reader controls. |
| `/story?id=<pack-id>`      | Exact story pack when `id` is present; otherwise the latest resolved pack.                                                  |
| `/vocabulary?id=<pack-id>` | Vocabulary list and local multiple-choice activity for the resolved pack.                                                   |
| `/quiz?id=<pack-id>`       | Manual comprehension response and answer-reveal UI.                                                                         |
| `/library?genre=<genre>`   | Newest-first, metadata-only archive with optional genre filtering and cursor pagination.                                    |
| `/library?theme=<theme>`   | Newest-first, metadata-only archive with optional theme filtering and cursor pagination.                                    |
| `/print/[id]`              | Print-oriented story, vocabulary, questions, and answer key.                                                                |
| `/admin`                   | Key-protected generation and human moderation workspace.                                                                    |

All reader pages are dynamically rendered because they resolve current storage and cookie state.

## API Routes

### `POST /api/generate`

`GET` is also mapped to the same handler for manual operation.

Authentication:

- `x-generate-key` request header, preferred.
- `key` query parameter, also accepted.
- Compared with `GENERATE_API_KEY` using a constant-time comparison.

Query parameters:

| Name   | Required | Description                                                  |
| ------ | -------- | ------------------------------------------------------------ |
| `date` | No       | Pack date in `YYYY-MM-DD`; defaults to the current UTC date. |
| `tier` | No       | `early`, `growing`, or `middle`; defaults to `growing`.      |

Optional JSON body:

```json
{
  "models": {
    "story": "z-ai/glm-5.2",
    "learning": "deepseek/deepseek-v4-flash",
    "image": "google/gemini-2.5-flash-image"
  }
}
```

Omitting `models` uses the server environment defaults. Every supplied model must be in the server-side allowlist for its category; arbitrary, category-mismatched, partial, and unknown-field requests return `400` before generation starts.

The endpoint is limited to five requests per minute per client IP within each running process.

Successful response:

```json
{
  "ok": true,
  "id": "<pack-id>",
  "date": "2026-09-01",
  "tier": "growing",
  "generated": true,
  "moderationStatus": "pending",
  "durationMs": 12345,
  "metadata": {
    "models": {
      "story": "<story-model>",
      "learning": "<learning-model>",
      "image": "<image-model>"
    },
    "tokens": { "prompt": 1000, "completion": 2500, "total": 3500 },
    "costUsd": 0.12,
    "costs": { "textUsd": 0.01, "imagesUsd": 0.11, "totalUsd": 0.12 },
    "retries": { "story": 0, "learning": 1, "invalidJson": 0 },
    "images": {
      "requested": 3,
      "succeeded": 3,
      "failed": 0,
      "totalBytes": 450000
    }
  }
}
```

### `GET /api/stories`

Returns metadata-only archive pages containing approved and legacy-public packs only.

Query parameters:

| Name     | Required | Description                                                   |
| -------- | -------- | ------------------------------------------------------------- |
| `limit`  | No       | Page size; defaults to 12 and is capped at 50.                |
| `cursor` | No       | Azure Table continuation token returned by the previous page. |
| `tier`   | No       | Optional exact tier filter.                                   |
| `genre`  | No       | Optional lowercase genre filter, such as `mystery`.           |
| `theme`  | No       | Optional exact theme filter, such as `Starting over`.         |

The endpoint is limited to 60 requests per minute per client IP within each running process. If storage is unavailable, it returns an empty `items` array.

```json
{
  "items": [],
  "nextCursor": "<optional-continuation-token>"
}
```

### `GET /api/image`

Streams an approved pack image from Blob Storage.

- Requires a validated `path` query parameter ending in `.webp`, `.png`, or `.jpeg`.
- Rejects traversal paths.
- Returns `404` for pending and rejected pack images.
- Returns one-day public immutable caching headers.
- Returns `404` when the blob does not exist.

### `GET /api/admin/moderation`

Requires `x-generate-key`.

- Without `id`, lists moderation summaries filtered by `status=pending|approved|rejected`; defaults to `pending`.
- With `id=<pack-id>`, returns the complete pack and moderation record for private review.

### `POST /api/admin/moderation`

Requires `x-generate-key` and records an approval or rejection without rewriting story content.

```json
{
  "id": "<pack-id>",
  "action": "approve",
  "note": "Optional review note"
}
```

### `GET /api/admin/moderation/image`

Requires `x-generate-key` and streams pending, approved, or rejected images for the moderation workspace with private, no-store caching.

### `GET /api/dev/story`

Generates a story draft for inspection without assembling or storing a complete pack.

- Accepts optional `date` and `tier` query parameters.
- Available only outside production.
- Returns `404` when `NODE_ENV=production`.

### `POST /api/grade`

Grades one comprehension answer through the implemented grading pipeline. The current reader UI does not call this endpoint.

Request body:

```json
{
  "id": "<optional-pack-id>",
  "questionId": "q1",
  "answer": "A reader response"
}
```

- `answer` is limited to 1,000 characters.
- Requests are limited to 20 per minute per client IP within each running process.
- The pack is resolved by ID or through the normal latest/sample fallback.

Response:

```json
{
  "grade": "nailed_it",
  "feedback": "Great job!",
  "graderAgreement": true,
  "judged": false
}
```

## Content Generation

Generation runs only through `/api/generate` or the admin page. Reader requests never generate or mutate packs. Generated packs remain pending until an admin decision changes their publication state.

```mermaid
flowchart TD
  Request[Authorized generation request] --> Selection[Random genre and theme selection]
  Selection --> Story[Generate story and image specs]
    Story --> StoryValidation[Validate and retry story]
    StoryValidation --> Learning[Generate vocabulary and questions together]
    Learning --> LearningValidation[Filter and validate learning materials]
    LearningValidation --> Images[Render images concurrently]
    Images --> Assemble[Assemble and safety-check DailyPack]
    Assemble --> Pending[Insert private pending pack]
    Images --> Blob[Upload successful images to Blob Storage]
    Pending --> Review[Human review]
    Review -->|Approve| Public[Public story, library, learning, print, and images]
    Review -->|Reject| Private[Keep story and images private]
```

### 1. Story Selection

`createStorySeed()` independently selects a fresh genre and theme for every generation run from broad, age-appropriate pools spanning mystery, fantasy, science, travel, family, school, arts, nature, character growth, relationships, and community.

The requested date does not control the selection. Generating another tier or another story for the same date receives a new random combination. The chosen genre, theme, and tier are stored in generation metadata as `selection` so each resulting pack remains traceable.

### 2. Story Draft

`generateStory()` calls the resolved story model with the selected genre, theme, tier limits, writing guidance, and illustration requirements.

The expected output contains:

- Title, spoiler-free preview hook, genre, and theme.
- Story paragraphs.
- Candidate vocabulary.
- Art direction and character descriptions.
- One cover and scene image specifications.

Story validation checks:

- Tier word-count bounds.
- Tier Flesch-Kincaid grade range.
- Banned safety terms.
- Exactly one cover image specification.
- At least one scene image specification.

The story receives up to three attempts: one initial generation and two corrective retries. If the story omits image specifications, `OPENROUTER_MODEL_LEARNING` regenerates only those specifications without rewriting the story.

### 3. Learning Materials

After the story passes validation, `generateLearningMaterials()` sends the finalized story once to `OPENROUTER_MODEL_LEARNING`. The call returns vocabulary and comprehension questions together.

The raw response must contain 5-10 vocabulary items and 5-8 questions. Local validation then checks every item. If fewer than five valid vocabulary items or questions survive, the model receives the rejected counts and corrective requirements and retries. After three deficient attempts, generation fails before the pack is persisted.

Vocabulary filtering:

- Removes duplicate words case-insensitively.
- Requires each example to occur in the story.
- Limits definitions to 140 characters.
- Keeps at most 10 words.

Question filtering:

- Removes duplicate IDs.
- Requires at least one `mustInclude` rubric item.
- Requires a multiple-choice answer to appear in its choices.
- Requires at least five valid questions after filtering.

### 4. Illustrations

`renderImages()` requests all image specifications concurrently through OpenRouter's dedicated Image API using the resolved image model and `IMAGE_API_KEY`.

- Requests specify a 16:9 landscape aspect ratio and prefer WebP output.
- The prompt combines shared art direction, setting, character descriptions, scene instructions, landscape composition guidance, and kid-safe constraints.
- Returned PNG, JPEG, and WebP bytes are detected from their file signatures rather than trusting response metadata.
- Successful bytes are uploaded to `<pack-id>/cover.<ext>` or `<pack-id>/scene-N.<ext>`.
- Individual image failures are logged and dropped; they do not prevent the text pack from being stored.

### 5. Assembly and Persistence

The pack is assembled with a reading-time estimate of 150 words per minute. A final banned-term pass checks the title, story text, and question text. If it passes, the new pack is inserted into Azure Table Storage.

## Grading Pipeline

The grading backend in `src/lib/grade` remains available for future use or direct API clients:

1. Route multiple-choice and short literal answers through local exact/fuzzy matching.
2. Screen open-ended text with `OPENROUTER_MODEL_GUARD`.
3. Run two graders using `OPENROUTER_MODEL_GRADER`.
4. Use `OPENROUTER_MODEL_JUDGE` when graders disagree or confidence is low.
5. Generate kind feedback with `OPENROUTER_MODEL_FEEDBACK`.

Grades are `nailed_it`, `almost`, or `lets_look_again`.

The current comprehension UI intentionally performs manual self-review and does not invoke this pipeline.

## Data Model

Zod schemas in `src/lib/schemas.ts` are the runtime and TypeScript source of truth.

```ts
interface DailyPack {
  date: string;
  tier: "early" | "growing" | "middle";
  story: {
    title: string;
    hook: string;
    genre: string;
    theme: string;
    paragraphs: string[];
    readingTimeMin: number;
    targetWords: string[];
    artDirection: {
      style: string;
      characters: { name: string; look: string }[];
      setting: string;
    };
    images: {
      role: "cover" | "scene";
      afterParagraph: number;
      alt: string;
      blobPath: string;
    }[];
  };
  vocabulary: {
    word: string;
    pos: string;
    definition: string;
    exampleFromStory: string;
    synonyms: string[];
    antonyms: string[];
  }[];
  questions: {
    id: string;
    type:
      "literal" | "inferential" | "vocabulary-in-context" | "theme" | "extra";
    question: string;
    answer: string;
    explanation: string;
    choices?: string[];
    rubric: {
      mustInclude: string[];
      niceToHave: string[];
      commonWrongPatterns: string[];
    };
  }[];
  generation?: GenerationMeta;
}
```

`generation` is optional only so packs created before telemetry was introduced remain readable. Every newly generated pack includes it. Packs written during the transition from deterministic seeds to random selections are normalized from the legacy `generation.seed` field to `generation.selection` when read.

`GenerationMeta` stores:

- Metadata schema version, success status, start/finish timestamps, total pre-persistence duration, application version, and prompt version.
- Randomly selected genre/theme/tier combination and requested story, learning, and image models.
- Every text-provider attempt with step, attempt number, requested/response model, provider, provider request ID, start time, duration, status, token counts, reported cost, and a sanitized error category.
- Rolled-up prompt, completion, and total tokens plus separate reported text, image, and total costs. The legacy `costUsd` total is retained for compatibility.
- Story, learning, image, and assembly durations.
- Story corrective retries, learning corrective retries, and invalid-JSON/schema retries.
- Final word count, Flesch-Kincaid reading grade, each story validation attempt and its issues, and valid vocabulary/question counts.
- Every requested image with role, success/failure, requested 16:9/WebP settings, explicit moderation status, provider/model/request ID, blob path, actual format, dimensions, byte size, duration, reported cost, and sanitized error category.

Provider IDs, provider names, actual response models, token usage, and costs are optional because OpenRouter or its upstream provider may omit them. Image moderation is currently recorded as `not_run` rather than implying a check occurred.

Cost fields represent provider-reported values. `costs.textUsd` sums every text attempt, including retry attempts; `costs.imagesUsd` sums every image response; and `costs.totalUsd` combines both. Packs created before the breakdown was introduced can have only `costUsd` and per-image item costs.

## Storage

### Azure Table Storage

All packs use `PartitionKey = "daily"`.

Each generation creates a unique sortable `RowKey` containing:

- Inverted date.
- Inverted generation timestamp.
- A short random suffix.

Ascending queries therefore return newer dates first and newer generations first within a date. Multiple packs can coexist for the same date and tier.

Each entity stores:

- Full validated pack JSON in `packJson`.
- Date, tier, and creation timestamp.
- Denormalized title, genre, theme, reading time, and cover path for archive queries.
- Denormalized generation schema/app/prompt versions, requested models, total tokens, separate text/image/total reported costs, duration, story/learning retries, and successful/failed image counts for operational queries.
- Moderation status, moderation timestamp, and optional moderation note.

Exact public story links enforce approval before returning a pack. Latest-pack and archive queries skip pending and rejected entities, project metadata only, and use Azure continuation tokens.

Archive queries can filter the denormalized `genre` column without loading `packJson`.

### Azure Blob Storage

Story images are stored in the configured container under paths namespaced by pack ID. The public `/api/image` route checks the parent pack's moderation state before returning bytes. The admin review workspace uses the authenticated moderation-image route.

### Authentication

- Local development uses `AZURE_STORAGE_CONNECTION_STRING` with Azurite.
- Production code uses `AZURE_STORAGE_ACCOUNT` with `DefaultAzureCredential`.

The repository does not currently contain production infrastructure or RBAC deployment definitions.

## Fallback Behavior

`getServedPack()` resolves content in this order:

1. Exact approved pack ID, when supplied and found.
2. Latest approved pack for the selected tier.
3. Latest approved pack from any tier.
4. Bundled sample pack.

Storage errors also fall through to the sample pack and are written to the server error log. The Story Library instead renders an empty result when storage is unavailable.

Rows created before moderation fields were introduced are treated as approved for backward compatibility. Unknown moderation values fail closed as pending.

## Environment Configuration

Copy `.env.example` to `.env.local`. Environment files are ignored by Git.

Required secrets:

| Variable             | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `OPENROUTER_API_KEY` | Text generation requests.                        |
| `IMAGE_API_KEY`      | Image generation requests through OpenRouter.    |
| `GENERATE_API_KEY`   | Protects `/api/generate`; minimum 32 characters. |

Model settings have defaults:

| Variable                    | Default                         |
| --------------------------- | ------------------------------- |
| `OPENROUTER_MODEL_STORY`    | `openai/gpt-5.5`                |
| `OPENROUTER_MODEL_LEARNING` | `openai/gpt-4o-mini`            |
| `OPENROUTER_MODEL_GUARD`    | `openai/gpt-4o-mini`            |
| `OPENROUTER_MODEL_FEEDBACK` | `openai/gpt-4o-mini`            |
| `OPENROUTER_MODEL_GRADER`   | `openai/gpt-4o-mini`            |
| `OPENROUTER_MODEL_JUDGE`    | `openai/gpt-4o`                 |
| `IMAGE_MODEL`               | `google/gemini-2.5-flash-image` |
| `APP_VERSION`               | `development`                   |

### Generation Model Registry

`src/lib/generation-models.ts` is the server-enforced catalog used by the admin generation form. It contains:

- `STORY_MODELS`, `LEARNING_MODELS`, and `IMAGE_MODELS` category allowlists.
- Display labels, intended profiles, and relative cost indicators.
- Economy, Balanced, and Quality presets.
- The Zod schema that rejects arbitrary or category-mismatched overrides.

The current catalog includes `z-ai/glm-5.3` for stories, `z-ai/glm-5.3-flash` for learning materials, and `microsoft/mai-image-2.5` for 16:9 image generation. As of September 2026, OpenRouter does not publish routable `z-ai/glm-latest` or `z-ai/glm-flash-latest` IDs, so the catalog uses the current concrete GLM versions rather than broken aliases.

To add a selectable model:

1. Add it to exactly the categories it supports.
2. Verify structured JSON output for story or learning models.
3. Verify Image API, 16:9 aspect ratio, and output-format support for image models.
4. Add or update presets only after the model passes generation and moderation review.
5. Ensure every environment-default model also appears in its category allowlist.

The route resolves defaults once, then explicitly passes the selected model set through story, learning, and image generation. Stored telemetry records the requested set and each actual provider response model.

Storage settings:

| Variable                          | Required                  | Default        |
| --------------------------------- | ------------------------- | -------------- |
| `AZURE_STORAGE_CONNECTION_STRING` | One storage mode required | None           |
| `AZURE_STORAGE_ACCOUNT`           | One storage mode required | None           |
| `AZURE_TABLE_NAME`                | No                        | `DailyPacks`   |
| `AZURE_BLOB_CONTAINER`            | No                        | `story-images` |

At least one of `AZURE_STORAGE_CONNECTION_STRING` or `AZURE_STORAGE_ACCOUNT` must be set. Configuration is validated with Zod on first server-side environment access.

Never commit `.env.local`, API keys, or generation keys. Rotate any key that has been exposed outside its intended secret store.

## Local Development

Prerequisites:

- Node.js 22 or newer.
- pnpm 10.

Install dependencies:

```powershell
pnpm install
```

Create local configuration:

```powershell
Copy-Item .env.example .env.local
```

Fill in the required secrets, then start Azurite in one terminal:

```powershell
pnpm dev:storage
```

Start Next.js in another terminal:

```powershell
pnpm dev
```

Open `http://localhost:3000`.

Generate a pack from `http://localhost:3000/admin`, or call the API:

```powershell
$headers = @{ "x-generate-key" = "<your-generate-key>" }
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/generate?date=2026-09-01&tier=growing" `
  -Headers $headers
```

## Scripts

| Command            | Purpose                                   |
| ------------------ | ----------------------------------------- |
| `pnpm dev`         | Start the Next.js development server.     |
| `pnpm dev:storage` | Start Azurite for Table and Blob Storage. |
| `pnpm lint`        | Run ESLint.                               |
| `pnpm test`        | Run Vitest once.                          |
| `pnpm test:e2e`    | Run Playwright tests.                     |
| `pnpm build`       | Create a production build.                |
| `pnpm start`       | Run the built Next.js server.             |
| `pnpm format`      | Format the repository with Prettier.      |

## Tests and CI

Unit tests cover:

- Zod pack schemas.
- Random genre and theme selection.
- Story validators and readability checks.
- Combined learning-material orchestration.
- Vocabulary and question filtering.
- Local grading routing.
- Table metadata and pagination helpers.

GitHub Actions runs the following on pull requests and pushes to `main`:

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm test
pnpm build
```

Playwright is configured in `playwright.config.ts`, but the repository currently has no browser test files. `pnpm test:e2e` therefore reports that no tests were found.

## Project Structure

```text
src/
  app/                 Next.js pages and API route handlers
  components/          Interactive reader, library, quiz, and theme UI
  lib/
    ai/                 OpenRouter JSON client
    gen/                Seed, tiers, story, learning, images, validation, assembly
    grade/              Optional answer-grading pipeline
    store/              Azure Table/Blob access and read fallback
    env.ts              Server-only validated environment access
    fallback.ts         Bundled sample pack
    prompts.ts          Model instructions
    schemas.ts          Shared Zod schemas and inferred types
```

## Current Operational Limitations

- Image responses are not moderated after generation.
- Moderation uses the shared generation key and does not record an individual reviewer identity because accounts are not implemented.
- Image generation and storage costs occur before human approval. Rejecting a pack does not currently delete its blobs.
- WebP is requested, but providers can return PNG or JPEG; those formats are stored as received. There is no local conversion or byte-size limit.
- Content safety uses prompt constraints and a small banned-term filter, not a dedicated moderation service.
- Generation is a synchronous HTTP operation and can take several minutes.
- Rate limiting is in-memory and applies per running process, not across replicas.
- Reader fallback does not expose freshness metadata or distinguish an older pack from the current date in the UI.
- Storage failures can be hidden by the bundled sample fallback.
- The grading API is not connected to the comprehension UI.
- There are no Playwright tests yet.
- There are no Docker, Bicep, Terraform, `azd`, or deployment workflow files.
- Completely failed generation runs are not persisted because no story pack exists to attach them to. Failed provider attempts are retained when a later retry succeeds and the pack is stored.
- The application has no accounts or server-side reader progress.

These limitations describe the current repository state; they are not implemented features.
