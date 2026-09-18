import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { StackHeader } from '@/components/ui/stack-header';
import { Spacing, Typography } from '@/constants/theme';
import { faqs, SUPPORT_EMAIL } from '@/data/content';
import { useTheme } from '@/hooks/use-theme';

export default function FaqScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen header={<StackHeader title="FAQ" subtitle="Answers before you start" fallbackHref="/" />}>
      <Text style={[styles.intro, { color: theme.textSecondary }]}>
        Everything people usually ask before running their first Health Check.
      </Text>

      <Accordion items={faqs} />

      <Card style={styles.helpCard}>
        <Text style={[styles.helpTitle, { color: theme.text }]}>Still stuck?</Text>
        <Text style={[styles.helpBody, { color: theme.textSecondary }]}>
          Write to {SUPPORT_EMAIL} or send us a message — we reply within one business day.
        </Text>
        <Button label="Contact support" size="sm" onPress={() => router.push('/(info)/contact')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    ...Typography.small,
    marginBottom: Spacing.three,
  },
  helpCard: {
    marginTop: Spacing.five,
    gap: Spacing.two,
  },
  helpTitle: {
    ...Typography.section,
  },
  helpBody: {
    ...Typography.small,
  },
});
