import { useState, useEffect, useCallback } from 'react';

export const translations = {
  en: {
    // Navigation
    siteTitle: "Simple Site",
    
    // Hero section
    welcomeTitle: "Simple solution for a digital construction site",
    pleaseSignIn: "please sign in to generate reports",
    
    // Authentication
    loginToYourAccount: "Login to your account",
    email: "Email",
    password: "Password",
    forgotYourPassword: "Forgot your password?",
    login: "Login",
    dontHaveAccount: "Don't have an account?",
    signUp: "Sign up",
    signIn: "Sign in",
    createNewAccount: "Create a new account",
    repeatPassword: "Repeat Password",
    passwordsDoNotMatch: "Passwords do not match",
    creatingAccount: "Creating an account",
    alreadyHaveAccount: "Already have an account?",
    
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
    
    // Filtering
    user: "User",
    allUsers: "All Users",
    site: "Site",
    allSites: "All Sites",
    
    // Buttons
    generateReport: "Generate Report",
    clearSelection: "Clear Selection",
    generateReportSelected: "Generate Report ({count} selected)",
    loadMore: "Load More",
    info: "Info",
    
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
    
    // Search
    search: "Search",
    searchObservations: "Search observations...",
    filterByLabels: "Filter by Labels",
    noLabelsFound: "No labels found in your observations",
    labelsSelected: "labels selected",
    labelSelected: "label selected",
    clearAllLabels: "Clear all",
    
    // Tooltips
    toggleSearch: "Toggle search",
    toggleLabelFilter: "Toggle label filter",
    toggleDateFilter: "Toggle date filter",
    switchToCardView: "Switch to card view",
    switchToListView: "Switch to list view",
    home: "Home",
    refreshObservations: "Refresh observations",
    changeLanguage: "Change language",
    reports: "Reports",
    settings: "Settings",
    
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
    noPhotoAvailable: "No photo available",
    
    // Settings page
    back: "Back",
    siteManagement: "Site Management",
    createAndManageObservationSites: "Create and manage observation sites",
    siteName: "Site Name",
    enterSiteName: "Enter site name",
    description: "Description",
    descriptionOptional: "Description (optional)",
    enterSiteDescription: "Enter site description",
    createSite: "Create Site",
    existingSites: "Existing Sites",
    
    // Invite people
    invitePeople: "Invite People",
    inviteUsersToCollaborate: "Invite users to collaborate on this site",
    emailAddress: "Email Address",
    sendInvitation: "Send Invitation",
    
    // Label management
    labelManagement: "Label Management",
    createAndManageHierarchicalLabels: "Create and manage hierarchical observation labels for your sites",
    selectSite: "Select Site",
    chooseASite: "Choose a site...",
    createNewLabel: "Create New Label",
    labelName: "Label Name",
    enterLabelName: "Enter label name",
    category: "Category",
    location: "Location",
    gewerk: "Gewerk",
    type: "Type",
    parentLabel: "Parent Label",
    parentLabelOptional: "Parent Label (optional)",
    noParentTopLevel: "No parent (top-level)",
    enterLabelDescription: "Enter label description",
    createLabel: "Create Label",
    existingLabels: "Existing Labels",
    subLabels: "Sub-labels",
    
    // Plan upload
    uploadPlans: "Upload Plans",
    uploadSitePlansAndMaps: "Upload site plans and maps for reference",
    planName: "Plan Name",
    enterPlanName: "Enter plan name",
    planFile: "Plan File",
    uploadPlan: "Upload Plan",

    // Onboarding
    setupYourSite: "Setup Your Site",
    step: "Step",
    of: "of",
    welcome: "Welcome",
    previous: "Previous",
    next: "Next",
    
    // Onboarding steps
    welcomeToSimpleSite: "Welcome to Simple Site!",
    welcomeDescription: "Simple Site is a collaborative platform for collecting and managing site observations. Perfect for teams conducting site visits, inspections, or research.",
    whatYouCanDo: "What you can do:",
    collaborateWithTeamMembers: "Collaborate with team members",
    collectObservationsWithPhotos: "Collect observations with photos and notes",
    generateReportsAndExportData: "Generate reports and export data",
    useOurMobileAppForFieldWork: "Use our mobile app for field work",

    // Existing team step
    youreAlreadyPartOfATeam: "You're already part of a team!",
    foundExistingCollaborations: "We found that you've been invited to collaborate on existing sites",
    skipIntroductionAndStart: "You can skip this introduction and start using Simple Site right away, or continue to learn about the platform's features.",
    goToMySites: "Go to My Sites",

    // Sites step
    sites: "Sites",
    siteIsLocation: "A site is a location where you'll collect observations",
    createMultipleObservationSites: "Create multiple observation sites",
    addDescriptionsAndDetails: "Add descriptions and details for each site",
    manageSiteCollaborators: "Manage site collaborators and permissions",
    uploadSitePlansAndReference: "Upload site plans and reference materials",
    toCreateSites: "To create sites:",
    goToSettingsSiteManagement: "Go to Settings → Site Management after completing this introduction",

    // Labels step
    observationLabels: "Observation Labels",
    labelsHelpCategorize: "Labels help categorize and organize your observations",
    createHierarchicalLabelSystems: "Create hierarchical label systems",
    organizeLabelsByLocation: "Organize labels by location, type, or category",
    useLabelsToFilter: "Use labels to filter and search observations",
    shareLabelsAcrossTeam: "Share labels across team members",
    commonLabelExamples: "Common label examples:",
    issueProgressCompleted: "Issue, Progress, Completed, Damage, Repair Needed, Quality Check",
    toCreateLabels: "To create labels:",
    goToSettingsLabelManagement: "Go to Settings → Label Management after completing this introduction",

    // Plans step
    sitePlans: "Site Plans",
    uploadFloorPlansOrSiteMaps: "Upload floor plans or site maps for reference",
    uploadFloorPlansSiteMaps: "Upload floor plans, site maps, or diagrams",
    supportForImages: "Support for images (PNG, JPG)",
    pinObservationsDirectly: "Pin observations directly to plan locations",
    shareVisualContext: "Share visual context with team members",
    plansHelpTeamMembers: "Plans help team members understand the site layout and locate observations more easily.",
    toUploadPlans: "To upload plans:",
    goToSettingsPlanManagement: "Go to Settings → Plan Management after completing this introduction",

    // Collaboration step
    teamCollaboration: "Team Collaboration",
    addTeamMembersToCollaborate: "Add team members to collaborate on observations",
    inviteTeamMembersViaEmail: "Invite team members via email",
    setDifferentPermissionLevels: "Set different permission levels (Admin, Collaborator)",
    viewTeamObservationsRealTime: "View team observations in real-time",
    manageCollaboratorAccess: "Manage collaborator access and roles",
    teamMembersWillReceive: "Team members will receive email invitations to join your site as collaborators and can start contributing observations immediately.",
    toInviteTeamMembers: "To invite team members:",
    goToSettingsCollaborationManagement: "Go to Settings → Collaboration Management after completing this introduction",

    // Mobile app step
    getTheMobileApp: "Get the Mobile App",
    essentialForCollecting: "Essential for collecting observations in the field",
    simpleSiteMobileApp: "Simple Site Mobile App",
    takePhotosAndAddNotes: "Take photos and add notes on-site",
    gpsLocationTracking: "GPS location tracking",
    automaticSyncWithSites: "Automatic sync with your sites",
    availableOnAppStore: "Available on the App Store",
    webVsMobile: "Web vs Mobile:",
    webPortal: "Web Portal:",
    viewTeamObservationsGenerateReports: "View team observations, generate reports, and manage settings",
    mobileApp: "Mobile App:",
    requiredForCollectingObservations: "Required for collecting observations in the field",

    // Complete step
    youreAllSet: "You're All Set!",
    welcomeToSimpleSiteComplete: "Welcome to Simple Site! You now know how to use all the key features. You can start by creating your first site and observations.",
    whatsNext: "What's next:",
    goToSettingsCreateFirstSite: "Go to Settings to create your first site",
    setupObservationLabelsUploadPlans: "Set up observation labels and upload plans",
    inviteTeamMembersToCollaborate: "Invite team members to collaborate",
    downloadMobileAppForFieldWork: "Download the mobile app for field work",
    startCollectingObservations: "Start collecting observations",
    goToDashboard: "Go to Dashboard",
    settingUp: "Setting up..."
  },
  
  de: {
    // Navigation
    siteTitle: "Simple Site",
    
    // Hero section
    welcomeTitle: "Die Lösung für eine digitale Baustelle",
    pleaseSignIn: "bitte anmelden um berichte zu generieren",
    
    // Authentication
    loginToYourAccount: "Bei Ihrem Konto anmelden",
    email: "E-Mail",
    password: "Passwort",
    forgotYourPassword: "Passwort vergessen?",
    login: "Anmelden",
    dontHaveAccount: "Noch kein Konto?",
    signUp: "Registrieren",
    signIn: "Anmelden",
    createNewAccount: "Neues Konto erstellen",
    repeatPassword: "Passwort wiederholen",
    passwordsDoNotMatch: "Passwörter stimmen nicht überein",
    creatingAccount: "Konto wird erstellt",
    alreadyHaveAccount: "Bereits ein Konto?",
    
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
    
    // Filtering
    user: "Benutzer",
    allUsers: "Alle Benutzer",
    site: "Standort",
    allSites: "Alle Standorte",
    
    // Buttons
    generateReport: "Bericht generieren",
    clearSelection: "Auswahl löschen",
    generateReportSelected: "Bericht generieren ({count} ausgewählt)",
    loadMore: "Mehr laden",
    info: "Info",
    
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
    
    // Search
    search: "Suchen",
    searchObservations: "Beobachtungen suchen...",
    filterByLabels: "Nach Labels filtern",
    noLabelsFound: "Keine Labels in Ihren Beobachtungen gefunden",
    labelsSelected: "Labels ausgewählt",
    labelSelected: "Label ausgewählt",
    clearAllLabels: "Alle löschen",
    
    // Tooltips
    toggleSearch: "Suche umschalten",
    toggleLabelFilter: "Label-Filter umschalten",
    toggleDateFilter: "Datumsfilter umschalten",
    switchToCardView: "Zur Kartenansicht wechseln",
    switchToListView: "Zur Listenansicht wechseln",
    home: "Startseite",
    refreshObservations: "Beobachtungen aktualisieren",
    changeLanguage: "Sprache ändern",
    reports: "Berichte",
    settings: "Einstellungen",
    
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
    noPhotoAvailable: "Kein Foto verfügbar",
    
    // Settings page
    back: "Zurück",
    siteManagement: "Standortverwaltung",
    createAndManageObservationSites: "Beobachtungsstandorte erstellen und verwalten",
    siteName: "Standortname",
    enterSiteName: "Standortname eingeben",
    description: "Beschreibung",
    descriptionOptional: "Beschreibung (optional)",
    enterSiteDescription: "Standortbeschreibung eingeben",
    createSite: "Standort erstellen",
    existingSites: "Vorhandene Standorte",
    
    // Invite people
    invitePeople: "Personen einladen",
    inviteUsersToCollaborate: "Benutzer zur Zusammenarbeit an diesem Standort einladen",
    emailAddress: "E-Mail-Adresse",
    sendInvitation: "Einladung senden",
    
    // Label management
    labelManagement: "Label-Verwaltung",
    createAndManageHierarchicalLabels: "Hierarchische Beobachtungslabels für Ihre Standorte erstellen und verwalten",
    selectSite: "Standort auswählen",
    chooseASite: "Einen Standort wählen...",
    createNewLabel: "Neues Label erstellen",
    labelName: "Label-Name",
    enterLabelName: "Label-Name eingeben",
    category: "Kategorie",
    location: "Ort",
    gewerk: "Gewerk",
    type: "Typ",
    parentLabel: "Übergeordnetes Label",
    parentLabelOptional: "Übergeordnetes Label (optional)",
    noParentTopLevel: "Kein übergeordnetes Label (oberste Ebene)",
    enterLabelDescription: "Label-Beschreibung eingeben",
    createLabel: "Label erstellen",
    existingLabels: "Vorhandene Labels",
    subLabels: "Unter-Labels",
    
    // Plan upload
    uploadPlans: "Pläne hochladen",
    uploadSitePlansAndMaps: "Standortpläne und Karten als Referenz hochladen",
    planName: "Plan-Name",
    enterPlanName: "Plan-Name eingeben",
    planFile: "Plan-Datei",
    uploadPlan: "Plan hochladen",

    // Onboarding
    setupYourSite: "Ihre Baustelle einrichten",
    step: "Schritt",
    of: "von",
    welcome: "Willkommen",
    previous: "Zurück",
    next: "Weiter",
    
    // Onboarding steps
    welcomeToSimpleSite: "Willkommen bei Simple Site!",
    welcomeDescription: "Simple Site ist eine kollaborative Plattform für das Sammeln und Verwalten von Baustellenbeobachtungen. Perfekt für Teams, die Baustellenbesuche, Inspektionen oder Forschung durchführen.",
    whatYouCanDo: "Was Sie tun können:",
    collaborateWithTeamMembers: "Mit Teammitgliedern zusammenarbeiten",
    collectObservationsWithPhotos: "Beobachtungen mit Fotos und Notizen sammeln",
    generateReportsAndExportData: "Berichte generieren und Daten exportieren",
    useOurMobileAppForFieldWork: "Unsere mobile App für Feldarbeit verwenden",

    // Existing team step
    youreAlreadyPartOfATeam: "Sie sind bereits Teil eines Teams!",
    foundExistingCollaborations: "Wir haben festgestellt, dass Sie zur Zusammenarbeit an bestehenden Standorten eingeladen wurden",
    skipIntroductionAndStart: "Sie können diese Einführung überspringen und sofort mit Simple Site beginnen, oder weiter lernen über die Funktionen der Plattform.",
    goToMySites: "Zu meinen Standorten",

    // Sites step
    sites: "Standorte",
    siteIsLocation: "Ein Standort ist ein Ort, an dem Sie Beobachtungen sammeln werden",
    createMultipleObservationSites: "Mehrere Beobachtungsstandorte erstellen",
    addDescriptionsAndDetails: "Beschreibungen und Details für jeden Standort hinzufügen",
    manageSiteCollaborators: "Standort-Mitarbeiter und Berechtigungen verwalten",
    uploadSitePlansAndReference: "Standortpläne und Referenzmaterialien hochladen",
    toCreateSites: "Um Standorte zu erstellen:",
    goToSettingsSiteManagement: "Gehen Sie zu Einstellungen → Standortverwaltung nach Abschluss dieser Einführung",

    // Labels step
    observationLabels: "Beobachtungs-Labels",
    labelsHelpCategorize: "Labels helfen dabei, Ihre Beobachtungen zu kategorisieren und zu organisieren",
    createHierarchicalLabelSystems: "Hierarchische Label-Systeme erstellen",
    organizeLabelsByLocation: "Labels nach Standort, Typ oder Kategorie organisieren",
    useLabelsToFilter: "Labels zum Filtern und Suchen von Beobachtungen verwenden",
    shareLabelsAcrossTeam: "Labels im Team teilen",
    commonLabelExamples: "Häufige Label-Beispiele:",
    issueProgressCompleted: "Problem, Fortschritt, Abgeschlossen, Schaden, Reparatur erforderlich, Qualitätsprüfung",
    toCreateLabels: "Um Labels zu erstellen:",
    goToSettingsLabelManagement: "Gehen Sie zu Einstellungen → Label-Verwaltung nach Abschluss dieser Einführung",

    // Plans step
    sitePlans: "Standortpläne",
    uploadFloorPlansOrSiteMaps: "Grundrisse oder Standortkarten als Referenz hochladen",
    uploadFloorPlansSiteMaps: "Grundrisse, Standortkarten oder Diagramme hochladen",
    supportForImages: "Unterstützung für Bilder (PNG, JPG)",
    pinObservationsDirectly: "Beobachtungen direkt an Planstandorten anheften",
    shareVisualContext: "Visuellen Kontext mit Teammitgliedern teilen",
    plansHelpTeamMembers: "Pläne helfen Teammitgliedern, das Standortlayout zu verstehen und Beobachtungen leichter zu finden.",
    toUploadPlans: "Um Pläne hochzuladen:",
    goToSettingsPlanManagement: "Gehen Sie zu Einstellungen → Plan-Verwaltung nach Abschluss dieser Einführung",

    // Collaboration step
    teamCollaboration: "Teamzusammenarbeit",
    addTeamMembersToCollaborate: "Teammitglieder zur Zusammenarbeit bei Beobachtungen hinzufügen",
    inviteTeamMembersViaEmail: "Teammitglieder per E-Mail einladen",
    setDifferentPermissionLevels: "Verschiedene Berechtigungsebenen festlegen (Admin, Mitarbeiter)",
    viewTeamObservationsRealTime: "Team-Beobachtungen in Echtzeit anzeigen",
    manageCollaboratorAccess: "Mitarbeiter-Zugang und Rollen verwalten",
    teamMembersWillReceive: "Teammitglieder erhalten E-Mail-Einladungen, um Ihrem Standort als Mitarbeiter beizutreten und können sofort mit der Erfassung von Beobachtungen beginnen.",
    toInviteTeamMembers: "Um Teammitglieder einzuladen:",
    goToSettingsCollaborationManagement: "Gehen Sie zu Einstellungen → Zusammenarbeitsverwaltung nach Abschluss dieser Einführung",

    // Mobile app step
    getTheMobileApp: "Die mobile App herunterladen",
    essentialForCollecting: "Unverzichtbar für das Sammeln von Beobachtungen im Feld",
    simpleSiteMobileApp: "Simple Site Mobile App",
    takePhotosAndAddNotes: "Fotos aufnehmen und Notizen vor Ort hinzufügen",
    gpsLocationTracking: "GPS-Standortverfolgung",
    automaticSyncWithSites: "Automatische Synchronisation mit Ihren Standorten",
    availableOnAppStore: "Verfügbar im App Store",
    webVsMobile: "Web vs Mobile:",
    webPortal: "Web-Portal:",
    viewTeamObservationsGenerateReports: "Team-Beobachtungen anzeigen, Berichte generieren und Einstellungen verwalten",
    mobileApp: "Mobile App:",
    requiredForCollectingObservations: "Erforderlich für das Sammeln von Beobachtungen im Feld",

    // Complete step
    youreAllSet: "Sie sind startklar!",
    welcomeToSimpleSiteComplete: "Willkommen bei Simple Site! Sie kennen jetzt alle wichtigen Funktionen. Sie können mit der Erstellung Ihres ersten Standorts und Beobachtungen beginnen.",
    whatsNext: "Was kommt als nächstes:",
    goToSettingsCreateFirstSite: "Gehen Sie zu Einstellungen, um Ihren ersten Standort zu erstellen",
    setupObservationLabelsUploadPlans: "Beobachtungs-Labels einrichten und Pläne hochladen",
    inviteTeamMembersToCollaborate: "Teammitglieder zur Zusammenarbeit einladen",
    downloadMobileAppForFieldWork: "Die mobile App für Feldarbeit herunterladen",
    startCollectingObservations: "Mit dem Sammeln von Beobachtungen beginnen",
    goToDashboard: "Zum Dashboard",
    settingUp: "Wird eingerichtet..."
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

// Hook for managing language with localStorage persistence
export function useLanguage() {
  const [language, setLanguageState] = useState<Language>('de');
  const [mounted, setMounted] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'de')) {
      setLanguageState(savedLanguage);
    }
    setMounted(true);
  }, []);

  // Save language to localStorage when it changes
  const setLanguage = useCallback((newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
  }, []);

  return { language, setLanguage, mounted };
}
