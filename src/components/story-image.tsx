interface StoryImageProps {
  alt: string;
  className?: string;
}

// Placeholder image slot. M6.5 (T6.5.4) resolves blobPath -> real image src.
export function StoryImage({ alt, className }: StoryImageProps) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`flex items-center justify-center bg-gradient-to-br from-sky-200 to-violet-200 p-4 text-center text-sm text-slate-600 dark:from-sky-900 dark:to-violet-900 dark:text-slate-300 ${className ?? ""}`}
    >
      <span>{alt}</span>
    </div>
  );
}
