/**
 * Central layout constants for consistent styling across all pages
 * 
 * Adjust these values to change the layout site-wide:
 * - NAVBAR_MAX_WIDTH: Maximum width of the navigation bar container
 * - NAVBAR_PADDING: Horizontal padding for navbar content
 * - CONTENT_WIDTH: Width constraint for main content area
 * - CONTENT_PADDING: Horizontal padding for content area
 * - CONTENT_VERTICAL_PADDING: Vertical padding for content area
 */

export const LAYOUT_CONSTANTS = {
  // Navigation bar styling
  navbar: {
    maxWidth: "max-w-6xl",           // Maximum width constraint for navbar container
    padding: "px-3 sm:px-8",         // Horizontal padding (mobile: 12px, desktop: 20px)
    height: "h-16",                  // Fixed height for navbar
    background: "bg-transparent",  // Transparent background to show image through
    border: "",          // No border
  },

  // Main content area styling
  content: {
    maxWidth: "max-w-6xl",           // 🎯 MAIN WIDTH CONTROL - Change this to adjust all content width
                                     // Options: max-w-xs, max-w-sm, max-w-md, max-w-lg, max-w-xl, 
                                     //          max-w-2xl, max-w-3xl, max-w-4xl, max-w-5xl, max-w-6xl, max-w-7xl
    alignment: "mx-auto",            // Center alignment
    padding: "px-3 sm:px-8",         // Horizontal padding to match navbar
    verticalPadding: "py-1 sm:py-3 md:py-4",  // Vertical padding
  },

  // Footer styling (inherits from content width when placed inside content area)
  footer: {
    marginTop: "mt-12 sm:mt-12",     // Top margin
    padding: "px-3 sm:px-8 pt-0 pb-0",            // Internal padding
    border: "border-t border-gray-100",  // Top border
  }
} as const;

/**
 * Helper function to get complete navbar classes
 */
export const getNavbarClasses = () => {
  const { navbar } = LAYOUT_CONSTANTS;
  return {
    container: `sticky top-0 z-50 w-full flex justify-center ${navbar.height} ${navbar.background} ${navbar.border}`,
    content: `w-full ${navbar.maxWidth} flex justify-between items-center ${navbar.padding} text-sm`
  };
};

/**
 * Helper function to get complete content classes
 */
export const getContentClasses = () => {
  const { content } = LAYOUT_CONSTANTS;
  return {
    // Main container with width constraint and padding
    container: `flex-1 flex flex-col gap-0 w-full ${content.maxWidth} ${content.alignment} ${content.padding} ${content.verticalPadding}`,
    // Inner content area (for nested content)
    inner: `w-full`,
    // Just the width constraint for special cases
    widthOnly: `w-full ${content.maxWidth} ${content.alignment}`
  };
};

/**
 * Helper function to get complete footer classes
 */
export const getFooterClasses = () => {
  const { footer } = LAYOUT_CONSTANTS;
  return `w-full ${footer.border} ${footer.padding} ${footer.marginTop}`;
};