const DAY_MS = 86_400_000;

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function publicationLabel(
  date: string,
  isSample: boolean,
  today: string,
): string {
  if (isSample) return "Sample story";
  if (date === today) return "Today's story";

  const published = parseDate(date);
  const current = parseDate(today);
  if (!published || !current) return "Featured story";

  const daysAgo = Math.round(
    (current.getTime() - published.getTime()) / DAY_MS,
  );
  if (daysAgo === 1) return "Published yesterday";

  return `Published ${published.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: published.getUTCFullYear() === current.getUTCFullYear() ? undefined : "numeric",
    timeZone: "UTC",
  })}`;
}