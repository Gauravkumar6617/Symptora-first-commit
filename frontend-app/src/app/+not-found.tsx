import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Radius, Spacing, Typography, tint } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function NotFoundScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.iconWrap, { backgroundColor: tint(theme.primary, 0.1) }]}>
        <Ionicons name="compass-outline" size={34} color={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>This page took a wrong turn</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        The screen you were looking for does not exist. Let&apos;s get you back to safety.
      </Text>
      <Button label="Go to home" icon="home-outline" onPress={() => router.replace('/')} style={styles.action} />
      <Button
        label="Contact support"
        variant="ghost"
        size="sm"
        onPress={() => router.replace('/(info)/contact')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    ...Typography.heading,
    textAlign: 'center',
  },
  body: {
    ...Typography.small,
    textAlign: 'center',
    maxWidth: 320,
  },
  action: {
    marginTop: Spacing.three,
    minWidth: 220,
  },
});
