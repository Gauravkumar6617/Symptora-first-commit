import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { QuickLinkCard } from '@/components/ui/quick-link-card';
import { SectionHeaderRow } from '@/components/ui/section-link';
import { SpecialtyChip } from '@/components/ui/specialty-chip';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useBlogPosts, useCatalogDoctors, useFamilyMembers, useSpecialties } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';

export default function PatientHomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { data: members } = useFamilyMembers();
  const { data: specialties } = useSpecialties();
  const { data: doctors } = useCatalogDoctors();
  const { data: posts } = useBlogPosts();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + BottomTabInset },
      ]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Welcome back</Text>
          <Text style={[styles.greeting, { color: theme.text }]}>{user?.name?.split(' ')[0] ?? 'there'} 👋</Text>
        </View>
        <Pressable onPress={() => router.push('/(patient)/(tabs)/profile')} style={[styles.avatarButton, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="person" size={20} color={theme.primary} />
        </Pressable>
      </View>

      <Pressable style={[styles.hero, { backgroundColor: theme.primary }]} onPress={() => router.push('/(patient)/telemedicine')}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Know when it matters.</Text>
          <Text style={styles.heroSubtitle}>Run a Health Check and get a risk report in minutes.</Text>
          <View style={[styles.heroCta, { backgroundColor: theme.onPrimary }]}>
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>Start Health Check</Text>
          </View>
        </View>
        <Ionicons name="pulse" size={48} color="rgba(255,255,255,0.5)" />
      </Pressable>

      <SectionHeaderRow title="Browse by specialty" actionLabel="See all" onAction={() => router.push('/(info)/specialties')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specialtyRow}>
        {specialties?.map((specialty) => (
          <SpecialtyChip
            key={specialty.slug}
            specialty={specialty}
            onPress={() => router.push(`/(info)/specialties/${specialty.slug}`)}
          />
        ))}
      </ScrollView>

      <View style={styles.grid}>
        <QuickLinkCard
          icon="calendar"
          title="Book appointment"
          description="Pick a doctor and time slot"
          onPress={() => router.push('/(patient)/telemedicine')}
        />
        <QuickLinkCard
          icon="videocam"
          title="Start video consult"
          description="Talk to a doctor now"
          onPress={() => router.push('/(patient)/telemedicine')}
        />
        <QuickLinkCard
          icon="business"
          title="Find a clinic"
          description="In-person care near you"
          onPress={() => router.push('/(info)/clinics')}
        />
        <QuickLinkCard
          icon="people"
          title="Family profiles"
          description="Manage everyone in one place"
          onPress={() => router.push('/(patient)/(tabs)/family')}
        />
      </View>

      <SectionHeaderRow title="Top doctors" actionLabel="See all" onAction={() => router.push('/(patient)/telemedicine')} />
      <View style={{ gap: Spacing.two }}>
        {doctors?.slice(0, 3).map((doctor) => (
          <Card key={doctor.id} style={styles.doctorRow}>
            <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="person" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{doctor.name}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{doctor.specialty}</Text>
            </View>
            {doctor.availableToday ? <Badge label="Available" tone="success" /> : null}
          </Card>
        ))}
      </View>

      <SectionHeaderRow title="Health guides" actionLabel="See all" onAction={() => router.push('/(info)/blog')} />
      <View style={{ gap: Spacing.two }}>
        {posts?.slice(0, 2).map((post) => (
          <Pressable key={post.slug} onPress={() => router.push(`/(info)/blog/${post.slug}`)}>
            <Card style={{ gap: 4 }}>
              <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                {post.category}
              </Text>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{post.title}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }} numberOfLines={2}>
                {post.excerpt}
              </Text>
            </Card>
          </Pressable>
        ))}
      </View>

      <SectionHeaderRow title="Family" actionLabel="Manage" onAction={() => router.push('/(patient)/(tabs)/family')} />
      <View style={{ gap: Spacing.two }}>
        {members?.slice(0, 2).map((member) => (
          <Card key={member.id}>
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{member.name}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              {member.relation} · {member.age} yrs
            </Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
    gap: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 4,
    marginBottom: Spacing.two,
  },
  heroCta: {
    alignSelf: 'flex-start',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
  },
  specialtyRow: {
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
