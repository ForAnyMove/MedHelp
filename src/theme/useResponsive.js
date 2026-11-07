import { useWindowDimensions, Platform, PixelRatio } from 'react-native';

export const BREAKPOINTS = {
  mobileMax: 599,
  tabletMin: 600,
  tabletMax: 1099,
  tabletLandscapeMin: 840,
  desktopMin: 1100,
  desktopWideMin: 1440,
  ultrawideMin: 1920,
};

export const MAX_CONTENT_WIDTH = {
  tablet: 840,
  desktop: 1240,
  desktopWide: 1440,
  ultrawide: 1560,
};

/**
 * Pure calculation function for responsive metrics given width, height, and platform.
 * Can be used outside React components or inside hooks.
 */
export function getResponsiveMetrics(width, height, platform = Platform.OS) {
  const isPortrait = height >= width;
  const isLandscape = width > height;
  const aspectRatio = width / (height || 1);

  const isMobile = width < BREAKPOINTS.tabletMin;
  const isTablet = width >= BREAKPOINTS.tabletMin && width < BREAKPOINTS.desktopMin;
  const isDesktop = width >= BREAKPOINTS.desktopMin && width < BREAKPOINTS.desktopWideMin;
  const isDesktopWide = width >= BREAKPOINTS.desktopWideMin && width < BREAKPOINTS.ultrawideMin;
  const isUltrawide = width >= BREAKPOINTS.ultrawideMin || (width >= BREAKPOINTS.desktopWideMin && aspectRatio >= 2.0);

  // User-specified form-factor modes:
  // 1. Mobile portrait (and web portrait mode)
  const isMobilePortrait = isMobile && isPortrait;
  const isPortraitShell = isPortrait; // Keeps single-column vertical UX for any portrait viewport
  
  // 2. Tablet portrait (600px - 840px vertical)
  const isTabletPortrait = isTablet && isPortrait;

  // 3. Tablet landscape (840px - 1100px horizontal)
  const isTabletLandscape = (isTablet && isLandscape) || (width >= BREAKPOINTS.tabletLandscapeMin && width < BREAKPOINTS.desktopMin);

  // 4. Desktop compact / laptop (1100px - 1440px)
  const isDesktopCompact = isDesktop && isLandscape;

  // 5. Desktop wide / ultrawide (> 1440px)
  const isDesktopLarge = (isDesktopWide || isUltrawide) && isLandscape;

  // Navigation UI presentation mode:
  // - 'bottomBar': mobile screens and any screen in portrait orientation
  // - 'navRail': compact vertical rail (icon + short label) for tablet landscape
  // - 'sidebar': full expandable desktop sidebar with logo and user card
  let navigationMode = 'bottomBar';
  if (!isPortrait) {
    if (width >= BREAKPOINTS.desktopMin) {
      navigationMode = 'sidebar';
    } else if (width >= BREAKPOINTS.tabletLandscapeMin) {
      navigationMode = 'navRail';
    }
  }

  // Modal display presentation:
  // - 'bottomSheet' for mobile portrait / web portrait
  // - 'centeredModal' for tablet and desktop landscape
  const modalMode = isPortraitShell || isMobile ? 'bottomSheet' : 'centeredModal';

  // Responsive padding
  let contentPadding = 16;
  if (width >= BREAKPOINTS.desktopWideMin) {
    contentPadding = 36;
  } else if (width >= BREAKPOINTS.desktopMin) {
    contentPadding = 28;
  } else if (width >= BREAKPOINTS.tabletMin) {
    contentPadding = 24;
  }

  // Max container width to prevent over-stretching on ultrawide monitors
  let containerMaxWidth = null;
  if (isUltrawide) {
    containerMaxWidth = MAX_CONTENT_WIDTH.ultrawide;
  } else if (isDesktopWide) {
    containerMaxWidth = MAX_CONTENT_WIDTH.desktopWide;
  } else if (isDesktop) {
    containerMaxWidth = MAX_CONTENT_WIDTH.desktop;
  }

  // Helper for grid column counts
  const getColumns = (mobileCols = 1, tabletCols = 2, desktopCols = 3, wideCols = 4) => {
    if (isUltrawide || isDesktopWide) return wideCols;
    if (isDesktop) return desktopCols;
    if (isTablet) return tabletCols;
    return mobileCols;
  };

  return {
    width,
    height,
    aspectRatio,
    platform,
    isPortrait,
    isLandscape,
    isMobile,
    isTablet,
    isDesktop,
    isDesktopWide,
    isUltrawide,
    // Specific form factors
    isMobilePortrait,
    isPortraitShell,
    isTabletPortrait,
    isTabletLandscape,
    isDesktopCompact,
    isDesktopLarge,
    // UI orchestration
    navigationMode, // 'bottomBar' | 'navRail' | 'sidebar'
    modalMode,      // 'bottomSheet' | 'centeredModal'
    contentPadding,
    containerMaxWidth,
    getColumns,
    // Dimensions helpers
    sidebarWidth: navigationMode === 'sidebar' ? 240 : (navigationMode === 'navRail' ? 84 : 0),
  };
}

/**
 * React hook that dynamically provides responsive metrics and updates on resize/orientation change.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return getResponsiveMetrics(width, height, Platform.OS);
}
