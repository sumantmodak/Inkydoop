"use client";

import { useEffect, useState } from "react";

export function ModerationAudio({
  adminKey,
  blobPath,
  title,
}: {
  adminKey: string;
  blobPath: string;
  title: string;
}) {
  const [source, setSource] = useState<string>();

  useEffect(() => {
    let objectUrl: string | undefined;
    const controller = new AbortController();
    fetch(`/api/admin/moderation/audio?path=${encodeURIComponent(blobPath)}`, {
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

  if (!source) return <p className="text-sm text-muted">Loading narration…</p>;

  return (
    <audio
      controls
      preload="metadata"
      className="w-full"
      aria-label={`Moderation preview for ${title}`}
      src={source}
    />
  );
}
