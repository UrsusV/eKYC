/**
 * Design Tokens
 * 
 * Centralized design system tokens for colors, spacing, typography, and more.
 * These tokens are used to generate CSS variables and Tailwind configuration.
 */

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface SemanticColors {
  background: string;
  foreground: string;
  card: string;
  'card-foreground': string;
  popover: string;
  'popover-foreground': string;
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  muted: string;
  'muted-foreground': string;
  accent: string;
  'accent-foreground': string;
  destructive: string;
  'destructive-foreground': string;
  border: string;
  input: string;
  ring: string;
}

export interface DesignTokens {
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    success: ColorScale;
    warning: ColorScale;
    danger: ColorScale;
    neutral: ColorScale;
    light: SemanticColors;
    dark: SemanticColors;
  };
  spacing: {
    [key: string]: string;
  };
  borderRadius: {
    [key: string]: string;
  };
  fontSize: {
    [key: string]: [string, { lineHeight: string; letterSpacing?: string }];
  };
}

/**
 * Color Tokens
 */
const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  warning: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    950: '#422006',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  // Semantic colors for light mode
  light: {
    background: '#ffffff',
    foreground: '#0a0a0a',
    card: '#ffffff',
    'card-foreground': '#0a0a0a',
    popover: '#ffffff',
    'popover-foreground': '#0a0a0a',
    primary: '#0ea5e9',
    'primary-foreground': '#ffffff',
    secondary: '#f1f5f9',
    'secondary-foreground': '#0f172a',
    muted: '#f1f5f9',
    'muted-foreground': '#64748b',
    accent: '#f1f5f9',
    'accent-foreground': '#0f172a',
    destructive: '#ef4444',
    'destructive-foreground': '#ffffff',
    border: '#e2e8f0',
    input: '#e2e8f0',
    ring: '#0ea5e9',
  },
  // Semantic colors for dark mode
  dark: {
    background: '#0a0a0a',
    foreground: '#fafafa',
    card: '#0a0a0a',
    'card-foreground': '#fafafa',
    popover: '#0a0a0a',
    'popover-foreground': '#fafafa',
    primary: '#0ea5e9',
    'primary-foreground': '#ffffff',
    secondary: '#1e293b',
    'secondary-foreground': '#f1f5f9',
    muted: '#1e293b',
    'muted-foreground': '#94a3b8',
    accent: '#1e293b',
    'accent-foreground': '#f1f5f9',
    destructive: '#dc2626',
    'destructive-foreground': '#ffffff',
    border: '#1e293b',
    input: '#1e293b',
    ring: '#38bdf8',
  },
} as const;

/**
 * Spacing Tokens
 * Based on a consistent scale (4px base unit)
 */
const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
} as const;

/**
 * Border Radius Tokens
 */
const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  '4xl': '2rem', // 32px
  full: '9999px',
} as const;

/**
 * Font Size Tokens
 * Format: [fontSize, { lineHeight, letterSpacing? }]
 */
const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
  sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
  base: ['1rem', { lineHeight: '1.5rem' }], // 16px
  lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
  xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
  '5xl': ['3rem', { lineHeight: '1' }], // 48px
  '6xl': ['3.75rem', { lineHeight: '1' }], // 60px
  '7xl': ['4.5rem', { lineHeight: '1' }], // 72px
  '8xl': ['6rem', { lineHeight: '1' }], // 96px
  '9xl': ['8rem', { lineHeight: '1' }], // 128px
} as const;

/**
 * Design Tokens Object
 */
export const designTokens: DesignTokens = {
  colors,
  spacing,
  borderRadius,
  fontSize,
} as const;

/**
 * Helper function to generate CSS variable names from token paths
 */
export function getCSSVariableName(path: string[]): string {
  return `--${path.join('-')}`;
}

/**
 * Helper function to generate CSS variable reference
 */
export function getCSSVariableReference(path: string[]): string {
  return `var(${getCSSVariableName(path)})`;
}

/**
 * Type-safe token access helpers
 */
export const tokens = {
  color: {
    primary: (shade: keyof ColorScale) => getCSSVariableReference(['color', 'primary', shade]),
    secondary: (shade: keyof ColorScale) => getCSSVariableReference(['color', 'secondary', shade]),
    success: (shade: keyof ColorScale) => getCSSVariableReference(['color', 'success', shade]),
    warning: (shade: keyof ColorScale) => getCSSVariableReference(['color', 'warning', shade]),
    danger: (shade: keyof ColorScale) => getCSSVariableReference(['color', 'danger', shade]),
    neutral: (shade: keyof ColorScale) => getCSSVariableReference(['color', 'neutral', shade]),
  },
  spacing: (size: keyof typeof spacing) => getCSSVariableReference(['spacing', String(size)]),
  borderRadius: (size: keyof typeof borderRadius) => getCSSVariableReference(['radius', size]),
  fontSize: (size: keyof typeof fontSize) => getCSSVariableReference(['font-size', size]),
} as const;

export default designTokens;
