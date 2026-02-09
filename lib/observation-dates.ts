export type ObservationDateFields = {
  taken_at?: string | null;
  photo_date?: string | null;
  created_at?: string | null;
};

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function resolveObservationDateTime(obs: ObservationDateFields): Date {
  if (obs.taken_at) return new Date(obs.taken_at);

  if (obs.photo_date) {
    const photoDate = obs.photo_date;
    const hasTime = photoDate.includes("T");

    if (hasTime) return new Date(photoDate);

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

  if (obs.created_at) return new Date(obs.created_at);

  return new Date(0);
}
