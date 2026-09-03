const AUDIO_PATH = /^[\w./-]+\.mp3$/;

export function parseAudioPath(value: string | null): string | null {
  if (!value || !AUDIO_PATH.test(value) || value.includes("..")) return null;
  return value;
}

export function packIdFromAudioPath(path: string): string | null {
  const separator = path.indexOf("/");
  return separator > 0 ? path.slice(0, separator) : null;
}
