import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Gradient, Radius, Spacing, Typography } from '@/constants/theme';
import { APP_TAGLINE } from '@/data/content';
import { selectionFeedback } from '@/lib/haptics';
import { useOnboardingStore } from '@/store/onboardingStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const slides = [
  {
    icon: 'pulse' as const,
    title: 'Know when it matters',
    description:
      'Run a guided Health Check and get a clear Low, Medium, or High risk report in about two minutes.',
  },
  {
    icon: 'videocam' as const,
    title: 'See a doctor from home',
    description:
      'Book a video consult or an in-person visit with verified doctors across every specialty.',
  },
  {
    icon: 'people' as const,
    title: 'Care for your whole family',
    description:
      'Track symptoms, appointments, and history for everyone you look after, in one place.',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function finish(destination: '/(auth)/login' | '/(auth)/signup') {
    completeOnboarding();
    router.replace(destination);
  }

  function handleNext() {
    if (activeIndex === slides.length - 1) {
      finish('/(auth)/signup');
      return;
    }
    selectionFeedback();
    scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * (activeIndex + 1), animated: true });
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  }

  const isLast = activeIndex === slides.length - 1;

  return (
    <LinearGradient
      colors={Gradient.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topRow}>
        <Image
          source={require('@/assets/images/symptora-logo.png')}
          style={styles.logo}
          contentFit="contain"
          tintColor="#FFFFFF"
        />
        <Pressable onPress={() => finish('/(auth)/login')} hitSlop={8}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scroll}>
        {slides.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.iconOuter}>
              <View style={styles.iconInner}>
                <Ionicons name={slide.icon} size={54} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.four }]}>
        <Text style={styles.tagline}>{APP_TAGLINE}</Text>

        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View
              key={slide.title}
              style={[
                styles.dot,
                {
                  width: index === activeIndex ? 22 : 8,
                  backgroundColor: index === activeIndex ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                },
              ]}
            />
          ))}
        </View>

        <Button
          label={isLast ? 'Create my account' : 'Next'}
          variant="secondary"
          size="lg"
          icon={isLast ? 'arrow-forward' : undefined}
          iconPosition="trailing"
          onPress={handleNext}
        />

        <Pressable onPress={() => finish('/(auth)/login')} hitSlop={8} style={styles.loginRow}>
          <Text style={styles.loginText}>I already have an account</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  logo: {
    width: 150,
    height: 19,
  },
  skip: {
    ...Typography.smallStrong,
    color: 'rgba(255,255,255,0.9)',
  },
  scroll: {
    flex: 1,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  iconOuter: {
    width: 156,
    height: 156,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  iconInner: {
    width: 112,
    height: 112,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.title,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 340,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  tagline: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one + 2,
  },
  dot: {
    height: 8,
    borderRadius: Radius.full,
  },
  loginRow: {
    alignItems: 'center',
  },
  loginText: {
    ...Typography.smallStrong,
    color: '#FFFFFF',
  },
});
