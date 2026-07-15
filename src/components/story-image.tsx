interface StoryImageProps {
  alt: string;
  blobPath?: string;
  className?: string;
}

// Renders a story image from Blob storage, or a friendly placeholder when the
// illustration is missing (§6.1 Step 4.5).
export function StoryImage({ alt, blobPath, className }: StoryImageProps) {
  if (blobPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/image?path=${encodeURIComponent(blobPath)}`}
        alt={alt}
        className={`object-cover ${className ?? ""}`}
      />
    );
  }
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
