/**
 * Semantic class bundles for the main (home) app.
 * Prefer these over raw gray/white utilities so light and dark stay consistent.
 * Colors resolve via CSS variables in app/globals.css (:root / .dark) and Tailwind theme extensions.
 */

export const homeTheme = {
  main: "bg-background text-foreground",

  navbarSurface: "bg-background",

  /** Toolbar / chrome outline buttons (search, tags, filter, reports, settings) */
  outlineIconButton:
    "h-8 w-8 px-0 text-sm border-border flex items-center justify-center bg-background hover:bg-accent hover:text-accent-foreground",
  outlineIconButtonActive: "bg-accent text-accent-foreground",

  filterIndicator: "bg-blue-500 border-background",

  /** Sticky filter / search / label panels */
  filterStickyPanel: "bg-background/95 backdrop-blur-sm shadow-sm border-b border-border",

  /** Hierarchical and flat label toggles */
  labelToggle:
    "px-3 py-1 text-sm border transition-colors bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground",
  labelToggleSelected:
    "px-3 py-1 text-sm border transition-colors bg-primary text-primary-foreground border-primary",

  labelCategoryHeading: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1",
  labelHierarchyIndent: "border-l-2 border-border",

  searchField:
    "w-full px-3 py-2 text-base border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-md",

  filterNote: "mt-2 text-xs text-muted-foreground italic",

  linkAccent: "text-xs text-primary hover:underline",

  weekHeader: "text-xs font-normal text-muted-foreground uppercase tracking-widest",

  observationChip:
    "text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 truncate max-w-[50px] sm:max-w-[72px] leading-none font-normal",
  observationChipMore:
    "text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 leading-none font-normal shrink-0",

  dateCounter:
    "text-xs w-6 h-6 flex items-center justify-center border border-border font-normal group-data-[state=open]:bg-muted group-data-[state=closed]:bg-transparent transition-colors shrink-0",

  mobileUploadStrip: "sm:hidden sticky top-16 z-40 w-full bg-background pb-[10px] border-b border-border",
  mobileUploadButton:
    "w-full h-8 text-sm border-border flex items-center justify-center bg-background hover:bg-accent hover:text-accent-foreground",

  footerFixed: "fixed bottom-0 left-0 right-0 w-full bg-background z-40 border-t border-border",
  footerText: "text-xs text-muted-foreground",

  bottomBarOutlineButton:
    "h-8 w-8 px-0 text-sm border-border flex items-center justify-center bg-background hover:bg-accent hover:text-accent-foreground",
  bottomBarMenu: "absolute bottom-10 right-0 bg-popover border border-border shadow-lg min-w-[180px] z-50 text-popover-foreground",
  bottomBarMenuLink:
    "block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground border-b border-border last:border-b-0",

  selectionOverlay: "border-2 border-primary bg-primary/10",
} as const;

/** Claude panel on the home page — card surfaces that should track theme */
export const homeClaudeTheme = {
  panel: "pointer-events-auto w-80 h-96 bg-card border border-border text-card-foreground shadow-xl flex flex-col rounded-md overflow-hidden",
  header: "flex items-center justify-between p-3 border-b border-border bg-card",
  headerTitle: "font-semibold text-sm text-foreground",
  messagesArea: "flex-1 overflow-y-auto p-3 space-y-3 bg-card",
  emptyState: "text-center text-muted-foreground text-sm py-4",
  inputBar: "border-t border-border p-3 bg-card",
  input:
    "flex-1 px-3 py-2 text-sm border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring h-10 rounded-md",
  outlineButtonSm: "text-xs border-border text-foreground hover:bg-accent hover:text-accent-foreground",
  quickActionButton: "w-full justify-start text-left border-border text-foreground hover:bg-accent hover:text-accent-foreground",
  userBubble: "max-w-[80%] p-2 text-sm bg-muted text-foreground border border-border rounded-sm",
  assistantBubble: "max-w-[80%] p-2 text-sm bg-foreground text-background border border-border rounded-sm",
  userAvatar: "bg-muted border border-border text-muted-foreground",
  assistantAvatar: "bg-foreground text-background",
  chatFab: "pointer-events-auto h-8 w-8 p-0 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90",
} as const;
