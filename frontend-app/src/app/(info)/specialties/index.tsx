import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { QuickLinkCard } from '@/components/ui/quick-link-card';
import { Screen } from '@/components/ui/screen';
import { StackHeader } from '@/components/ui/stack-header';
import { TextField } from '@/components/ui/text-field';
import { Spacing, Typography } from '@/constants/theme';
import { specialties } from '@/data/specialties';
import { useTheme } from '@/hooks/use-theme';

export default function SpecialtiesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return specialties;
    return specialties.filter(
      (specialty) =>
        specialty.label.toLowerCase().includes(needle) ||
        specialty.shortDescription.toLowerCase().includes(needle) ||
        specialty.commonFor.some((item) => item.toLowerCase().includes(needle)),
    );
  }, [query]);

  return (
    <Screen
      header={<StackHeader title="Specialties" subtitle="Find the right kind of doctor" fallbackHref="/" />}>
      <TextField
        icon="search-outline"
        value={query}
        onChangeText={setQuery}
        placeholder="Search a specialty or symptom"
        autoCorrect={false}
      />

      <Text style={[styles.hint, { color: theme.textSecondary }]}>
        Not sure who to see? Start with a Health Check and we&apos;ll point you to the right specialty.
      </Text>

      {filtered.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No specialty matches that"
          description="Try a symptom instead, like rash, fever, or anxiety."
          actionLabel="Clear search"
          onAction={() => setQuery('')}
        />
      ) : (
        <View style={styles.grid}>
          {filtered.map((specialty) => (
            <QuickLinkCard
              key={specialty.slug}
              icon={specialty.icon}
              title={specialty.label}
              description={specialty.shortDescription}
              onPress={() => router.push(`/(info)/specialties/${specialty.slug}`)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...Typography.caption,
    marginVertical: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
});
