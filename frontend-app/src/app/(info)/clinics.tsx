import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { StackHeader } from '@/components/ui/stack-header';
import { TextField } from '@/components/ui/text-field';
import { Spacing, Typography, tint } from '@/constants/theme';
import { useClinics } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';

export default function ClinicsScreen() {
  const theme = useTheme();
  const { data: clinics, isLoading, isError, refetch } = useClinics();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!clinics) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return clinics;
    return clinics.filter((clinic) =>
      [clinic.name, clinic.address, clinic.description, ...clinic.doctors.flatMap((d) => [d.name, d.specialization])]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle)),
    );
  }, [clinics, query]);

  return (
    <Screen
      header={
        <StackHeader
          title="Partner clinics"
          subtitle={clinics ? `${clinics.length} partner clinic${clinics.length === 1 ? '' : 's'}` : undefined}
          fallbackHref="/"
        />
      }>
      <TextField
        icon="search-outline"
        value={query}
        onChangeText={setQuery}
        placeholder="Search by clinic, area, doctor or specialty"
        autoCorrect={false}
      />

      <View style={{ marginTop: Spacing.three }}>
        {isLoading ? (
          <SkeletonList count={3} lines={3} />
        ) : isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn't load clinics"
            description="Check your connection and try again."
            actionLabel="Retry"
            onAction={() => refetch()}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="business-outline"
            title={clinics?.length ? 'No clinics match that' : 'No partner clinics yet'}
            description={clinics?.length ? 'Try a different name, area or specialty.' : 'Check back soon.'}
            actionLabel={clinics?.length ? 'Clear search' : undefined}
            onAction={clinics?.length ? () => setQuery('') : undefined}
          />
        ) : (
          <View style={{ gap: Spacing.three }}>
            {filtered.map((clinic) => {
              const specialties = [...new Set(clinic.doctors.map((d) => d.specialization))];
              return (
                <Card key={clinic.id} style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                  {clinic.picture_url ? (
                    <Image source={{ uri: clinic.picture_url }} style={styles.picture} contentFit="cover" />
                  ) : (
                    <View style={[styles.picture, styles.placeholder, { backgroundColor: tint(theme.primary, 0.12) }]}>
                      <Ionicons name="business" size={32} color={theme.primary} />
                    </View>
                  )}

                  <View style={styles.body}>
                    <Text style={[styles.name, { color: theme.text }]}>{clinic.name}</Text>
                    {clinic.description ? (
                      <Text style={[styles.address, { color: theme.textSecondary }]}>{clinic.description}</Text>
                    ) : null}
                    {clinic.address ? (
                      <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={13} color={theme.textSecondary} />
                        <Text style={[styles.meta, { color: theme.textSecondary, flex: 1 }]}>{clinic.address}</Text>
                      </View>
                    ) : null}
                    {clinic.doctors.length > 0 ? (
                      <View style={styles.metaRow}>
                        <Ionicons name="medkit-outline" size={13} color={theme.textSecondary} />
                        <Text style={[styles.meta, { color: theme.textSecondary, flex: 1 }]}>
                          {clinic.doctors.map((d) => d.name).join(', ')}
                        </Text>
                      </View>
                    ) : null}

                    {specialties.length > 0 ? (
                      <View style={styles.services}>
                        {specialties.map((specialty) => (
                          <Chip key={specialty} label={specialty} />
                        ))}
                      </View>
                    ) : null}

                    <View style={styles.actions}>
                      {clinic.address ? (
                        <ClinicAction
                          icon="navigate"
                          label="Directions"
                          onPress={() =>
                            Linking.openURL(
                              `https://maps.google.com/?q=${encodeURIComponent(`${clinic.name} ${clinic.address}`)}`,
                            )
                          }
                        />
                      ) : null}
                      {clinic.phone ? (
                        <ClinicAction
                          icon="call"
                          label="Call clinic"
                          onPress={() => Linking.openURL(`tel:${clinic.phone!.replace(/\s/g, '')}`)}
                        />
                      ) : null}
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </View>
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
  card: {
    gap: 6,
  },
  picture: {
    width: '100%',
    height: 130,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 6,
    padding: Spacing.three,
  },
  name: {
    ...Typography.smallStrong,
    flex: 1,
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
