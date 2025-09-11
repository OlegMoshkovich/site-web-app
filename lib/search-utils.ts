import { ObservationWithUrl } from "@/types/observation";

/**
 * Filters observations based on a search query
 * Searches through note, plan, and labels fields
 */
export function filterObservationsBySearch(
  observations: ObservationWithUrl[],
  searchQuery: string
): ObservationWithUrl[] {
  if (!searchQuery.trim()) {
    return observations;
  }

  const query = searchQuery.toLowerCase().trim();

  return observations.filter(observation => {
    // Create searchable text from all relevant fields
    const searchableFields = [
      observation.note,
      observation.plan,
      ...(observation.labels || [])
    ];

    // Filter out null/undefined values and join into searchable text
    const searchableText = searchableFields
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // Check if query matches any part of the searchable text
    return searchableText.includes(query);
  });
}

/**
 * Normalizes file paths by removing leading slashes and empty strings
 */
export function normalizePath(path?: string | null): string | null {
  return (path ?? "").trim().replace(/^\/+/, "") || null;
}

/**
 * Groups observations by date for display
 */
export function groupObservationsByDate(observations: ObservationWithUrl[]) {
  const groups = observations.reduce((acc, observation) => {
    const date = observation.photo_date || observation.created_at;
    const dateKey = new Date(date).toDateString();
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(observation);
    return acc;
  }, {} as Record<string, ObservationWithUrl[]>);

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groups).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return { groups, sortedDates };
}

/**
 * Filters observations based on date range
 * Returns only observations that fall within the specified date range
 */
export function filterObservationsByDateRange(
  observations: ObservationWithUrl[],
  startDate: string,
  endDate: string
): ObservationWithUrl[] {
  if (!startDate || !endDate) {
    return observations;
  }

  // Normalize dates to start and end of day to ensure we capture all observations
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T23:59:59.999");

  return observations.filter((observation) => {
    // Use photo_date if available, otherwise fall back to created_at
    const observationDate = new Date(
      observation.photo_date || observation.created_at,
    );
    return observationDate >= start && observationDate <= end;
  });
}

/**
 * Processes labels for display by cleaning up concatenated strings
 */
export function processLabel(label: string): string {
  const cleanLabel = label.trim();
  let processedLabel = cleanLabel;
  
  // Handle different separators
  if (cleanLabel.includes(' ')) {
    processedLabel = cleanLabel;
  } else if (cleanLabel.includes('_')) {
    processedLabel = cleanLabel.replace(/_/g, ' ');
  } else if (cleanLabel.includes('-')) {
    processedLabel = cleanLabel.replace(/-/g, ' ');
  } else {
    // Split camelCase and PascalCase
    processedLabel = cleanLabel
      .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // PascalCase
      .replace(/([a-z])([0-9])/g, '$1 $2') // letters to numbers
      .replace(/([0-9])([a-zA-Z])/g, '$1 $2'); // numbers to letters
  }
  
  // Clean up multiple spaces and trim
  return processedLabel.replace(/\s+/g, ' ').trim();
}