const IMAGE_PATH = /^[\w./-]+\.(webp|png|jpeg)$/;

export function parseImagePath(value: string | null): string | null {
  if (!value || !IMAGE_PATH.test(value) || value.includes("..")) return null;
  return value;
}

export function packIdFromImagePath(path: string): string | null {
  const separator = path.indexOf("/");
  return separator > 0 ? path.slice(0, separator) : null;
}
