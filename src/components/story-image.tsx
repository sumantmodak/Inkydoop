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
      className={`flex items-center justify-center bg-gradient-to-br from-brand/25 to-grape/25 p-4 text-center text-sm text-brand dark:from-brand/30 dark:to-grape/30 ${className ?? ""}`}
    >
      <span>{alt}</span>
    </div>
  );
}
