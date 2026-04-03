import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../constants/theme';

interface Props {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  subtitle?: string;
}

export const StatCard: React.FC<Props> = ({
  title,
  value,
  icon,
  color = COLORS.primary,
  subtitle,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? COLORS.cardDark : COLORS.card,
        },
        SHADOWS.small,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text
        style={[
          styles.value,
          { color: isDark ? COLORS.textDark : COLORS.text },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.title,
          { color: isDark ? COLORS.textSecondaryDark : COLORS.textSecondary },
        ]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color }]}>{subtitle}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    minWidth: 100,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  value: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
});
