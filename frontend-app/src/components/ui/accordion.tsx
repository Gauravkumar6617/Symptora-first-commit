import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Spacing, Typography } from '@/constants/theme';
import { selectionFeedback } from '@/lib/haptics';
import { useTheme } from '@/hooks/use-theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface AccordionItem {
  question: string;
  answer: string;
}

export function Accordion({ items, initialOpen = 0 }: { items: AccordionItem[]; initialOpen?: number | null }) {
  const theme = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(initialOpen);

  function toggle(index: number) {
    selectionFeedback();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex((current) => (current === index ? null : index));
  }

  return (
    <View style={{ gap: Spacing.two }}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <Card key={item.question} padded={false}>
            <Pressable
              onPress={() => toggle(index)}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              style={styles.header}>
              <Text style={[styles.question, { color: theme.text }]}>{item.question}</Text>
              <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={17}
                color={theme.primary}
              />
            </Pressable>
            {isOpen ? (
              <View style={styles.body}>
                <Text style={[styles.answer, { color: theme.textSecondary }]}>{item.answer}</Text>
              </View>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  question: {
    ...Typography.smallStrong,
    flex: 1,
  },
  body: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  answer: {
    ...Typography.small,
    lineHeight: 21,
  },
});
