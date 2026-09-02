import type { GenerationMeta } from "@/lib/schemas";

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

function formatCost(value?: number): string {
  return value === undefined ? "Not reported" : `$${value.toFixed(6)}`;
}

function Value({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold">{children}</dd>
    </div>
  );
}

export function GenerationMetadata({ metadata }: { metadata: GenerationMeta }) {
  return (
    <section className="mt-10 border-t-2 border-surface-border pt-6">
      <h4 className="font-display text-xl font-bold">Generation metadata</h4>

      <dl className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        <Value label="Status">{metadata.status}</Value>
        <Value label="Schema version">{metadata.schemaVersion}</Value>
        <Value label="App version">{metadata.appVersion}</Value>
        <Value label="Prompt version">{metadata.promptVersion}</Value>
        <Value label="Started">{formatDate(metadata.startedAt)}</Value>
        <Value label="Finished">{formatDate(metadata.finishedAt)}</Value>
        <Value label="Total duration">
          {formatDuration(metadata.durationMs)}
        </Value>
        <Value label="Tier">{metadata.selection.tier}</Value>
        <Value label="Selected genre">{metadata.selection.genre}</Value>
        <Value label="Selected theme">{metadata.selection.theme}</Value>
        <Value label="Story model">{metadata.models.story}</Value>
        <Value label="Learning model">{metadata.models.learning}</Value>
        <Value label="Image model">{metadata.models.image}</Value>
      </dl>

      <h5 className="font-display mt-8 font-bold">Usage and cost</h5>
      <dl className="mt-3 grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        <Value label="Prompt tokens">
          {metadata.tokens.prompt.toLocaleString()}
        </Value>
        <Value label="Completion tokens">
          {metadata.tokens.completion.toLocaleString()}
        </Value>
        <Value label="Total tokens">
          {metadata.tokens.total.toLocaleString()}
        </Value>
        <Value label="Text cost">{formatCost(metadata.costs?.textUsd)}</Value>
        <Value label="Image cost">
          {formatCost(metadata.costs?.imagesUsd)}
        </Value>
        <Value label="Total cost">
          {formatCost(metadata.costs?.totalUsd ?? metadata.costUsd)}
        </Value>
      </dl>

      <h5 className="font-display mt-8 font-bold">Retries and validation</h5>
      <dl className="mt-3 grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        <Value label="Story retries">{metadata.retries.story}</Value>
        <Value label="Learning retries">{metadata.retries.learning}</Value>
        <Value label="Invalid responses">{metadata.retries.invalidJson}</Value>
        <Value label="Word count">{metadata.validation.wordCount}</Value>
        <Value label="Reading grade">
          {metadata.validation.readingGrade.toFixed(2)}
        </Value>
        <Value label="Valid vocabulary">
          {metadata.validation.validVocabularyItems}
        </Value>
        <Value label="Valid questions">
          {metadata.validation.validQuestions}
        </Value>
      </dl>

      <h5 className="font-display mt-8 font-bold">Step timings</h5>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-md text-left text-sm">
          <thead className="border-b-2 border-surface-border text-muted">
            <tr>
              <th className="py-2 pr-4">Step</th>
              <th className="py-2">Duration</th>
            </tr>
          </thead>
          <tbody>
            {metadata.durationsMsByStep.map((step, index) => (
              <tr
                key={`${step.step}-${index}`}
                className="border-b border-surface-border"
              >
                <td className="py-2 pr-4 font-semibold">{step.step}</td>
                <td className="py-2">{formatDuration(step.durationMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h5 className="font-display mt-8 font-bold">Story validation attempts</h5>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-2xl text-left text-sm">
          <thead className="border-b-2 border-surface-border text-muted">
            <tr>
              <th className="py-2 pr-4">Attempt</th>
              <th className="py-2 pr-4">Words</th>
              <th className="py-2 pr-4">Grade</th>
              <th className="py-2">Issues</th>
            </tr>
          </thead>
          <tbody>
            {metadata.validation.storyAttempts.map((attempt) => (
              <tr
                key={attempt.attempt}
                className="border-b border-surface-border align-top"
              >
                <td className="py-2 pr-4">{attempt.attempt}</td>
                <td className="py-2 pr-4">{attempt.wordCount}</td>
                <td className="py-2 pr-4">{attempt.readingGrade.toFixed(2)}</td>
                <td className="py-2">
                  {attempt.issues.length ? attempt.issues.join("; ") : "None"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h5 className="font-display mt-8 font-bold">Provider calls</h5>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[80rem] text-left text-xs">
          <thead className="border-b-2 border-surface-border text-muted">
            <tr>
              <th className="py-2 pr-3">Step / attempt</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Requested model</th>
              <th className="py-2 pr-3">Response model</th>
              <th className="py-2 pr-3">Provider</th>
              <th className="py-2 pr-3">Request ID</th>
              <th className="py-2 pr-3">Started</th>
              <th className="py-2 pr-3">Duration</th>
              <th className="py-2 pr-3">Prompt</th>
              <th className="py-2 pr-3">Completion</th>
              <th className="py-2 pr-3">Total</th>
              <th className="py-2 pr-3">Cost</th>
              <th className="py-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {metadata.calls.map((call, index) => (
              <tr
                key={`${call.step}-${call.attempt}-${index}`}
                className="border-b border-surface-border align-top"
              >
                <td className="py-2 pr-3 font-semibold">
                  {call.step} / {call.attempt}
                </td>
                <td className="py-2 pr-3">{call.status}</td>
                <td className="py-2 pr-3">{call.model}</td>
                <td className="py-2 pr-3">{call.responseModel ?? "—"}</td>
                <td className="py-2 pr-3">{call.provider ?? "—"}</td>
                <td className="max-w-48 break-all py-2 pr-3">
                  {call.requestId ?? "—"}
                </td>
                <td className="py-2 pr-3">{formatDate(call.startedAt)}</td>
                <td className="py-2 pr-3">{formatDuration(call.durationMs)}</td>
                <td className="py-2 pr-3">{call.promptTokens}</td>
                <td className="py-2 pr-3">{call.completionTokens}</td>
                <td className="py-2 pr-3">{call.totalTokens}</td>
                <td className="py-2 pr-3">{formatCost(call.costUsd)}</td>
                <td className="py-2">{call.error ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h5 className="font-display mt-8 font-bold">Image generation</h5>
      <dl className="mt-3 grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        <Value label="Requested">{metadata.images.requested}</Value>
        <Value label="Succeeded">{metadata.images.succeeded}</Value>
        <Value label="Failed">{metadata.images.failed}</Value>
        <Value label="Total bytes">
          {formatBytes(metadata.images.totalBytes)}
        </Value>
      </dl>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[86rem] text-left text-xs">
          <thead className="border-b-2 border-surface-border text-muted">
            <tr>
              <th className="py-2 pr-3">Role / status</th>
              <th className="py-2 pr-3">Requested</th>
              <th className="py-2 pr-3">Moderation</th>
              <th className="py-2 pr-3">Requested model</th>
              <th className="py-2 pr-3">Response model</th>
              <th className="py-2 pr-3">Provider</th>
              <th className="py-2 pr-3">Request ID</th>
              <th className="py-2 pr-3">Actual output</th>
              <th className="py-2 pr-3">Bytes</th>
              <th className="py-2 pr-3">Duration</th>
              <th className="py-2 pr-3">Cost</th>
              <th className="py-2 pr-3">Blob path</th>
              <th className="py-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {metadata.images.items.map((image, index) => (
              <tr
                key={`${image.role}-${index}`}
                className="border-b border-surface-border align-top"
              >
                <td className="py-2 pr-3 font-semibold">
                  {image.role} / {image.status}
                </td>
                <td className="py-2 pr-3">
                  {image.requestedAspectRatio} {image.requestedFormat}
                </td>
                <td className="py-2 pr-3">{image.moderationStatus}</td>
                <td className="py-2 pr-3">{image.model}</td>
                <td className="py-2 pr-3">{image.responseModel ?? "—"}</td>
                <td className="py-2 pr-3">{image.provider ?? "—"}</td>
                <td className="max-w-48 break-all py-2 pr-3">
                  {image.requestId ?? "—"}
                </td>
                <td className="py-2 pr-3">
                  {image.format ?? "—"}
                  {image.width && image.height
                    ? ` ${image.width}×${image.height}`
                    : ""}
                </td>
                <td className="py-2 pr-3">
                  {image.bytes === undefined ? "—" : formatBytes(image.bytes)}
                </td>
                <td className="py-2 pr-3">
                  {formatDuration(image.durationMs)}
                </td>
                <td className="py-2 pr-3">{formatCost(image.costUsd)}</td>
                <td className="max-w-64 break-all py-2 pr-3">
                  {image.blobPath ?? "—"}
                </td>
                <td className="py-2">{image.error ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="mt-8 border-t border-surface-border pt-5">
        <summary className="font-display cursor-pointer font-bold text-brand">
          Raw generation metadata
        </summary>
        <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-background p-4 text-xs">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </details>
    </section>
  );
}
