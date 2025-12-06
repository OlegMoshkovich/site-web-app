/**
 * Month name utilities for international month navigation
 */

export type Language = 'en' | 'de';

/**
 * Gets month name in the specified language
 * @param monthIndex - Month index (0-11)
 * @param language - Language code ('en' or 'de')
 * @returns Month name in the specified language
 */
export function getMonthName(monthIndex: number, language: Language = 'en'): string {
  const monthNames = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 
         'July', 'August', 'September', 'October', 'November', 'December'],
    de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
         'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
  };
  return monthNames[language][monthIndex] || monthNames.en[monthIndex];
}

/**
 * Gets the current month state for dynamic navigation
 * @returns Object with current month and year
 */
export function getCurrentMonthState() {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
}

/**
 * Gets the previous month from the given month/year
 * @param month - Current month (0-11)
 * @param year - Current year
 * @returns Object with previous month and year
 */
export function getPreviousMonth(month: number, year: number) {
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  return { month: prevMonth, year: prevYear };
}