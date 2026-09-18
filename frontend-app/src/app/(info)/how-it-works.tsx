import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GradientHeader } from '@/components/ui/gradient-header';
import { Screen } from '@/components/ui/screen';
import { SectionHeaderRow } from '@/components/ui/section-link';
import { StatGrid, StatTile } from '@/components/ui/stat-tile';
import { Radius, Spacing, Typography, tint } from '@/constants/theme';
import { APP_NAME, comparisonRows, howItWorks, telemedicineFeatures, trustStats } from '@/data/content';
import { useTheme } from '@/hooks/use-theme';

export default function HowItWorksScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen
      header={
        <GradientHeader
          title="How Symptora works"
          subtitle="From a symptom to the right kind of care, in three steps."
          back
          fallbackHref="/">
          <StatGrid>
            {trustStats.map((stat) => (
              <StatTile key={stat.label} value={stat.value} label={stat.label} onGradient />
            ))}
          </StatGrid>
        </GradientHeader>
      }>
      <SectionHeaderRow title="The three steps" />
      <View style={{ gap: Spacing.three }}>
        {howItWorks.map((step, index) => (
          <Card key={step.title} style={styles.stepCard}>
            <View style={[styles.stepNumber, { backgroundColor: tint(theme.primary, 0.12) }]}>
              <Text style={[styles.stepNumberText, { color: theme.primary }]}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={styles.stepTitleRow}>
                <Ionicons name={step.icon} size={16} color={theme.primary} />
                <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
              </View>
              <Text style={[styles.stepBody, { color: theme.textSecondary }]}>{step.description}</Text>
            </View>
          </Card>
        ))}
      </View>

      <SectionHeaderRow title="What you get in a consult" />
      <View style={styles.featureGrid}>
        {telemedicineFeatures.map((feature) => (
          <Card key={feature.title} style={styles.featureCard}>
            <View style={[styles.iconWrap, { backgroundColor: tint(theme.teal, 0.12) }]}>
              <Ionicons name={feature.icon} size={19} color={theme.teal} />
            </View>
            <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
            <Text style={[styles.featureBody, { color: theme.textSecondary }]}>{feature.description}</Text>
          </Card>
        ))}
      </View>

      <SectionHeaderRow title={`${APP_NAME} vs. figuring it out yourself`} />
      <Card padded={false} style={styles.table}>
        <View style={[styles.tableHead, { backgroundColor: tint(theme.primary, 0.08) }]}>
          <Text style={[styles.tableHeadCell, styles.tableLabelCell, { color: theme.textSecondary }]}>
            What matters
          </Text>
          <Text style={[styles.tableHeadCell, styles.tableMarkCell, { color: theme.primary }]}>
            {APP_NAME}
          </Text>
          <Text style={[styles.tableHeadCell, styles.tableMarkCell, { color: theme.textSecondary }]}>
            Old way
          </Text>
        </View>
        {comparisonRows.map((row, index) => (
          <View
            key={row.label}
            style={[
              styles.tableRow,
              {
                backgroundColor: index % 2 === 0 ? 'transparent' : theme.cardMuted,
                borderTopColor: theme.border,
              },
            ]}>
            <Text style={[styles.tableLabel, styles.tableLabelCell, { color: theme.text }]}>{row.label}</Text>
            <View style={styles.tableMarkCell}>
              <Ionicons
                name={row.symptora ? 'checkmark-circle' : 'close-circle'}
                size={19}
                color={row.symptora ? theme.success : theme.danger}
              />
            </View>
            <View style={styles.tableMarkCell}>
              <Ionicons
                name={row.oldWay ? 'checkmark-circle' : 'close-circle'}
                size={19}
                color={theme.textMuted}
              />
            </View>
          </View>
        ))}
      </Card>

      <View style={styles.actions}>
        <Button
          label="Start a Health Check"
          icon="pulse"
          onPress={() => router.push('/(patient)/health-check')}
        />
        <Button
          label="Read the FAQ"
          variant="outline"
          onPress={() => router.push('/(info)/faq')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...Typography.smallStrong,
    fontWeight: '800',
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepTitle: {
    ...Typography.smallStrong,
  },
  stepBody: {
    ...Typography.caption,
    lineHeight: 18,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  featureCard: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 3,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  featureTitle: {
    ...Typography.smallStrong,
  },
  featureBody: {
    ...Typography.caption,
  },
  table: {
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  tableHeadCell: {
    ...Typography.overline,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three - 4,
    paddingHorizontal: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tableLabelCell: {
    flex: 1,
  },
  tableMarkCell: {
    width: 64,
    alignItems: 'center',
  },
  tableLabel: {
    ...Typography.caption,
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.five,
  },
});
