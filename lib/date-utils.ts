/**
 * Date utility functions for handling date ranges and calculations
 */

import type { Observation } from "@/types/supabase";

/**
 * Gets the available date range from observations
 * @param observations - Array of observations
 * @returns Object with min and max dates in YYYY-MM-DD format
 */
export function getAvailableDateRange(observations: Observation[]) {
  if (observations.length === 0) return { min: "", max: "" };

  // Extract all dates from observations (photo_date or created_at)
  const dates = observations.map(
    (obs) => new Date(obs.taken_at || obs.created_at),
  );
  // Find the earliest and latest dates
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // Return dates in YYYY-MM-DD format for HTML date inputs
  return {
    min: minDate.toISOString().split("T")[0], // Earliest available date
    max: maxDate.toISOString().split("T")[0], // Latest available date
  };
}

/**
 * Sets date range for the past week (last 7 days)
 * @returns Object with startDate and endDate in YYYY-MM-DD format
 */
export function getPastWeekRange() {
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);
  
  return {
    startDate: weekAgo.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0]
  };
}

/**
 * Sets date range for the past month (last 30 days)
 * @returns Object with startDate and endDate in YYYY-MM-DD format
 */
export function getPastMonthRange() {
  const now = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(now.getDate() - 30);
  
  return {
    startDate: monthAgo.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0]
  };
}

/**
 * Gets the current month date range, with smart year detection
 * @param observations - Array of observations to check for available data
 * @returns Object with startDate and endDate for the current month
 */
export function getCurrentMonthRange(observations: Observation[]) {
  const now = new Date();
  let year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // First try current year
  let firstDay = `${year}-${month}-01`;
  let lastDay = new Date(year, now.getMonth() + 1, 0);
  let lastDayFormatted = `${year}-${month}-${String(lastDay.getDate()).padStart(2, '0')}`;
  
  // Check if there are any observations in the current month
  if (observations.length > 0) {
    const currentMonthObs = observations.filter(obs => {
      const obsDate = new Date(obs.taken_at || obs.created_at);
      return obsDate.getFullYear() === year && obsDate.getMonth() === now.getMonth();
    });
    
    // If no observations in current month, try the same month of the most recent year with data
    if (currentMonthObs.length === 0) {
      const availableYears = [...new Set(observations.map(obs => {
        const obsDate = new Date(obs.taken_at || obs.created_at);
        return obsDate.getFullYear();
      }))].sort((a, b) => b - a);
      
      if (availableYears.length > 0 && availableYears[0] !== year) {
        year = availableYears[0];
        firstDay = `${year}-${month}-01`;
        lastDay = new Date(year, now.getMonth() + 1, 0);
        lastDayFormatted = `${year}-${month}-${String(lastDay.getDate()).padStart(2, '0')}`;
      }
    }
  }
  
  return {
    startDate: firstDay,
    endDate: lastDayFormatted
  };
}