export type ObservationDateFields = {
  taken_at?: string | null;
  photo_date?: string | null;
  created_at?: string | null;
};

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a naive local datetime string as local time, ignoring any timezone suffix.
 *
 * taken_at and photo_date store the camera's EXIF capture time as local time.
 * Supabase appends "+00:00" to timestamp columns, causing new Date() to treat
 * them as UTC (off by +1h in CET, etc.). We fix this by extracting the numeric
 * parts and constructing a Date using the multi-argument constructor, which
 * always uses the browser's local timezone.
 *
 * Returns null if the string cannot be parsed.
 */
function parseLocalDateTime(dateStr: string): Date | null {
  const match = dateStr.match(
    /(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (!match) return null;
  const [, year, month, day, hour, minute, second = "0"] = match;
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );
}

export function resolveObservationDateTime(obs: ObservationDateFields): Date {
  // taken_at: camera EXIF local time — parse without timezone conversion
  if (obs.taken_at) {
    const local = parseLocalDateTime(obs.taken_at);
    if (local) return local;
    return new Date(obs.taken_at);
  }

  if (obs.photo_date) {
    const photoDate = obs.photo_date;
    const hasTime = photoDate.includes("T");

    if (hasTime) {
      // photo_date with time is also camera local time — parse without conversion
      const local = parseLocalDateTime(photoDate);
      if (local) return local;
      return new Date(photoDate);
    }

    if (obs.created_at) {
      const timePart = obs.created_at.split("T")[1];
      if (timePart) return new Date(`${photoDate}T${timePart}`);
    }

    if (DATE_ONLY_REGEX.test(photoDate)) {
      // Avoid UTC parsing of date-only strings (causes 01:00 for CET)
      return new Date(`${photoDate}T00:00:00`);
    }

    return new Date(photoDate);
  }

  // created_at is genuine UTC — convert to local time normally
  if (obs.created_at) return new Date(obs.created_at);

  return new Date(0);
}
