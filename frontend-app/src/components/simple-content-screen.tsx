import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { StackHeader } from '@/components/ui/stack-header';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Section {
  heading?: string;
  body: string;
}

export function SimpleContentScreen({ title, sections }: { title: string; sections: Section[] }) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StackHeader title={title} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}>
        {sections.map((section, index) => (
          <View key={index} style={{ marginBottom: Spacing.four }}>
            {section.heading ? <Text style={[styles.heading, { color: theme.text }]}>{section.heading}</Text> : null}
            <Text style={[styles.body, { color: theme.textSecondary }]}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
  },
});
