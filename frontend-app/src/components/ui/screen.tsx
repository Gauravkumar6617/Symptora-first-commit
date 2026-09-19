import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ScreenProps {
  children: ReactNode;
  /** Sits above the scroll area (gradient header, stack header, tabs). */
  header?: ReactNode;
  scroll?: boolean;
  /** Adds the tab-bar height to the bottom padding. */
  tabBarInset?: boolean;
  /** Respects the top safe-area inset. Skip it when a header already does. */
  topInset?: boolean;
  padded?: boolean;
  keyboardAware?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  maxWidth?: number;
}

/** Standard page shell: background, safe areas, max width, scroll padding. */
export function Screen({
  children,
  header,
  scroll = true,
  tabBarInset = false,
  topInset = false,
  padded = true,
  keyboardAware = false,
  refreshing,
  onRefresh,
  contentStyle,
  maxWidth = MaxContentWidth,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const paddingTop = topInset ? insets.top + Spacing.three : header ? 0 : Spacing.three;
  const paddingBottom = (tabBarInset ? BottomTabInset : insets.bottom) + Spacing.five;

  const inner = (
    <View style={[styles.inner, { maxWidth }, padded ? styles.padded : null, contentStyle]}>{children}</View>
  );

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ paddingTop, paddingBottom }}
      keyboardShouldPersistTaps="always"
      automaticallyAdjustKeyboardInsets={keyboardAware}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={theme.primary} />
        ) : undefined
      }>
      {inner}
    </ScrollView>
  ) : (
    <View style={[styles.flex, { paddingTop, paddingBottom }]}>{inner}</View>
  );

  const content = (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      {header}
      {body}
    </View>
  );

  // A scrolling body handles the keyboard natively via
  // automaticallyAdjustKeyboardInsets above. KeyboardAvoidingView is only
  // needed for non-scrolling bodies, and driving the resize through JS layout
  // is what made taps land on the ScrollView and dismiss the keyboard.
  if (!keyboardAware || scroll) return content;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {content}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
  },
  padded: {
    paddingHorizontal: Spacing.four,
  },
});
