export type GenerationProgressStage =
  | "selection"
  | "story"
  | "learning"
  | "images"
  | "assembly"
  | "audio"
  | "storage";

export type GenerationProgressStatus =
  "active" | "completed" | "warning" | "skipped";

export interface GenerationProgressEvent {
  stage: GenerationProgressStage;
  label: string;
  status: GenerationProgressStatus;
  detail?: string;
  timestamp: string;
}

export type GenerationProgressReporter = (
  event: GenerationProgressEvent,
) => void;

export function reportGenerationProgress(
  reporter: GenerationProgressReporter | undefined,
  event: Omit<GenerationProgressEvent, "timestamp">,
): void {
  reporter?.({ ...event, timestamp: new Date().toISOString() });
}
