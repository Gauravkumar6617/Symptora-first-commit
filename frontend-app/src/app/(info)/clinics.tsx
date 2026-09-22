import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { StackHeader } from '@/components/ui/stack-header';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing, Typography, tint } from '@/constants/theme';
import { clinicCities } from '@/data/mock/directory';
import { useClinics } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';

export default function ClinicsScreen() {
  const theme = useTheme();
  const { data: clinics, isLoading } = useClinics();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState<string | null>(null);

  const cities = useMemo(() => clinicCities(), []);

  const filtered = useMemo(() => {
    if (!clinics) return [];
    const needle = query.trim().toLowerCase();
    return clinics.filter((clinic) => {
      const matchesCity = !city || clinic.city === city;
      const matchesQuery =
        !needle ||
        clinic.name.toLowerCase().includes(needle) ||
        clinic.area.toLowerCase().includes(needle) ||
        clinic.services.some((service) => service.toLowerCase().includes(needle));
      return matchesCity && matchesQuery;
    });
  }, [clinics, city, query]);

  return (
    <Screen
      header={
        <StackHeader
          title="Partner clinics"
          subtitle={clinics ? `${clinics.length} clinics near you` : undefined}
          fallbackHref="/"
        />
      }>
      <TextField
        icon="search-outline"
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name, area or service"
        autoCorrect={false}
      />

      <View style={styles.filters}>
        <Chip label="All cities" selected={!city} onPress={() => setCity(null)} />
        {cities.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={city === item}
            onPress={() => setCity(city === item ? null : item)}
          />
        ))}
      </View>

      {isLoading ? (
        <SkeletonList count={3} lines={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="business-outline"
          title="No clinics match that"
          description="Try a different area, service, or clear the filters."
          actionLabel="Clear filters"
          onAction={() => {
            setQuery('');
            setCity(null);
          }}
        />
      ) : (
        <View style={{ gap: Spacing.three }}>
          {filtered.map((clinic) => (
            <Card key={clinic.id} style={styles.card}>
              <View style={styles.titleRow}>
                <Text style={[styles.name, { color: theme.text }]}>{clinic.name}</Text>
                <View style={[styles.rating, { backgroundColor: tint(theme.warning, 0.12) }]}>
                  <Ionicons name="star" size={12} color={theme.warning} />
                  <Text style={[styles.ratingText, { color: theme.warning }]}>{clinic.rating}</Text>
                </View>
              </View>

              <Text style={[styles.address, { color: theme.textSecondary }]}>{clinic.address}</Text>

              <View style={styles.metaRow}>
                <Ionicons name="navigate-outline" size={13} color={theme.textSecondary} />
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  {clinic.distanceKm} km · {clinic.area}, {clinic.city}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={13} color={theme.textSecondary} />
                <Text style={[styles.meta, { color: theme.textSecondary }]}>{clinic.openHours}</Text>
              </View>

              <View style={styles.services}>
                {clinic.services.map((service) => (
                  <Chip key={service} label={service} />
                ))}
              </View>

              <View style={styles.actions}>
                <ClinicAction
                  icon="navigate"
                  label="Directions"
                  onPress={() =>
                    Linking.openURL(
                      `https://maps.google.com/?q=${encodeURIComponent(`${clinic.name} ${clinic.address}`)}`,
                    )
                  }
                />
                <ClinicAction
                  icon="call"
                  label="Call clinic"
                  onPress={() => Linking.openURL('tel:+918045678900')}
                />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

function ClinicAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Card
      variant="muted"
      onPress={onPress}
      style={[styles.action, { borderColor: tint(theme.primary, 0.25) }]}>
      <Ionicons name={icon} size={15} color={theme.primary} />
      <Text style={[styles.actionLabel, { color: theme.primary }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two - 2,
    marginVertical: Spacing.three,
  },
  card: {
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    ...Typography.smallStrong,
    flex: 1,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  ratingText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  address: {
    ...Typography.caption,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  meta: {
    ...Typography.caption,
  },
  services: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.two + 2,
  },
  actionLabel: {
    ...Typography.caption,
    fontWeight: '700',
  },
});
