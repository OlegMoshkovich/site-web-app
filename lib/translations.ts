export const translations = {
  en: {
    // Navigation
    siteTitle: "SIMPLE SITE",
    
    // Hero section
    welcomeTitle: "welcome",
    pleaseSignIn: "please sign in to generate reports",
    
    // Date selection
    start: "Start:",
    end: "End:",
    selectRange: "Select Range",
    clear: "Clear",
    selectAll: "Select All",
    unselectAll: "Unselect All",
    
    // Selection status
    clickToSelect: "Click on observations to select them.",
    observationsSelected: "observation(s) selected",
    
    // Buttons
    generateReport: "Generate Report",
    clearSelection: "Clear Selection",
    generateReportSelected: "Generate Report ({count} selected)",
    
    // Date headers
    dateFormat: {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    },
    
    // Placeholders
    noDescription: "No description available",
    
    // Loading and errors
    loading: "Loading...",
    errorLoading: "Error loading observations:",
    unexpectedError: "An unexpected error occurred.",
    noObservationsFound: "No observations found.",
    
    // Labels
    labels: "Labels",
    viewPlan: "View Plan",
    
    // Report page
    observationsReport: "Observations Report",
    reportDate: "Report Date",
    totalObservations: "Total Observations",
    printReport: "Print Report",
    backToObservations: "Back to Observations",
    goBackToObservations: "Go Back to Observations",
    report: "Report",
    loadingSelectedObservations: "Loading selected observations...",
    errorLoadingReport: "Error loading report",
    tryAgain: "Try Again",
    noPhotoAvailable: "No photo available"
  },
  
  de: {
    // Navigation
    siteTitle: "EINFACHE SEITE",
    
    // Hero section
    welcomeTitle: "willkommen",
    pleaseSignIn: "bitte anmelden um berichte zu generieren",
    
    // Date selection
    start: "Start:",
    end: "Ende:",
    selectRange: "Bereich auswählen",
    clear: "Löschen",
    selectAll: "Alle auswählen",
    unselectAll: "Alle abwählen",
    
    // Selection status
    clickToSelect: "Klicken Sie auf Beobachtungen, um sie auszuwählen.",
    observationsSelected: "Beobachtung(en) ausgewählt",
    
    // Buttons
    generateReport: "Bericht generieren",
    clearSelection: "Auswahl löschen",
    generateReportSelected: "Bericht generieren ({count} ausgewählt)",
    
    // Date headers
    dateFormat: {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    },
    
    // Placeholders
    noDescription: "Keine Beschreibung verfügbar",
    
    // Loading and errors
    loading: "Lädt...",
    errorLoading: "Fehler beim Laden der Beobachtungen:",
    unexpectedError: "Ein unerwarteter Fehler ist aufgetreten.",
    noObservationsFound: "Keine Beobachtungen gefunden.",
    
    // Labels
    labels: "Labels",
    viewPlan: "Plan anzeigen",
    
    // Report page
    observationsReport: "Beobachtungsbericht",
    reportDate: "Berichtsdatum",
    totalObservations: "Gesamtbeobachtungen",
    printReport: "Bericht drucken",
    backToObservations: "Zurück zu Beobachtungen",
    goBackToObservations: "Zurück zu Beobachtungen",
    report: "Bericht",
    loadingSelectedObservations: "Lade ausgewählte Beobachtungen...",
    errorLoadingReport: "Fehler beim Laden des Berichts",
    tryAgain: "Erneut versuchen",
    noPhotoAvailable: "Kein Foto verfügbar"
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

// Hook for accessing translations
export function useTranslations(language: Language) {
  return function t(key: TranslationKey): string {
    const value = translations[language][key];
    return typeof value === 'string' ? value : '';
  };
}
