import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { RiskBadge } from '@/components/ui/risk-badge';
import { Screen } from '@/components/ui/screen';
import { StackHeader } from '@/components/ui/stack-header';
import { Radius, RiskTone, Spacing, Typography, tint } from '@/constants/theme';
import { relativeTime } from '@/lib/format';
import { useTheme } from '@/hooks/use-theme';
import { useHealthHistory } from '@/hooks/use-health-history';
import type { RiskLevel } from '@/types';

const filters: { value: RiskLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function HealthCheckHistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { checks } = useHealthHistory();
  const [filter, setFilter] = useState<RiskLevel | 'all'>('all');

  const visible = useMemo(
    () => (filter === 'all' ? checks : checks.filter((check) => check.riskLevel === filter)),
    [checks, filter],
  );

  return (
    <Screen
      header={
        <StackHeader
          title="Health Check history"
          subtitle={`${checks.length} ${checks.length === 1 ? 'check' : 'checks'} saved`}
          fallbackHref="/(patient)/(tabs)"
        />
      }>
      <View style={styles.filters}>
        {filters.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            selected={filter === item.value}
            onPress={() => setFilter(item.value)}
          />
        ))}
      </View>

      {visible.length === 0 ? (
        <EmptyState
          icon="pulse-outline"
          title={checks.length === 0 ? 'No checks yet' : 'Nothing at this risk level'}
          description={
            checks.length === 0
              ? 'Run your first Health Check and your risk reports will collect here.'
              : 'Try a different filter to see your other reports.'
          }
          actionLabel={checks.length === 0 ? 'Start a Health Check' : 'Show all'}
          onAction={() =>
            checks.length === 0 ? router.push('/(patient)/health-check') : setFilter('all')
          }
        />
      ) : (
        <View style={{ gap: Spacing.three }}>
          {visible.map((check) => {
            const tone = RiskTone[check.riskLevel];
            return (
              <Card key={check.id} style={styles.card}>
                <View style={styles.row}>
                  <View style={[styles.scoreWrap, { backgroundColor: tint(tone.color, 0.12) }]}>
                    <Text style={[styles.score, { color: tone.color }]}>{check.score ?? '—'}</Text>
                  </View>

                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                      {check.title}
                    </Text>
                    <Text style={[styles.meta, { color: theme.textMuted }]}>
                      {relativeTime(check.createdAt)}
                      {check.forMember ? ` · for ${check.forMember}` : ''}
                    </Text>
                    <RiskBadge level={check.riskLevel} size="sm" />
                  </View>
                </View>

                {check.summary ? (
                  <Text style={[styles.summary, { color: theme.textSecondary }]}>{check.summary}</Text>
                ) : null}
              </Card>
            );
          })}
        </View>
      )}

      <Button
        label="New Health Check"
        icon="add"
        onPress={() => router.push('/(patient)/health-check')}
        style={{ marginTop: Spacing.four }}
      />

      <Card variant="muted" style={styles.note}>
        <Ionicons name="shield-checkmark-outline" size={16} color={theme.primary} />
        <Text style={[styles.noteText, { color: theme.textSecondary }]}>
          Symptom checks are saved to your Symptora record and shared with family who have their own login.
          Questionnaire Health Checks stay on this device.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    gap: Spacing.two - 2,
    marginBottom: Spacing.three,
  },
  card: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  scoreWrap: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    ...Typography.section,
    fontWeight: '800',
  },
  title: {
    ...Typography.smallStrong,
  },
  meta: {
    ...Typography.caption,
  },
  summary: {
    ...Typography.caption,
    lineHeight: 18,
  },
  note: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
    marginTop: Spacing.four,
  },
  noteText: {
    ...Typography.caption,
    flex: 1,
  },
});
