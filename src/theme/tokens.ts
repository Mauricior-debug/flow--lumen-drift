export const colors = {
  ink: '#0E2347',
  brand: '#0A4A8F',
  primary: '#2563EB',
  primaryPressed: '#1D4ED8',
  sky: '#60A5FA',
  mist: '#E0F2FE',
  canvas: '#F5FAFE',
  white: '#FFFFFF',
  muted: '#5A6A80',
  faint: '#6B7789',
  line: '#E3EDF6',
  card: '#FFFFFF',
  success: '#1E9B68',
  danger: '#DC4C4C',
  dangerPressed: '#B93838',
  track: '#E4EDF6',
  soft: '#F2F6FA',
  chip: '#EAF4FE',
  warning: '#8A5A12',
  warningBg: '#FFF6E8',
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  xxxl: 36,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  pill: 999,
};

export const type = {
  hero: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  h1: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.ink,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
  },
  bodyMuted: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 22,
    color: colors.muted,
  },
  small: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  button: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    lineHeight: 22,
  },
  wordmark: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.ink,
  },
} as const;
