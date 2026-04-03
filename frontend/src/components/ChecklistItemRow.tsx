import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

interface Props {
  name: string;
  checked: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export const ChecklistItemRow: React.FC<Props> = ({
  name,
  checked,
  onToggle,
  onDelete,
  showDelete = false,
}) => {
  const { isDark, colors } = useTheme();
  
  const scale = useSharedValue(1);
  
  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );
    onToggle();
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.row,
          {
            backgroundColor: checked
              ? COLORS.successLight
              : colors.card,
            borderColor: checked
              ? COLORS.success
              : colors.border,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: checked ? COLORS.success : 'transparent',
              borderColor: checked ? COLORS.success : colors.textSecondary,
            },
          ]}
        >
          {checked && <Ionicons name="checkmark" size={18} color="#fff" />}
        </View>
        
        <Text
          style={[
            styles.name,
            {
              color: checked
                ? COLORS.success
                : colors.text,
              textDecorationLine: checked ? 'line-through' : 'none',
            },
          ]}
        >
          {name}
        </Text>
        
        {showDelete && onDelete && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  name: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: SPACING.xs,
  },
});
