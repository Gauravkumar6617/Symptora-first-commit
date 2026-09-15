import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useFamilyMembers } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';

export default function FamilyScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data: members, isLoading } = useFamilyMembers();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + BottomTabInset },
      ]}>
      <ScreenHeader title="Family" subtitle="Manage health profiles for everyone you care for" />

      {isLoading ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <View style={{ gap: Spacing.three }}>
          {members?.map((member) => (
            <Card key={member.id} style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
                <Ionicons name="person" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: theme.text }]}>{member.name}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  {member.relation} · {member.age} yrs
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{member.lastCheck}</Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
});
