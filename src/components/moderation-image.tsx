"use client";

import { useEffect, useState } from "react";

interface ModerationImageProps {
  adminKey: string;
  blobPath: string;
  alt: string;
  className?: string;
}

export function ModerationImage({
  adminKey,
  blobPath,
  alt,
  className,
}: ModerationImageProps) {
  const [source, setSource] = useState<string>();

  useEffect(() => {
    let objectUrl: string | undefined;
    const controller = new AbortController();
    fetch(`/api/admin/moderation/image?path=${encodeURIComponent(blobPath)}`, {
      headers: { "x-generate-key": adminKey },
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => {
        if (!blob) return;
        objectUrl = URL.createObjectURL(blob);
        setSource(objectUrl);
      })
      .catch(() => undefined);
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [adminKey, blobPath]);

  if (!source) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-brand/10 p-4 text-sm text-muted ${className ?? ""}`}
      >
        Loading image…
      </div>
    );
  }

  return (
    // Object URLs from authenticated fetches cannot use the Next image loader.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={source}
      alt={alt}
      className={`object-contain ${className ?? ""}`}
    />
  );
}
