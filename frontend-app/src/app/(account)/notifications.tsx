import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { StackHeader } from '@/components/ui/stack-header';
import { Radius, Spacing, Typography, tint } from '@/constants/theme';
import { relativeTime } from '@/lib/format';
import { useNotifications } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';
import type { AppNotification } from '@/types';

const kindMeta: Record<
  AppNotification['kind'],
  { icon: keyof typeof Ionicons.glyphMap; tone: 'primary' | 'danger' | 'warning' | 'teal' }
> = {
  appointment: { icon: 'calendar', tone: 'primary' },
  result: { icon: 'pulse', tone: 'danger' },
  reminder: { icon: 'alarm', tone: 'warning' },
  system: { icon: 'sparkles', tone: 'teal' },
};

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data, isLoading } = useNotifications();
  const [readIds, setReadIds] = useState<string[]>([]);

  const notifications = useMemo(
    () => data?.map((item) => ({ ...item, read: item.read || readIds.includes(item.id) })) ?? [],
    [data, readIds],
  );
  const unread = notifications.filter((item) => !item.read).length;

  return (
    <Screen
      header={
        <StackHeader
          title="Notifications"
          subtitle={unread > 0 ? `${unread} unread` : 'All caught up'}
          fallbackHref="/"
          right={
            unread > 0 ? (
              <Text
                onPress={() => setReadIds(notifications.map((item) => item.id))}
                style={[styles.markAll, { color: theme.primary }]}>
                Mark all
              </Text>
            ) : undefined
          }
        />
      }>
      {isLoading ? (
        <SkeletonList count={4} lines={2} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="Nothing here yet"
          description="Appointment reminders and Health Check results will show up here."
        />
      ) : (
        <View style={{ gap: Spacing.two }}>
          {notifications.map((item) => {
            const meta = kindMeta[item.kind];
            return (
              <Card
                key={item.id}
                onPress={() => {
                  setReadIds((current) => (current.includes(item.id) ? current : [...current, item.id]));
                  if (item.kind === 'appointment') router.push('/(patient)/(tabs)/appointments');
                  if (item.kind === 'result') router.push('/(patient)/health-checks');
                }}
                style={[
                  styles.card,
                  item.read ? null : { borderColor: tint(theme.primary, 0.35) },
                ]}>
                <View style={[styles.iconWrap, { backgroundColor: tint(theme[meta.tone], 0.12) }]}>
                  <Ionicons name={meta.icon} size={18} color={theme[meta.tone]} />
                </View>

                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.read ? null : <View style={[styles.dot, { backgroundColor: theme.primary }]} />}
                  </View>
                  <Text style={[styles.body, { color: theme.textSecondary }]} numberOfLines={2}>
                    {item.body}
                  </Text>
                  <Text style={[styles.time, { color: theme.textMuted }]}>
                    {relativeTime(item.createdAt)}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  markAll: {
    ...Typography.caption,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    gap: Spacing.three - 4,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    ...Typography.smallStrong,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  body: {
    ...Typography.caption,
    lineHeight: 18,
  },
  time: {
    ...Typography.caption,
    marginTop: 2,
  },
});
