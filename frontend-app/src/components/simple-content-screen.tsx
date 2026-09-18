import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { StackHeader } from '@/components/ui/stack-header';
import { Radius, Spacing, Typography, tint } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Section {
  heading?: string;
  body: string;
}

interface SimpleContentScreenProps {
  title: string;
  sections: Section[];
  /** Shown above the sections, e.g. "Last updated 18 September 2026". */
  lastUpdated?: string;
  intro?: string;
}

/** Long-form content layout used by the legal and policy screens. */
export function SimpleContentScreen({ title, sections, lastUpdated, intro }: SimpleContentScreenProps) {
  const theme = useTheme();

  return (
    <Screen header={<StackHeader title={title} fallbackHref="/" />}>
      {lastUpdated ? (
        <View style={[styles.stamp, { backgroundColor: tint(theme.primary, 0.08) }]}>
          <Text style={[styles.stampText, { color: theme.primary }]}>Last updated {lastUpdated}</Text>
        </View>
      ) : null}

      {intro ? <Text style={[styles.intro, { color: theme.textSecondary }]}>{intro}</Text> : null}

      <View style={{ gap: Spacing.three }}>
        {sections.map((section, index) => (
          <Card key={section.heading ?? index} style={styles.card}>
            {section.heading ? (
              <View style={styles.headingRow}>
                <Text style={[styles.index, { color: theme.primary }]}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <Text style={[styles.heading, { color: theme.text }]}>{section.heading}</Text>
              </View>
            ) : null}
            <Text style={[styles.body, { color: theme.textSecondary }]}>{section.body}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stamp: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 5,
    borderRadius: Radius.full,
    marginBottom: Spacing.three,
  },
  stampText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  intro: {
    ...Typography.small,
    marginBottom: Spacing.three,
  },
  card: {
    gap: Spacing.two,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  index: {
    ...Typography.overline,
  },
  heading: {
    ...Typography.section,
    flex: 1,
  },
  body: {
    ...Typography.small,
    lineHeight: 21,
  },
});
