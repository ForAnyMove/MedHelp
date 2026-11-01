import { Platform } from 'react-native';

/**
 * Standard touch target size thresholds across major accessibility specifications:
 *
 * 1. WCAG 2.2 Criterion 2.5.8 (Target Size - Minimum, Level AA): 24x24 CSS pixels.
 * 2. WCAG 2.1/2.2 Criterion 2.5.5 (Target Size - Enhanced, Level AAA): 44x44 CSS pixels.
 * 3. Israeli Standard SI 5568-1 (September 2023): Mandates Level AA compliance.
 * 4. Apple iOS Human Interface Guidelines (HIG): Minimum 44x44 pt.
 * 5. Google Android Material Design & Accessibility Scanner: Minimum 48x48 dp.
 */
export const MIN_TARGET_SIZE_WCAG_AA = 24;
export const MIN_TARGET_SIZE_IOS = 44;
export const MIN_TARGET_SIZE_ANDROID = 48;

export const DEFAULT_PLATFORM_TARGET_SIZE = Platform.select({
  android: MIN_TARGET_SIZE_ANDROID, // 48dp on Android
  ios: MIN_TARGET_SIZE_IOS,         // 44pt on iOS
  default: MIN_TARGET_SIZE_IOS,     // 44px on Web / Desktop
});

/**
 * Dynamically calculates the EXACT hitSlop required to expand an undersized element
 * to the platform's required accessibility touch target size (44pt on iOS, 48dp on Android).
 *
 * If the element is ALREADY equal to or larger than the target size, returns `undefined`
 * to prevent unnecessary touch area expansion and eliminate any risk of overlap
 * with neighboring interactive elements.
 *
 * @param {number} currentWidth - Visual width of the element in dp/pt
 * @param {number} [currentHeight=currentWidth] - Visual height of the element in dp/pt
 * @param {number} [targetSize=DEFAULT_PLATFORM_TARGET_SIZE] - Desired touch target size (default 44 iOS / 48 Android)
 * @returns {{ top: number, bottom: number, left: number, right: number } | undefined}
 */
export function getHitSlopForSize(
  currentWidth,
  currentHeight = currentWidth,
  targetSize = DEFAULT_PLATFORM_TARGET_SIZE
) {
  if (typeof currentWidth !== 'number' || currentWidth <= 0) return undefined;
  if (typeof currentHeight !== 'number' || currentHeight <= 0) {
    currentHeight = currentWidth;
  }

  const horizontalNeeded = Math.max(0, targetSize - currentWidth);
  const verticalNeeded = Math.max(0, targetSize - currentHeight);

  // If already at or above target size, no hitSlop needed
  if (horizontalNeeded === 0 && verticalNeeded === 0) {
    return undefined;
  }

  const top = Math.ceil(verticalNeeded / 2);
  const bottom = Math.floor(verticalNeeded / 2);
  const left = Math.ceil(horizontalNeeded / 2);
  const right = Math.floor(horizontalNeeded / 2);

  return { top, bottom, left, right };
}
