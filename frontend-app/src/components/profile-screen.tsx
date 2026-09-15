import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';

export function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    router.replace('/(auth)/login');
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + BottomTabInset },
      ]}>
      <ScreenHeader title="Profile" subtitle="Your account details" />

      <Card style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="person" size={28} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]}>{user?.name}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{user?.email}</Text>
          {user?.specialization ? (
            <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700', marginTop: 2 }}>
              {user.specialization}
            </Text>
          ) : null}
        </View>
      </Card>

      <View style={{ gap: Spacing.two, marginTop: Spacing.three }}>
        <InfoRow label="Phone" value={user?.phone ?? 'Not set'} />
        <InfoRow label="Address" value={user?.address ?? 'Not set'} />
        <InfoRow label="Role" value={user?.role === 'doctor' ? 'Doctor' : 'Patient'} />
      </View>

      <Text style={[styles.moreTitle, { color: theme.text }]}>More</Text>
      <View style={{ gap: Spacing.two }}>
        <MenuRow icon="medkit-outline" label="Specialties" onPress={() => router.push('/(info)/specialties')} />
        <MenuRow icon="business-outline" label="Partner clinics" onPress={() => router.push('/(info)/clinics')} />
        <MenuRow icon="book-outline" label="Health guides" onPress={() => router.push('/(info)/blog')} />
        {user?.role === 'patient' ? (
          <MenuRow icon="briefcase-outline" label="Apply as a doctor" onPress={() => router.push('/(patient)/apply-doctor')} />
        ) : null}
        <MenuRow icon="information-circle-outline" label="About Symptora" onPress={() => router.push('/(info)/about')} />
        <MenuRow icon="mail-outline" label="Contact us" onPress={() => router.push('/(info)/contact')} />
        <MenuRow icon="shield-checkmark-outline" label="Privacy policy" onPress={() => router.push('/(info)/legal/privacy')} />
        <MenuRow icon="document-text-outline" label="Terms of service" onPress={() => router.push('/(info)/legal/terms')} />
      </View>

      <View style={{ marginTop: Spacing.five }}>
        <Button label="Log out" variant="outline" onPress={handleLogout} />
      </View>
    </ScrollView>
  );
}

function MenuRow({
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
    <Pressable onPress={onPress}>
      <Card style={styles.menuRow}>
        <Ionicons name={icon} size={18} color={theme.primary} />
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600', flex: 1 }}>{label}</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
      </Card>
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <Card style={styles.infoRow}>
      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moreTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
