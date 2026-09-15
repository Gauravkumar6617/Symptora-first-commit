import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { StackHeader } from '@/components/ui/stack-header';
import { QuickLinkCard } from '@/components/ui/quick-link-card';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { specialties } from '@/data/catalog';
import { useTheme } from '@/hooks/use-theme';

export default function SpecialtiesScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StackHeader title="Specialties" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}>
        <View style={styles.grid}>
          {specialties.map((specialty) => (
            <QuickLinkCard
              key={specialty.slug}
              icon={specialty.icon}
              title={specialty.label}
              description={specialty.shortDescription}
              onPress={() => router.push(`/(info)/specialties/${specialty.slug}`)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
});
