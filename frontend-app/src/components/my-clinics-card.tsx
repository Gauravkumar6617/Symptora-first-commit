import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AlertBanner } from '@/components/ui/alert-banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeaderRow } from '@/components/ui/section-link';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import { Skeleton } from '@/components/ui/skeleton';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, assignDoctorToClinic, fetchClinicOptions, fetchMyClinicLinks } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { ClinicRecord, DoctorClinicLink } from '@/types';

/** Lets an approved doctor join a clinic they practice at — mirrors the web
 * dashboard's "My clinics" card (POST /doctor/clinics/{id}/assign). */
export function MyClinicsCard() {
  const theme = useTheme();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [clinics, setClinics] = useState<ClinicRecord[]>([]);
  const [myLinks, setMyLinks] = useState<DoctorClinicLink[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!accessToken);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    Promise.all([fetchClinicOptions(accessToken), fetchMyClinicLinks(accessToken)])
      .then(([allClinics, mine]) => {
        if (cancelled) return;
        setClinics(allClinics);
        setMyLinks(mine);
      })
      .catch(() => {
        // Best-effort: leave the lists empty if either call fails.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const joinedClinicIds = useMemo(() => new Set(myLinks.map((link) => link.clinic_id)), [myLinks]);
  const clinicsById = useMemo(() => new Map(clinics.map((clinic) => [clinic.id, clinic])), [clinics]);
  const joinableOptions: SelectOption<string>[] = useMemo(
    () =>
      clinics
        .filter((clinic) => !joinedClinicIds.has(clinic.id))
        .map((clinic) => ({ value: clinic.id, label: clinic.name })),
    [clinics, joinedClinicIds],
  );

  async function handleJoin() {
    if (!accessToken || !selectedClinicId) return;
    setError('');
    setJoining(true);
    try {
      const link = await assignDoctorToClinic(accessToken, selectedClinicId);
      setMyLinks((prev) => [...prev, link]);
      setSelectedClinicId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not join that clinic.');
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <View>
        <SectionHeaderRow title="My clinics" />
        <Skeleton height={72} />
      </View>
    );
  }

  return (
    <View>
      <SectionHeaderRow title="My clinics" subtitle="Clinics you currently practice at" />

      {myLinks.length > 0 ? (
        <View style={{ gap: Spacing.two }}>
          {myLinks.map((link) => (
            <ListRow
              key={link.id}
              icon="business-outline"
              label={clinicsById.get(link.clinic_id)?.name ?? 'Clinic'}
            />
          ))}
        </View>
      ) : null}

      {joinableOptions.length > 0 ? (
        <Card style={styles.joinCard}>
          <SelectField
            label="Join a clinic"
            placeholder="Choose a clinic"
            value={selectedClinicId}
            options={joinableOptions}
            onChange={setSelectedClinicId}
          />
          <Button
            label={joining ? 'Joining…' : 'Join clinic'}
            onPress={handleJoin}
            loading={joining}
            disabled={!selectedClinicId}
            size="sm"
            style={styles.joinButton}
          />
        </Card>
      ) : (
        clinics.length > 0 &&
        myLinks.length === clinics.length && (
          <Text style={[styles.allJoined, { color: theme.textSecondary }]}>
            You&apos;re linked to every listed clinic.
          </Text>
        )
      )}

      {error ? <AlertBanner tone="error" message={error} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  joinCard: {
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  joinButton: {
    alignSelf: 'flex-start',
  },
  allJoined: {
    ...Typography.small,
    marginTop: Spacing.two,
  },
});
