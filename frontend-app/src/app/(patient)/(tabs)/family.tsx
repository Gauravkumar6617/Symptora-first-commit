import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Spacing, Typography } from '@/constants/theme';
import { relationshipLabel } from '@/lib/format';
import { useTheme } from '@/hooks/use-theme';
import { useFamilyStore } from '@/store/familyStore';

export default function FamilyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { members, removeMember } = useFamilyStore();

  function confirmRemove(id: string, name: string) {
    Alert.alert('Remove profile?', `${name} will be removed from your family profiles.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeMember(id) },
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
                  <Text style={[styles.lastCheck, { color: theme.textMuted }]}>{member.lastCheck}</Text>
                </View>
                <IconButton
                  icon="trash-outline"
                  size={34}
                  accessibilityLabel={`Remove ${member.name}`}
                  onPress={() => confirmRemove(member.id, member.name)}
                />
              </View>

              <View style={styles.actions}>
                <Button
                  label="Health Check"
                  icon="pulse"
                  size="sm"
                  variant="secondary"
                  style={styles.action}
                  onPress={() => router.push('/(patient)/health-check')}
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
          Family profiles are linked to your account. Relationship options match your Symptora record.
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
