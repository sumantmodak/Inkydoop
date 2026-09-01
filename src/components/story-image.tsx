interface StoryImageProps {
  alt: string;
  blobPath?: string;
  className?: string;
  fit?: "cover" | "contain";
}

// Renders a story image from Blob storage, or a friendly placeholder when the
// illustration is missing (§6.1 Step 4).
export function StoryImage({
  alt,
  blobPath,
  className,
  fit = "cover",
}: StoryImageProps) {
  if (blobPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/image?path=${encodeURIComponent(blobPath)}`}
        alt={alt}
        className={`${fit === "contain" ? "object-contain" : "object-cover"} ${className ?? ""}`}
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
