import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';

export const COLORS = {
  // Primary Brand Colors
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  
  // Success/Green
  success: '#10B981',
  successLight: '#D1FAE5',
  
  // Warning/Orange
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  
  // Error/Red
  error: '#EF4444',
  errorLight: '#FEE2E2',
  
  // Light Theme
  light: {
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
  },
  
  // Dark Theme
  dark: {
    background: '#0B0F1A',
    card: '#151A2D',
    text: '#F1F5F9',
    textSecondary: '#8B95A8',
    border: '#1F2740',
  },
  
  // Special
  streak: '#FFD700',
  premium: '#8B5CF6',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Custom hook to get theme colors based on settings
export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const { theme } = useSettingsStore();
  
  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  
  return {
    isDark,
    colors: {
      primary: COLORS.primary,
      primaryDark: COLORS.primaryDark,
      primaryLight: COLORS.primaryLight,
      success: COLORS.success,
      successLight: COLORS.successLight,
      warning: COLORS.warning,
      warningLight: COLORS.warningLight,
      error: COLORS.error,
      errorLight: COLORS.errorLight,
      streak: COLORS.streak,
      premium: COLORS.premium,
      background: isDark ? COLORS.dark.background : COLORS.light.background,
      card: isDark ? COLORS.dark.card : COLORS.light.card,
      text: isDark ? COLORS.dark.text : COLORS.light.text,
      textSecondary: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary,
      border: isDark ? COLORS.dark.border : COLORS.light.border,
    },
  };
};
