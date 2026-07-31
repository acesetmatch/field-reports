/**
 * Design tokens for the app.
 *
 * Deliberately a plain object rather than a styling library: the app is small
 * enough that `StyleSheet.create` plus shared tokens gives consistency without
 * adding a Babel/Metro build step.
 */

export const colors = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  border: '#E2E5EA',
  text: '#12171F',
  textMuted: '#5C6675',
  primary: '#1F5FD8',
  primaryText: '#FFFFFF',
  danger: '#C4322B',
  dangerSurface: '#FDECEB',
  success: '#1B7F42',
  disabled: '#B7BEC9',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '500' },
} as const;

/**
 * iOS Human Interface Guidelines and Material both put the minimum comfortable
 * touch target around 44dp. Shared so buttons and list rows stay tappable.
 */
export const MIN_TOUCH_TARGET = 44;
