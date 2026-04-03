import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return COLORS.light.textSecondary;
    switch (variant) {
      case 'primary':
        return COLORS.primary;
      case 'secondary':
        return COLORS.success;
      case 'outline':
        return 'transparent';
      case 'danger':
        return COLORS.error;
      default:
        return COLORS.primary;
    }
  };
  
  const getTextColor = () => {
    if (variant === 'outline') return COLORS.primary;
    return '#FFFFFF';
  };
  
  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md };
      case 'large':
        return { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl };
      default:
        return { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg };
    }
  };
  
  const getFontSize = () => {
    switch (size) {
      case 'small':
        return FONTS.sizes.sm;
      case 'large':
        return FONTS.sizes.lg;
      default:
        return FONTS.sizes.md;
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'outline' ? COLORS.primary : 'transparent',
          borderWidth: variant === 'outline' ? 2 : 0,
          ...getPadding(),
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: getFontSize(),
                marginLeft: icon ? SPACING.sm : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  text: {
    fontWeight: '600',
  },
});
