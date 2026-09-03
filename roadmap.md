# Inkydoop Product Roadmap

This roadmap defines the next product work for improving discovery, return visits, trust, and sharing around Inkydoop's anonymous reading experience.

It describes proposed work, not current behavior. See [README.md](README.md) for the implemented application. See [google-auth-user-design.md](google-auth-user-design.md) for the detailed adult Google sign-in and user-system design.

## Product Principles

- Keep the first screen focused on reading, not product marketing.
- Preserve anonymous access for children.
- Prefer device-local state until accounts have a demonstrated need.
- Publish only human-approved stories and images.
- Do not collect child names, ages, answer text, or behavioral profiles.
- Keep the featured story visually dominant.
- Render sections only when they contain useful content.
- Build simple metadata-based discovery before personalized recommendations.
- Measure aggregate product behavior without fingerprinting readers.

## Current Baseline

The landing page currently provides:

- An approved featured story with cover, hook, tier, genre, theme, and reading time.
- Truthful publication freshness plus vocabulary and question counts in the featured hero.
- Exact links to the story, vocabulary activity, and comprehension review.
- Compact Share and device-local Save actions in the hero, with Print in the teacher section.
- A tier-filtered Recently Added shelf when matching stories exist.
- Hardcoded genre shortcuts.
- A three-step reading path.
- A teacher print entry point.
- Persisted reading-tier and theme controls.

The roadmap builds on this baseline rather than replacing it.

## Milestone Overview

| Milestone | Theme                          | Primary outcome                                                                         |
| --------- | ------------------------------ | --------------------------------------------------------------------------------------- |
| R1        | Publication clarity            | Readers understand whether content is current, older, or sample content.                |
| R2        | Reliable discovery             | The landing page always offers useful approved stories and valid genre destinations.    |
| R3        | Anonymous continuity           | Returning readers can continue and revisit stories without accounts.                    |
| R4        | Sharing and stable URLs        | Stories are reliably shareable and understandable in link previews.                     |
| R5        | Adult trust                    | Parents and teachers can understand moderation, privacy, and classroom use.             |
| R6        | Privacy-preserving measurement | Product decisions can be based on aggregate funnel behavior.                            |
| R7        | Performance and accessibility  | The richer landing experience remains fast, responsive, and inclusive.                  |
| R8        | Model experimentation          | Admins can compare model quality, reliability, speed, and cost under controlled inputs. |

---

## R1: Publication Clarity

### R1.1 Freshness And Publication Labels

**Status:** Landing-page helper, rendering, and unit coverage are complete. Story-page rendering and machine-readable publication metadata remain.

#### Goal

Make it immediately clear whether the featured pack is today's approved story, an older approved story, or bundled sample content.

#### Requirements

- Introduce a shared presentation helper that derives one of these labels:
  - `Today's story`
  - `Published yesterday`
  - `Published <formatted date>`
  - `Sample story`
- Use the stored pack date for content dating.
- Use `isSample` from `getServedPack()` for sample detection.
- Never label a pending or rejected pack because those states must not reach public readers.
- Display the label on the landing-page hero and story page.
- Use locale-friendly visible dates while retaining ISO dates in machine-readable metadata.
- Avoid implying that an older fallback story was generated today.

#### Acceptance Criteria

- A stored approved pack dated today displays `Today's story`.
- Yesterday's approved pack displays `Published yesterday`.
- Older approved packs display a human-readable publication date.
- The bundled fallback displays `Sample story`.
- Unit tests cover today, yesterday, older dates, invalid dates, and sample content.
- Labels render consistently on desktop and mobile.

#### Expected Outcomes

- Fewer readers mistake fallback content for new content.
- Moderation delays are represented honestly.
- Operators can verify publication freshness from the public UI.

### R1.2 Featured Story Content Counts

**Status:** Complete on the featured-story hero. Responsive browser verification remains part of R7.

#### Goal

Set expectations about the complete learning experience before a reader opens the story.

#### Requirements

- Display compact counts for:
  - Vocabulary items.
  - Comprehension questions.
  - Story reading time.
- Derive counts from the resolved pack; do not denormalize them solely for this feature.
- Use concise labels such as `7 words` and `6 questions`.
- Keep counts secondary to the story title and hook.
- Hide a count only if the corresponding collection is empty in legacy content.

#### Acceptance Criteria

- Counts match the exact pack linked by the featured-story actions.
- Singular and plural labels are correct.
- Long titles and hooks do not collide with the counts.
- Counts fit at 320px viewport width.

#### Expected Outcomes

- Readers and adults understand that each story includes learning activities.
- Vocabulary and comprehension entry rates can improve through clearer expectations.

---

## R2: Reliable Discovery

### R2.1 Recently Added Cross-Tier Fallback

#### Goal

Keep Recently Added useful when the selected tier has too few approved stories.

#### Requirements

- Request recent approved stories for the selected tier first.
- Exclude the featured pack.
- If fewer than six items remain, fill the shelf with approved stories from other tiers.
- Deduplicate by immutable pack ID.
- Preserve newest-first ordering within the final shelf.
- Display a visible tier badge on every card.
- Keep the shelf hidden only when no additional approved stories exist at all.
- Do not include pending or rejected packs.
- Keep the shelf metadata-only; do not load `packJson` for every card.

#### Acceptance Criteria

- Six items display when six approved alternatives exist across tiers.
- Selected-tier stories are preferred.
- Cross-tier items are clearly labeled.
- The featured pack never appears in the shelf.
- Pending and rejected packs never appear.
- The shelf remains horizontally scrollable without page overflow on mobile.

#### Expected Outcomes

- Fewer empty or sparse landing pages.
- Better archive discovery.
- More exploration across reading levels without changing the reader's saved tier.

### R2.2 Dynamic Genre Destinations

#### Goal

Replace hardcoded genre shortcuts with useful destinations backed by approved content.

#### Requirements

- Add a metadata-only genre aggregation query over approved packs.
- Return genre name, approved story count, latest pack ID, latest cover path, and latest publication date.
- Normalize display capitalization without changing the stored filter value.
- Order destinations by a defined strategy:
  1. Recently active genres.
  2. Story count as a tie-breaker.
- Display up to six destinations on the landing page.
- Use the latest approved cover for the top three destinations.
- Link each destination to `/library?genre=<exact-stored-value>`.
- Do not display genres with zero approved stories.
- Preserve a plain text/pill treatment when a cover is unavailable.

#### Acceptance Criteria

- Every displayed genre link returns at least one approved story.
- Values containing spaces, slashes, parentheses, or hyphens are safely encoded and validated.
- New generated genres can appear without editing the landing page.
- Rejected and pending stories do not influence counts or covers.
- Aggregation does not deserialize full packs.

#### Expected Outcomes

- No dead-end genre links.
- Discovery automatically reflects the real catalog.
- New genre additions become visible without frontend deployments.

### R2.3 Genre And Tier Library Controls

#### Goal

Make archive exploration efficient after a reader enters through a genre or recent-story link.

#### Requirements

- Add visible genre and tier filters to the Story Library.
- Initialize controls from URL query parameters.
- Keep filters in the URL so views are shareable and browser navigation works.
- Preserve filters while loading continuation pages.
- Provide a single clear-all action.
- Show active filters above results.
- Use exact server-side metadata filters rather than filtering only the loaded page.
- Show an informative empty state for combinations with no approved stories.

#### Acceptance Criteria

- Refreshing a filtered library preserves the same result set.
- Back and forward navigation restores filter state.
- Pagination returns only matching approved packs.
- Clearing filters returns to the full approved archive.
- Controls are keyboard accessible and fit on mobile.

#### Expected Outcomes

- Faster story discovery.
- More meaningful genre shortcuts.
- A scalable archive experience as the catalog grows.

---

## R3: Anonymous Continuity

### R3.1 Continue Reading

#### Goal

Let a returning reader resume the last story without creating an account.

#### Requirements

- Store only these values in local browser storage:
  - Pack ID.
  - Last meaningful paragraph index.
  - Last-opened timestamp.
  - Completion state.
- Update progress when the reader reaches a paragraph, with throttling to avoid excessive writes.
- Never store paragraph text, clicked words, answers, or inferred reading ability.
- Add a Continue Reading band above Recently Added when valid local progress exists.
- Display cover, title, tier, and approximate progress.
- Link to the exact immutable pack ID and paragraph anchor.
- If the pack is no longer public, remove the local record and hide the section.
- Change the featured-story command when applicable:
  - `Read story` for untouched content.
  - `Continue reading` for incomplete content.
  - `Read again` for completed content.
- Mark a story completed when the reader reaches the end or enters the vocabulary activity.

#### Data Shape

```ts
interface LocalReadingProgress {
  packId: string;
  paragraphIndex: number;
  openedAt: string;
  completed: boolean;
}
```

#### Acceptance Criteria

- Closing and reopening the browser restores the latest valid story position.
- Continue Reading opens the exact pack and scrolls to the recorded paragraph.
- Progress works without authentication or network writes.
- Missing, rejected, or unpublished packs are removed from local progress.
- Private browsing/storage failures do not break reading.
- Screen readers receive a clear progress description.

#### Expected Outcomes

- Higher return-session completion.
- Lower friction for longer stories.
- Useful personalization without child accounts.

### R3.2 Device-Local Favorites

**Status:** The featured hero can save and remove up to 100 pack IDs on device. Story/library controls, approved-pack resolution, and the Saved Stories shelf remain.

#### Goal

Allow readers to build a personal story shelf without server-side profiles.

#### Requirements

- Add a familiar bookmark icon to story and library actions.
- Provide a tooltip and accessible label: `Save story` / `Remove saved story`.
- Store only immutable pack IDs in local storage.
- Limit storage to a reasonable maximum, such as 100 IDs.
- Add a Saved Stories shelf to the landing page when at least one saved approved pack resolves.
- Preserve saved order by most recently saved.
- Remove unavailable or no-longer-public packs during resolution.
- Avoid hearts, public counts, social comparison, or follower mechanics.

#### Data Shape

```ts
interface LocalFavorites {
  version: 1;
  packIds: string[];
}
```

#### Acceptance Criteria

- Saving and removing works from story and library views.
- The Saved Stories shelf appears only when it has valid content.
- Favorites survive reloads on the same device.
- No server-side user record is created.
- The feature degrades safely when local storage is unavailable.

#### Expected Outcomes

- More repeat reading.
- Better archive retention.
- A foundation for understanding voluntary content preference without tracking children remotely.

### R3.3 Personal Reading Shelf Composition

#### Goal

Keep personalized sections useful without overwhelming first-time readers.

#### Requirements

- Order landing content as:
  1. Featured story.
  2. Continue Reading, when available.
  3. Recently Added.
  4. Saved Stories, when available.
  5. Reading path.
  6. Genre discovery.
  7. Teacher section.
- Never render empty personalized sections.
- Do not nest shelves in decorative cards.
- Reuse a consistent story-cover item with stable dimensions.
- Keep the featured story as the strongest first-viewport signal.

#### Acceptance Criteria

- First-time readers see no empty Continue or Saved sections.
- Returning readers see the appropriate personalized shelves.
- Dynamic sections do not cause unexpected layout shifts after hydration.
- Desktop and mobile section order remains coherent.

#### Expected Outcomes

- A landing page that adapts naturally to reader history.
- Less visual clutter for new visitors.
- Stronger habit formation for returning readers.

---

## R4: Sharing And Stable URLs

### R4.1 Stable Story Routes

#### Goal

Replace query-only story URLs with canonical, durable routes that include a readable story-title slug without sacrificing immutable lookup.

#### Requirements

- Add these public routes:
  - `/stories/[id]/[slug]`
  - `/stories/[id]/[slug]/vocabulary`
  - `/stories/[id]/[slug]/quiz`
  - `/stories/[id]/[slug]/print`
- Use the immutable Table RowKey as the authoritative lookup key.
- Use the title slug only for readability, sharing, and search-engine context; never use it as the database key.
- Generate slugs with one shared helper that:
  - Applies Unicode `NFKD` normalization.
  - Converts the title to lowercase.
  - Removes combining marks.
  - Replaces non-alphanumeric runs with one hyphen.
  - Trims leading and trailing hyphens.
  - Caps the slug at a stable maximum length without leaving a trailing hyphen.
  - Falls back to `story` when no ASCII letters or numbers remain.
- Derive the expected slug from the approved pack title at request time; storing a second slug field is not required initially.
- If the supplied slug differs from the expected slug, issue a permanent redirect to the current canonical URL.
- Allow duplicate story titles because the immutable pack ID keeps their URLs distinct.
- A title changed during moderation receives a new canonical slug; requests using the previous slug redirect to the updated URL.
- Keep existing query routes temporarily and redirect approved IDs to canonical routes.
- Redirect `/stories/[id]` to `/stories/[id]/[current-slug]` for short ID-only links.
- Enforce moderation approval on every canonical route.
- Return a true not-found response for unknown, pending, or rejected pack IDs instead of silently resolving another story.
- Update internal links, sharing, library cards, Continue Reading, and favorites.
- Emit the full ID-plus-slug URL in canonical, Open Graph, sitemap, and sharing metadata.
- Keep child routes tied to the exact same approved pack ID and normalized slug.

#### Acceptance Criteria

- Every approved pack has one canonical story URL in the form `/stories/<id>/<title-slug>`.
- Old links redirect without losing the pack ID.
- Missing, stale, malformed, and incorrectly cased slugs redirect to the normalized canonical URL.
- Two packs with the same title resolve to distinct canonical URLs.
- Titles containing punctuation, repeated spaces, diacritics, symbols, or only non-ASCII characters produce safe non-empty routes.
- A moderated title change leaves previous links functional through canonical redirection.
- Private pack IDs return `404` publicly.
- Vocabulary, quiz, and print routes retain the same pack ID and canonical slug.
- Search engines do not index duplicate query routes.
- Unit tests cover slug normalization, truncation, empty fallback, duplicate titles, and canonical redirect behavior.

#### Expected Outcomes

- More reliable sharing.
- Human-readable links that communicate the story title before opening the page.
- Better search indexing.
- Elimination of accidental fallback when a shared ID is invalid.

### R4.2 Story Link Previews

#### Goal

Make shared story links recognizable and appealing in messaging and social previews.

#### Requirements

- Generate per-story metadata from approved pack fields:
  - Page title.
  - Spoiler-free description from `hook`.
  - Canonical URL.
  - Open Graph title, description, image, and type.
  - Twitter/X card metadata where supported.
- Use the approved cover image through a public, cacheable route.
- Provide a generic Inkydoop image when a story has no approved cover.
- Never expose pending/rejected images through metadata generation.
- Include tier and reading time in supporting preview copy, not the title.

#### Acceptance Criteria

- Approved story HTML contains complete canonical and Open Graph metadata.
- Pending/rejected IDs return no story metadata.
- Link-preview validators can retrieve the cover without authentication.
- Missing-cover stories still produce a valid preview.

#### Expected Outcomes

- Higher confidence and click-through from shared links.
- Clearer story identity outside the application.
- Better organic distribution.

### R4.3 Refined Share Control

#### Goal

Keep sharing available without competing with the primary reading command.

#### Requirements

- Use an icon command with an accessible tooltip.
- Prefer the Web Share API where supported.
- Fall back to copying the canonical URL.
- Show temporary `Link copied` feedback.
- Share only approved canonical story URLs.
- Move share behavior into a reusable component used by landing and story views.
- Do not include referral codes, child identifiers, or tracking parameters in shared URLs.

#### Acceptance Criteria

- Native sharing works on supported mobile devices.
- Clipboard fallback works on desktop.
- Keyboard and screen-reader users receive feedback.
- Shared URL always resolves the exact approved story.

#### Expected Outcomes

- Cleaner featured-story hierarchy.
- More reliable organic sharing.
- No privacy-sensitive information in shared links.

---

## R5: Adult Trust And Teacher Experience

### R5.1 Parent And Teacher Information

#### Goal

Give adults a clear explanation of the product without turning the reader landing page into marketing content.

#### Requirements

- Add `/parents` and `/teachers` pages.
- Parent content must explain:
  - Intended reading tiers.
  - What AI generates.
  - Human approval before publication.
  - What data is and is not collected.
  - How to report unsuitable content.
- Teacher content must explain:
  - Printable pack contents.
  - How tiers map to classroom use.
  - The limits of automated reading-level measurements.
  - Appropriate review before classroom distribution.
- Keep language plain and factual.
- Link both pages from a quiet adult-oriented footer.
- Do not put operational explanations in the child-facing hero.

#### Acceptance Criteria

- Moderation and privacy claims match implemented behavior.
- Pages are readable without authentication.
- Adult links are discoverable but visually secondary to reading.
- Content is reviewed whenever data collection or moderation behavior changes.

#### Expected Outcomes

- Greater parent and teacher confidence.
- Fewer support questions about AI and privacy.
- More informed classroom use.

### R5.2 Moderation Trust Indicator

#### Goal

Communicate that public stories passed human review without adding technical language to the reading flow.

#### Requirements

- Add a restrained `Reviewed before publishing` indicator in the teacher/adult area.
- Link the indicator to the parent information page.
- Show it only for stored approved packs.
- Do not show moderator identity or internal notes publicly.
- Do not imply professional editorial, pedagogical, or legal certification.

#### Acceptance Criteria

- Pending and rejected packs can never display the indicator publicly.
- Sample content uses separate wording if shown.
- The indicator remains secondary to story actions.

#### Expected Outcomes

- Clearer safety posture.
- Increased adult trust without interrupting children.

### R5.3 Content Reporting

#### Goal

Let adults report unsuitable or broken approved content after publication.

#### Requirements

- Add a discreet report action to story and teacher views.
- Offer fixed categories:
  - Unsafe or inappropriate content.
  - Inaccurate information.
  - Unsuitable reading level.
  - Broken or mismatched image.
  - Broken activity or answer.
  - Other.
- Collect pack ID, category, optional adult note, timestamp, and resolution status.
- Do not collect student answer text.
- Rate-limit submissions.
- Add reports to the admin moderation workspace.
- Allow an operator to unpublish an approved story by moving it back to pending or rejected.
- Preserve an audit trail rather than overwriting report history.

#### Acceptance Criteria

- Reports reference an exact approved immutable pack.
- Reported content can be unpublished promptly.
- Duplicate automated submissions are constrained.
- No child personal information is required.
- Moderators can mark reports resolved with a note.

#### Expected Outcomes

- Faster response to content problems.
- A feedback loop for prompt and moderation improvements.
- Better operational trust.

### R5.4 Teacher Landing Actions

#### Goal

Make classroom use discoverable while keeping the main hero student-focused.

#### Requirements

- Keep Print out of the primary child-facing hero action group.
- Provide teacher actions below student discovery sections:
  - `Print featured pack`.
  - `Browse teacher packs`.
- State the included materials: story, vocabulary, questions, and answer key.
- Allow the teacher library view to filter by tier, genre, and reading time.
- Reuse approved public packs only.

#### Acceptance Criteria

- Teacher actions remain visible on desktop and mobile.
- Print always references the featured immutable pack.
- Answer-key language does not dominate the child-facing viewport.

#### Expected Outcomes

- Clearer audience separation.
- Increased teacher-pack usage.
- Less clutter around the main reading command.

---

## R6: Privacy-Preserving Measurement

### R6.1 Aggregate Event Schema

#### Goal

Measure whether the landing page helps readers discover and complete the learning path.

#### Requirements

- Define a small allowlisted event schema:
  - `home_viewed`
  - `featured_story_opened`
  - `continue_reading_opened`
  - `recent_story_opened`
  - `favorite_added`
  - `favorite_removed`
  - `genre_selected`
  - `story_completed`
  - `vocabulary_started`
  - `vocabulary_completed`
  - `comprehension_opened`
  - `story_shared`
  - `teacher_pack_opened`
  - `content_reported`
- Allowed properties:
  - Pack ID.
  - Tier.
  - Genre.
  - Event timestamp.
  - Anonymous session ID with short retention, only if approved by privacy review.
- Prohibited properties:
  - Names, emails, ages, school IDs, IP addresses in analytics payloads.
  - Story answer text.
  - Dictionary lookup words.
  - Persistent cross-site identifiers.
  - Device fingerprinting attributes.
- Document event retention and deletion.
- Respect browser privacy controls and applicable consent requirements.

#### Acceptance Criteria

- Unknown events and properties are rejected at the server boundary.
- Event payloads are Zod-validated.
- No free-form child input reaches analytics.
- Analytics failures never block reading.
- A privacy review approves identifiers, consent behavior, and retention before public launch.

#### Expected Outcomes

- Reliable funnel measurement.
- Lower privacy risk than general-purpose behavioral analytics.
- Evidence for deciding which roadmap features improve engagement.

### R6.2 Product Funnel Dashboard

#### Goal

Turn aggregate events into actionable product signals.

#### Requirements

- Report at least:
  - Featured-story open rate.
  - Story completion rate.
  - Vocabulary start and completion rate.
  - Comprehension-open rate.
  - Share rate.
  - Return-session rate where privacy rules permit.
  - Genre destination usage.
  - Teacher-pack usage.
- Segment only by non-sensitive product dimensions such as tier and genre.
- Suppress very small cohorts to reduce re-identification risk.
- Track moderation report rate separately from engagement.
- Document formulas and time windows.

#### Acceptance Criteria

- Metrics can be reproduced from the source events.
- Dashboard excludes test and admin traffic.
- No individual-reader drill-down exists.
- Cost per engaged session can be estimated from generation and infrastructure telemetry.

#### Expected Outcomes

- Better prioritization based on observed behavior.
- Early detection of weak discovery or learning-flow transitions.
- Clearer operating economics.

---

## R7: Performance, Responsive Design, And Accessibility

### R7.1 Responsive Header

#### Goal

Keep brand and navigation usable without crowding narrow screens.

#### Requirements

- Desktop header keeps brand, tier selector, library, and theme controls in one row.
- Mobile layout uses:
  - Brand and utility actions on the first row.
  - Full-width tier segmented control on the second row.
- Use an icon plus tooltip for theme.
- Use a familiar library icon with visible text where space permits.
- Keep touch targets at least 44×44 CSS pixels.
- Consider sticky behavior only after testing that it does not reduce reading space excessively.

#### Acceptance Criteria

- No overlap at 320px width.
- Tier labels remain readable without viewport-scaled typography.
- Keyboard focus order matches visual order.
- Controls do not shift when active states change.

#### Expected Outcomes

- Easier tier switching on phones.
- A calmer first viewport.
- Better accessibility for touch and keyboard users.

### R7.2 Story Shelf Component

#### Goal

Provide one robust component for Recently Added, Continue Reading, and Saved Stories.

#### Requirements

- Stable cover aspect ratio and width constraints.
- Horizontal snapping on mobile.
- Grid or horizontal shelf treatment on wider screens.
- Support title, tier, genre, reading time, and optional progress.
- Use real approved cover art or the existing fallback.
- Reserve dimensions before images load to prevent layout shifts.
- Provide meaningful accessible link names.
- Avoid nested cards.

#### Acceptance Criteria

- Long titles wrap without changing cover dimensions.
- Loading and missing images do not shift layout.
- Shelf is operable by keyboard and touch.
- All shelf variants share visual and behavioral consistency.

#### Expected Outcomes

- Less duplicated landing code.
- More stable responsive behavior.
- Faster implementation of personalized shelves.

### R7.3 Image Delivery And Performance

#### Goal

Keep image-rich discovery fast at larger catalog and traffic levels.

#### Requirements

- Continue generating native 16:9 story images.
- Add explicit responsive image dimensions and `sizes` hints.
- Prefer WebP and define a local conversion fallback for providers returning PNG/JPEG.
- Add thumbnail variants for shelves rather than downloading full story images.
- Preserve full-image composition on story pages.
- Lazy-load below-the-fold shelves and scenes.
- Keep the featured image high priority but do not preload hidden shelf images.
- Measure LCP, CLS, image transfer size, and cache hit rate.

#### Acceptance Criteria

- No broken or blank images across supported routes.
- No horizontal overflow at mobile and desktop widths.
- Featured content has stable dimensions before load.
- Shelf thumbnails are materially smaller than full story images.
- Lighthouse performance and accessibility targets are defined and met before launch.

#### Expected Outcomes

- Faster first render.
- Lower Blob/CDN bandwidth.
- Better experience on mobile networks.

### R7.4 Accessibility Regression Suite

#### Goal

Protect accessibility as interactive landing features expand.

#### Requirements

- Add Playwright journeys at mobile and desktop sizes.
- Add automated accessibility checks with a maintained axe integration.
- Cover:
  - Header and tier selection.
  - Featured story actions.
  - Continue Reading.
  - Favorites.
  - Shelf keyboard navigation.
  - Genre and library filters.
  - Share feedback.
  - Teacher actions.
- Verify reduced-motion behavior.
- Verify focus visibility, heading hierarchy, landmarks, accessible names, and contrast.

#### Acceptance Criteria

- `pnpm test:e2e` contains and passes real tests.
- No serious or critical automated accessibility violations.
- All commands are operable without a pointer.
- Dynamic updates use appropriate live-region behavior.
- Desktop and mobile screenshots show no overlap or overflow.

#### Expected Outcomes

- Safer iteration on the landing experience.
- Fewer regressions for keyboard, screen-reader, and motion-sensitive users.

---

## R8: Controlled Model Experimentation

The admin currently supports Environment defaults, Economy, Balanced, Quality, Custom allowlisted selections, and regenerating with the same model set. R8 adds comparable experiments rather than more model-selection controls.

### R8.1 Side-By-Side Generation

#### Goal

Compare model quality, reliability, duration, and cost using controlled generation inputs.

#### Requirements

- Add an admin-only comparison mode that creates two pending packs.
- Hold these inputs constant across both variants:
  - Reading tier.
  - Genre and theme selection.
  - Prompt version.
  - Generation date used for grouping.
- Allow different story, learning, and image model sets for Variant A and Variant B.
- Validate both model sets through the existing server-side category allowlists.
- Assign a shared experiment ID plus explicit `A` and `B` labels in generation metadata.
- Never publish either variant automatically.
- Show both packs in one moderation comparison view with aligned sections for:
  - Story and illustrations.
  - Vocabulary and comprehension materials.
  - Validation attempts and retries.
  - Actual provider models and request IDs.
  - Token usage, image costs, total cost, and duration.
- Allow the moderator to approve either, both, or neither pack.
- Preserve each moderation decision independently.
- Do not reuse provider randomness claims unless a provider-specific deterministic seed is actually supported and stored.

#### Acceptance Criteria

- Both variants use the same tier, genre, theme, and prompt version.
- Variant models are independently selected and stored.
- One failed variant does not erase the successful variant's telemetry.
- The comparison view clearly identifies A and B at every scroll position.
- Pending comparison packs remain unavailable through all public routes and image endpoints.
- Approving one variant publishes only that pack.
- Tests verify allowlist rejection, shared inputs, independent telemetry, moderation isolation, and partial failure behavior.

#### Expected Outcomes

- Model choices are based on comparable evidence instead of anecdotal generations.
- Quality improvements can be evaluated against added cost and latency.
- Provider regressions and structured-output failures become easier to identify.

### R8.2 Model Performance History

#### Goal

Aggregate generation telemetry by requested model set and actual provider route.

#### Requirements

- Build admin-only aggregates from stored generation metadata.
- Report by story, learning, and image model:
  - Generation count.
  - Approval and rejection rates.
  - Median and percentile duration.
  - Median reported cost.
  - Invalid-response and corrective-retry rates.
  - Reading-level pass rate.
  - Image success rate.
- Separate requested model IDs from actual response models and providers.
- Exclude legacy packs without generation metadata from denominators.
- Make sample size visible and avoid rankings for insufficient samples.
- Never expose provider request IDs outside the authenticated admin surface.

#### Acceptance Criteria

- Aggregates can be reproduced from stored pack telemetry.
- Approval rates use final moderation state and cannot count pending packs as failures.
- Missing provider cost or usage is reported as unknown, not zero.
- Requested and routed model statistics remain distinguishable.
- The view works without loading full story text into the browser.

#### Expected Outcomes

- Better default and preset decisions.
- Earlier detection of model quality or reliability changes.
- Clearer generation economics over time.

---

## Delivery Sequence

### Phase 1: Clarity And Reliable Discovery

1. R1.1 Freshness and publication labels.
2. R1.2 Featured content counts.
3. R2.1 Recently Added cross-tier fallback.
4. R2.2 Dynamic genre destinations.
5. R2.3 Genre and tier library controls.
6. R7.1 Responsive header.

#### Phase Outcome

Every landing page truthfully represents its featured content and provides several valid approved destinations on desktop and mobile.

### Phase 2: Anonymous Retention

1. R7.2 Shared story shelf component.
2. R3.1 Continue Reading.
3. R3.2 Device-local Favorites.
4. R3.3 Personal reading shelf composition.

#### Phase Outcome

Returning readers can resume and save stories without accounts or server-side child profiles.

### Phase 3: Distribution And Trust

1. R4.1 Stable story routes.
2. R4.2 Story link previews.
3. R4.3 Refined share control.
4. R5.1 Parent and teacher information.
5. R5.2 Moderation trust indicator.
6. R5.4 Teacher landing actions.
7. R5.3 Content reporting.

#### Phase Outcome

Approved stories are reliably shareable, adults understand the product's safeguards, and unsuitable content can be reported and unpublished.

### Phase 4: Measurement And Performance

1. Complete privacy and child-safety review for analytics.
2. R6.1 Aggregate event schema.
3. R6.2 Product funnel dashboard.
4. R7.3 Image delivery and performance.
5. R7.4 Accessibility regression suite.

#### Phase Outcome

The team can evaluate discovery and retention using privacy-conscious aggregate data while protecting performance and accessibility.

### Phase 5: Model Optimization

1. R8.1 Side-by-side generation.
2. R8.2 Model performance history.

#### Phase Outcome

Admins can compare controlled variants and choose generation defaults using stored quality, reliability, speed, and cost evidence.

## Deferred Work

These capabilities are intentionally outside this landing-page roadmap until usage demonstrates a need:

- Child accounts or public profiles.
- Social feeds, comments, followers, or public activity.
- Leaderboards and competitive streaks.
- Personalized AI story recommendations.
- Email, SMS, or push notifications directed at children.
- Referral rewards or tracking codes.
- Payments and subscriptions.
- School rostering and classroom dashboards.
- Cross-device synchronization.

## Roadmap Completion Criteria

The landing-page roadmap is complete when:

- Featured content is accurately labeled as today, older, or sample.
- Recently Added remains useful across sparse tiers.
- Every displayed genre destination contains approved content.
- Readers can continue and save stories anonymously on one device.
- Shared links use stable canonical routes with useful previews.
- Parents and teachers can understand moderation and privacy behavior.
- Adults can report problematic content without submitting child data.
- Aggregate funnel behavior is measurable under an approved privacy model.
- Image-rich pages meet defined performance targets.
- Browser and accessibility regression suites pass on desktop and mobile.
