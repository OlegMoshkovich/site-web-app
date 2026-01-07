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
    filteringNote: "*Only loaded observations can be filtered. If date options are disabled, please load more observations.",
    
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
    loadMoreLabel: "Load more:",
    loadPastWeek: "Load Past Week",
    loadPastMonth: "Load Past Month",
    lastWeek: "Last Week",
    lastMonth: "Last Month",
    info: "Info",
    about: "About",
    
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
    noObservationsPastTwoDays: "No observations found for the past two days",
    loadObservationsLongerPeriod: "Load observations from a longer period:",
    
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
    editSite: "Edit Site",
    currentLogo: "Current Logo",
    uploadNewLogoOptional: "Upload New Logo (Optional)",
    currentLogoText: "Current logo",
    noLogoUploaded: "No logo uploaded",
    newLogoSelected: "New logo selected",
    cancel: "Cancel",
    updateSite: "Update Site",
    updating: "Updating...",
    noLogo: "No Logo",
    
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
    settingUp: "Setting up...",

    // Company page
    companyHeroTitle: "We are construction services and technology company. Our core expertise is in construction site supervision, and applcation of bespoke technology solutions for construction industry. So far we developed two product, one is ai enhaced site supervision app, and AR app for site planning and management. ",
    companyTechnologyTitle: "As industry practitioners, we are the primary users of our proprietary technology solutions. Our tools are field-tested and refined through our own construction operations before being made available to the broader construction industry. ",
    companyProjectsTitle: "Current projects",
    companyPartnershipsTitle: "As seasoned industry professionals, we possess deep understanding of construction site complexities and challenges. Recognizing that each construction site presents unique operational requirements, we collaborate with leading AEC industry partners to develop and refine the most effective construction management solutions.",
    
    // Services
    sitePlanningContent: "Strategic site planning services encompassing detailed layout design, optimal resource allocation, and comprehensive timeline optimization to ensure project efficiency and successful delivery within budget and schedule constraints.",
    siteSupervisionContent: "Expert on-site supervision services delivering rigorous quality control, comprehensive safety compliance monitoring, and systematic project milestone management to maintain the highest construction standards and regulatory adherence.",
    siteManagementContent: "Comprehensive end-to-end site management solutions encompassing sophisticated logistics coordination, strategic personnel management, and advanced progress tracking systems to optimize operational efficiency and project outcomes.",
    
    // Technology
    siteManagementAppContent: "Most data management systems for site supervision and office operations don't work out of the box. They require deep integration, custom setup, and often don't adapt to your specific workflow they force you to adapt to theirs.\n\nWith AI technology rapidly advancing, we're seeing a shift: construction and engineering companies are taking control of their digital tools rather than settling for one-size-fits-all software. The advantage is clear, when you own and customize your tools, they work the way you work, not the other way around.\n\nWe've built clone:it to document and manage our own construction sites. Now we're offering it to you as a fully deployable system that we'll customize and integrate into your workflow.\n\nHere's our proposition:\n\nWe give you the complete clone:it platform, the same mobile app and web system we use ourselves, free of charge. Then we work with you as a service to set it up, customize it to match your processes, and train your team to use it effectively.\n\nYou get full ownership of your site documentation system, customized to your workflow, without the typical software licensing costs. You only pay for our implementation and integration service.\n\nWe believe construction companies should control their own digital tools. As the experts in your domain, you know best how site documentation should work. We provide the technology foundation; you bring the expertise. Together, we build a system that actually serves your needs.\n\nWe see ourselves as a business partner that helps you take control of your digital operations during a critical technological shift.",
   augmentedRealityContent: "Advanced Augmented Reality technology for three-dimensional visualization of construction plans, proactive issue identification, and enhanced on-site decision-making capabilities that improve project accuracy and reduce costly errors.",
    
    // Projects
    powerPlantContent: "Major power generation facility construction in Munich, incorporating state-of-the-art energy infrastructure, cutting-edge sustainable technologies, and adherence to the highest environmental and safety standards.",
    cheeseFactoryContent: "Sophisticated cheese manufacturing facility in Wels featuring precision climate control systems, fully automated production lines, and specialized food-grade construction standards meeting the strictest industry regulations.",
    infrastructureContent: "Essential infrastructure development project in Wels encompassing comprehensive transportation networks, integrated utility systems, and foundational civil engineering works supporting regional development.",
    
    // Partnerships
    dbPartnershipContent: "Strategic partnership with DB focusing on advanced technology development and implementation of innovative construction management solutions for large-scale infrastructure and transportation projects.",
    drSauberPartnershipContent: "Collaborative pilot program with Dr Sauber + Partners, concentrating on pioneering construction methodologies, advanced quality assurance protocols, and integrated project delivery systems for complex engineering projects.",
    strabagPartnershipContent: "Strategic partnership with STRABAG, one of Europe's leading construction groups, focusing on large-scale project management optimization and comprehensive technology integration across diverse European construction markets.",
    
    // AI Assistant
    aiAssistant: "AI Assistant",
    aiAssistantIntro: "Hi! I'm your AI assistant.",
    quickSummaries: "Quick summaries:",
    summarizeToday: "Summarize Today",
    lastSevenDaysSummary: "Last 7 Days Summary", 
    lastFourteenDaysSummary: "Last 14 Days Summary",
    askAiAboutObservations: "Ask AI about your observations...",
    analyze: "Analyze",
    thinking: "Thinking...",
    
    // Sign up success
    thankYouForSigningUp: "Thank you for signing up!",
    checkEmailToConfirm: "Please check your email to confirm your account before",
    signInLink: "signing in",
    checkEmailToConfirmAfter: ". Please also check your spam folder, sometimes emails end up there.",
    ifYouHaveQuestions: "If you have any questions, please contact us at"
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
    filteringNote: "*Nur geladene Beobachtungen können gefiltert werden. Wenn Datumsoptionen deaktiviert sind, laden Sie bitte mehr Beobachtungen.",
    
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
    loadMoreLabel: "Mehr laden:",
    loadPastWeek: "Vergangene Woche laden",
    loadPastMonth: "Vergangenen Monat laden",
    lastWeek: "Letzte Woch",
    lastMonth: "Letzter Mon",
    info: "Info",
    about: "Über uns",
    
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
    noObservationsPastTwoDays: "Keine Beobachtungen in den letzten zwei Tagen gefunden",
    loadObservationsLongerPeriod: "Beobachtungen aus einem längeren Zeitraum laden:",
    
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
    editSite: "Standort bearbeiten",
    currentLogo: "Aktuelles Logo",
    uploadNewLogoOptional: "Neues Logo hochladen (Optional)",
    currentLogoText: "Aktuelles Logo",
    noLogoUploaded: "Kein Logo hochgeladen",
    newLogoSelected: "Neues Logo ausgewählt",
    cancel: "Abbrechen",
    updateSite: "Standort aktualisieren",
    updating: "Aktualisierung...",
    noLogo: "Kein Logo",
    
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
    settingUp: "Wird eingerichtet...",

    // Company page
    companyHeroTitle: "Wir sind ein Bau- und Tech-Unternehmen. Unsere Expertise liegt in der Baustellen-Aufsicht und Tech-Lösungen für die Branche. Wir haben zwei Produkte entwickelt: eine KI-App für Site-Aufsicht und eine AR-App für Planung und Management.",
    companyTechnologyTitle: "Als Branchenpraktiker sind wir die primären Nutzer unserer eigenen Technologielösungen. Unsere Tools werden in unseren eigenen Bauvorhaben getestet und verfeinert, bevor sie der breiteren Bauindustrie zur Verfügung gestellt werden.",
    companyProjectsTitle: "Aktuelle Projekte",
    companyPartnershipsTitle: "Als erfahrene Branchenprofis besitzen wir ein tiefes Verständnis für die Komplexität und Herausforderungen von Baustellen. Da jede Baustelle einzigartige betriebliche Anforderungen hat, arbeiten wir mit führenden AEC-Branchenpartnern zusammen, um die effektivsten Bauverwaltungslösungen zu entwickeln und zu verfeinern.",
    
    // Services
    sitePlanningContent: "Strategische Baustellen Planung mit detailliertem Layout Design, optimaler Ressourcen Zuteilung und Zeit Optimierung, um Projekt Effizienz und erfolgreiche Lieferung innerhalb von Budget und Terminen zu gewährleisten.",
    siteSupervisionContent: "Experten Dienste für die Baustellen Überwachung mit rigoroser Qualitäts Kontrolle, umfassender Sicherheits Überwachung und systematischem Projekt Management, um höchste Bau Standards und Regelungs Einhaltung zu gewährleisten.",
    siteManagementContent: "Umfassende End-to-End Baustellen Management Lösungen mit ausgeklügelter Logistik Koordination, strategischem Personal Management und fortschrittlichen Fortschritts Systemen, um operative Effizienz und Projekt Ergebnisse zu optimieren.",
    
    // Technology
    siteManagementAppContent: "Die meisten Datenmanagementsysteme für Baustellenüberwachung und Büroabläufe funktionieren nicht sofort einsatzbereit. Sie erfordern tiefgreifende Integration, individuelle Einrichtung und passen sich oft nicht an Ihren spezifischen Arbeitsablauf an – sie zwingen Sie, sich an deren anzupassen.\n\nMit der rasanten Entwicklung der KI-Technologie erleben wir einen Wandel: Bau- und Ingenieurbüros übernehmen die Kontrolle über ihre digitalen Werkzeuge, anstatt sich mit Einheitslösungen zufriedenzugeben. Der Vorteil ist klar: Wenn Sie Ihre Werkzeuge besitzen und anpassen, arbeiten sie so, wie Sie arbeiten – nicht umgekehrt.\n\nWir haben clone:it entwickelt, um unsere eigenen Baustellen zu dokumentieren und zu verwalten. Jetzt bieten wir es Ihnen als vollständig einsatzbereites System an, das wir für Ihren Arbeitsablauf anpassen und integrieren.\n\nUnser Angebot:\n\nWir stellen Ihnen die komplette clone:it Plattform zur Verfügung – dieselbe mobile App und das Websystem, das wir selbst nutzen – kostenlos. Dann arbeiten wir mit Ihnen als Dienstleistung daran, es einzurichten, an Ihre Prozesse anzupassen und Ihr Team in der effektiven Nutzung zu schulen.\n\nSie erhalten die volle Eigentumsrechte an Ihrem Baustellendokumentationssystem, angepasst an Ihren Arbeitsablauf, ohne die üblichen Softwarelizenzkosten. Sie zahlen nur für unsere Implementierungs- und Integrationsdienstleistung.\n\nWir glauben, dass Bauunternehmen die Kontrolle über ihre eigenen digitalen Werkzeuge haben sollten. Als Experten in Ihrem Bereich wissen Sie am besten, wie Baustellendokumentation funktionieren sollte. Wir liefern das technologische Fundament; Sie bringen die Expertise. Gemeinsam bauen wir ein System, das tatsächlich Ihren Bedürfnissen dient.\n\nWir sehen uns als Geschäftspartner, der Ihnen hilft, während eines kritischen technologischen Wandels die Kontrolle über Ihre digitalen Abläufe zu übernehmen.",
    augmentedRealityContent: "Fortschrittliche AR Technologie für 3D Visualisierung von Bau Plänen, proaktive Problem Identifikation und verbesserte Entscheidungs Findung vor Ort, die Projekt Genauigkeit verbessert und kostspielige Fehler reduziert.",
    
    // Projects
    powerPlantContent: "Großer Kraftwerks Neubau in München mit modernster Energie Infrastruktur, innovativen nachhaltigen Technologien und Einhaltung höchster Umwelt und Sicherheits Standards.",
    cheeseFactoryContent: "Hochmoderne Käse Herstellungs Anlage in Wels mit präzisen Klima Kontroll Systemen, vollautomatisierten Produktions Linien und spezialisierten lebensmittel tauglichen Bau Standards, die strengste Industrie Vorschriften erfüllen.",
    infrastructureContent: "Wesentliches Infrastruktur Entwicklungs Projekt in Wels, das umfassende Verkehrs Netze, integrierte Versorgungs Systeme und grundlegende Bau Ingenieur Arbeiten zur Unterstützung der regionalen Entwicklung umfasst.",
    
    // Partnerships
    dbPartnershipContent: "Strategische Partnerschaft mit der DB, die sich auf fortschrittliche Technologie Entwicklung und Implementierung innovativer Bau Verwaltungs Lösungen für große Infrastruktur und Verkehrs Projekte konzentriert.",
    drSauberPartnershipContent: "Kollaboratives Pilot Programm mit Dr Sauber + Partners, das sich auf innovative Bau Methoden, fortschrittliche Qualitäts Sicherungs Protokolle und integrierte Projekt Lieferungs Systeme für komplexe Ingenieur Projekte konzentriert.",
    strabagPartnershipContent: "Strategische Partnerschaft mit STRABAG, einer der führenden europäischen Bau Gruppen, die sich auf groß maßstäbliche Projekt Management Optimierung und umfassende Technologie Integration in verschiedenen europäischen Bau Märkten konzentriert.",
    
    // AI Assistant
    aiAssistant: "AI-Assistent",
    aiAssistantIntro: "Hallo! Ich bin Ihr AI-Assistent.",
    quickSummaries: "Schnelle Zusammenfassungen:",
    summarizeToday: "Heute zusammenfassen",
    lastSevenDaysSummary: "Letzte 7 Tage Zusammenfassung",
    lastFourteenDaysSummary: "Letzte 14 Tage Zusammenfassung", 
    askAiAboutObservations: "KI über Ihre Beobachtungen fragen...",
    analyze: "Analysieren",
    thinking: "Denke nach...",
    
    // Sign up success
    thankYouForSigningUp: "Vielen Dank für Ihre Registrierung!",
    checkEmailToConfirm: "Bitte überprüfen Sie Ihre E-Mail, um Ihr Konto zu bestätigen, bevor Sie sich",
    signInLink: "anmelden",
    checkEmailToConfirmAfter: ". Bitte überprüfen Sie auch Ihren Spam-Ordner, manchmal landen E-Mails dort.",
    ifYouHaveQuestions: "Wenn Sie Fragen haben, kontaktieren Sie uns bitte unter"
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
