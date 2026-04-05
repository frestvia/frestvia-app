import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Platform,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useTheme, COLORS, SPACING, RADIUS, FONTS } from '../src/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ONBOARDING_KEY = '@forgetly_onboarding_complete';

// ====== SLIDE DATA ======
interface Slide {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgAccent: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    title: 'Welcome to Forgetly',
    description: 'Never forget your important items again before leaving.',
    icon: 'checkmark-circle',
    iconColor: COLORS.primary,
    bgAccent: '#EEF2FF',
  },
  {
    id: '2',
    title: 'Create Smart Checklists',
    description: 'Add items like wallet, keys, charger, and more.',
    icon: 'list',
    iconColor: '#10B981',
    bgAccent: '#ECFDF5',
  },
  {
    id: '3',
    title: 'Exit Mode Reminder',
    description: "Tap 'I'm Leaving' and confirm everything before you go.",
    icon: 'exit-outline',
    iconColor: '#F59E0B',
    bgAccent: '#FFFBEB',
  },
  {
    id: '4',
    title: 'Smart Alerts',
    description: 'Get reminders so you never forget anything important.',
    icon: 'notifications',
    iconColor: '#EF4444',
    bgAccent: '#FEF2F2',
  },
  {
    id: '5',
    title: 'Stay Organized',
    description: 'Track your habits and avoid forgetting things again.',
    icon: 'stats-chart',
    iconColor: '#8B5CF6',
    bgAccent: '#F5F3FF',
  },
];

// ====== ANIMATED ICON COMPONENT ======
function AnimatedIcon({ icon, color, bgAccent, isActive }: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgAccent: string;
  isActive: boolean;
}) {
  const scale = useSharedValue(0.8);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (isActive) {
      scale.value = withSpring(1, { damping: 12, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });
      rotate.value = withSequence(
        withTiming(-5, { duration: 150 }),
        withRepeat(
          withSequence(
            withTiming(5, { duration: 300, easing: Easing.inOut(Easing.ease) }),
            withTiming(-5, { duration: 300, easing: Easing.inOut(Easing.ease) })
          ),
          3,
          true
        ),
        withTiming(0, { duration: 150 })
      );
    } else {
      scale.value = withTiming(0.8, { duration: 200 });
      opacity.value = withTiming(0.5, { duration: 200 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.iconWrapper, { backgroundColor: bgAccent }, animatedStyle]}>
      <Ionicons name={icon} size={72} color={color} />
    </Animated.View>
  );
}

// ====== DOT INDICATOR ======
function DotIndicator({ total, activeIndex }: { total: number; activeIndex: number }) {
  return (
    <View style={styles.dotsContainer}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === activeIndex ? COLORS.primary : '#D1D5DB',
              width: i === activeIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ====== MAIN ONBOARDING SCREEN ======
export default function OnboardingScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLastSlide = activeIndex === SLIDES.length - 1;

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (e) {
      console.log('Error saving onboarding state:', e);
    }
    router.replace('/(auth)/login');
  }, []);

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      completeOnboarding();
    } else {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    }
  }, [activeIndex, isLastSlide]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item, index }: { item: Slide; index: number }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.slideContent}>
        <AnimatedIcon
          icon={item.icon}
          color={isDark ? item.iconColor : item.iconColor}
          bgAccent={isDark ? 'rgba(255,255,255,0.08)' : item.bgAccent}
          isActive={index === activeIndex}
        />
        <Text style={[styles.title, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip Button */}
      <View style={styles.topBar}>
        <View style={{ width: 60 }} />
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <DotIndicator total={SLIDES.length} activeIndex={activeIndex} />

        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          style={styles.nextBtn}
        >
          <Text style={styles.nextBtnText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name={isLastSlide ? 'rocket' : 'arrow-forward'}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ====== STYLES ======
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  skipBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  skipText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 340,
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.md,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  bottomSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.xl,
    gap: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: RADIUS.md,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
