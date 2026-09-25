import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AlertBanner } from '@/components/ui/alert-banner';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Spacing, Typography } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { relationshipLabel, relativeTime } from '@/lib/format';
import { useChecks } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';
import { useFamilyStore } from '@/store/familyStore';
import type { SymptomCheck } from '@/types';

export default function FamilyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { members, loadMembers, removeMember, inviteMember } = useFamilyStore();
  const { data: checks, refetch: refetchChecks } = useChecks();
  const [inviting, setInviting] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  /** Newest saved check per family member (the list comes newest first). */
  const latestCheck = useMemo(() => {
    const latest = new Map<string, SymptomCheck>();
    for (const check of checks ?? []) {
      if (check.family_member_id && !latest.has(check.family_member_id)) {
        latest.set(check.family_member_id, check);
      }
    }
    return latest;
  }, [checks]);

  async function invite(id: string) {
    setInviting(id);
    setNotice(null);
    try {
      setNotice({ tone: 'success', message: await inviteMember(id) });
    } catch (error) {
      setNotice({
        tone: 'error',
        message: error instanceof ApiError ? error.message : 'Could not send the invite. Please try again.',
      });
    } finally {
      setInviting(null);
    }
  }

  // Refresh on focus so members added on the website show up here too.
  useFocusEffect(
    useCallback(() => {
      loadMembers().catch(() => {
        // Keep showing the last-known list; the next focus retries.
      });
      refetchChecks();
    }, [loadMembers, refetchChecks]),
  );

  async function remove(id: string) {
    try {
      await removeMember(id);
    } catch (error) {
      Alert.alert(
        'Could not remove profile',
        error instanceof ApiError ? error.message : 'Please try again.',
      );
    }
  }

  function confirmRemove(id: string, name: string) {
    Alert.alert('Remove profile?', `${name} will be removed from your family profiles.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove(id) },
    ]);
  }

  return (
    <Screen tabBarInset topInset>
      <ScreenHeader
        title="Family"
        subtitle="Health profiles for everyone you care for"
        right={
          <IconButton
            icon="person-add-outline"
            tone="primary"
            accessibilityLabel="Add family member"
            onPress={() => router.push('/(patient)/add-family-member')}
          />
        }
      />

      {notice ? <AlertBanner tone={notice.tone} message={notice.message} /> : null}

      {members.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No family profiles yet"
          description="Add a parent, child, or partner to run Health Checks and book appointments for them."
          actionLabel="Add family member"
          onAction={() => router.push('/(patient)/add-family-member')}
        />
      ) : (
        <View style={{ gap: Spacing.three }}>
          {members.map((member) => (
            <Card key={member.id} style={styles.card}>
              <View style={styles.row}>
                <Avatar name={member.name} size={46} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.text }]}>{member.name}</Text>
                  <Text style={[styles.meta, { color: theme.textSecondary }]}>
                    {relationshipLabel(member.relation)} · {member.age} yrs
                  </Text>
                  <Text style={[styles.lastCheck, { color: theme.textMuted }]} numberOfLines={1}>
                    {(() => {
                      const last = latestCheck.get(member.id);
                      return last
                        ? `Last check: ${last.predictions[0]?.label ?? 'Symptom check'} · ${relativeTime(last.created_at)}`
                        : 'No checks yet';
                    })()}
                  </Text>
                </View>
                <IconButton
                  icon="trash-outline"
                  size={34}
                  accessibilityLabel={`Remove ${member.name}`}
                  onPress={() => confirmRemove(member.id, member.name)}
                />
              </View>

              <View style={styles.statusRow}>
                {member.hasAccount ? (
                  <Badge label="Has their own login" tone="success" icon="checkmark-circle" />
                ) : member.email ? (
                  <Text style={[styles.meta, { color: theme.textMuted, flex: 1 }]} numberOfLines={1}>
                    Not joined yet · {member.email}
                  </Text>
                ) : (
                  <Text style={[styles.meta, { color: theme.textMuted }]}>Add an email to invite them</Text>
                )}
                {!member.hasAccount && member.email ? (
                  <Button
                    label="Invite"
                    icon="mail-outline"
                    size="sm"
                    variant="ghost"
                    loading={inviting === member.id}
                    onPress={() => invite(member.id)}
                  />
                ) : null}
              </View>

              <View style={styles.actions}>
                <Button
                  label="Check symptoms"
                  icon="pulse"
                  size="sm"
                  variant="secondary"
                  style={styles.action}
                  onPress={() =>
                    router.push({ pathname: '/(patient)/symptom-checker', params: { member: member.id } })
                  }
                />
                <Button
                  label="Book consult"
                  icon="calendar-outline"
                  size="sm"
                  variant="outline"
                  style={styles.action}
                  onPress={() => router.push('/(patient)/telemedicine')}
                />
              </View>
            </Card>
          ))}
        </View>
      )}

      <Card variant="muted" style={styles.note}>
        <Ionicons name="lock-closed-outline" size={16} color={theme.primary} />
        <Text style={[styles.noteText, { color: theme.textSecondary }]}>
          Add a member&apos;s email and phone to invite them. Once they activate their own login, you both see
          their health checks.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three - 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  name: {
    ...Typography.smallStrong,
    fontSize: 15,
  },
  meta: {
    ...Typography.caption,
  },
  lastCheck: {
    ...Typography.caption,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    minHeight: 32,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
  },
  note: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
    marginTop: Spacing.four,
  },
  noteText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
});
