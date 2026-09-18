import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Shadow, Spacing, TabBarHeight, Typography, tint } from '@/constants/theme';
import { selectionFeedback } from '@/lib/haptics';
import { useTheme } from '@/hooks/use-theme';

/** Per-route icon pair: [inactive, active]. */
export type TabIcons = Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]>;

/**
 * Floating tab bar shared by the patient and doctor tab groups. Built on the
 * `tabBar` prop of expo-router's JS tabs so the active item can get a tinted
 * pill instead of the default tint-only treatment.
 */
export function createAppTabBar(icons: TabIcons) {
  return function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    return (
      <View
        style={[
          styles.wrapper,
          Shadow.md,
          {
            paddingBottom: Math.max(insets.bottom, Spacing.two),
            backgroundColor: theme.tabBarBackground,
            borderTopColor: theme.border,
            shadowColor: theme.shadow,
          },
        ]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options.title ?? route.name);
          const [inactiveIcon, activeIcon] = icons[route.name] ?? ['ellipse-outline', 'ellipse'];

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              style={styles.item}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  selectionFeedback();
                  navigation.navigate(route.name, route.params);
                }
              }}
              onLongPress={() => {
                navigation.emit({ type: 'tabLongPress', target: route.key });
              }}>
              <View
                style={[
                  styles.iconPill,
                  focused ? { backgroundColor: tint(theme.primary, 0.12) } : null,
                ]}>
                <Ionicons
                  name={focused ? activeIcon : inactiveIcon}
                  size={21}
                  color={focused ? theme.primary : theme.tabBarInactive}
                />
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  { color: focused ? theme.primary : theme.tabBarInactive },
                ]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: Spacing.two,
    minHeight: TabBarHeight,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  iconPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  label: {
    ...Typography.overline,
    letterSpacing: 0.2,
    fontSize: 10,
  },
});
