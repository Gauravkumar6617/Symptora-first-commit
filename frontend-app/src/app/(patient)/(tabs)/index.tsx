import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { PressScale } from '@/components/ui/press-scale';
import { QuickLinkCard } from '@/components/ui/quick-link-card';
import { RiskBadge } from '@/components/ui/risk-badge';
import { Screen } from '@/components/ui/screen';
import { SectionHeaderRow } from '@/components/ui/section-link';
import { SkeletonList } from '@/components/ui/skeleton';
import { SpecialtyChip } from '@/components/ui/specialty-chip';
import { Gradient, Radius, RiskTone, Spacing, Typography, tint } from '@/constants/theme';
import { formatDate, firstName, relationshipLabel, relativeTime } from '@/lib/format';
import { useBlogPosts, useCatalogDoctors, usePatientAppointments, useSpecialties } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { useFamilyStore } from '@/store/familyStore';
import { useHealthCheckStore } from '@/store/healthCheckStore';

export default function PatientHomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const members = useFamilyStore((state) => state.members);
  const loadMembers = useFamilyStore((state) => state.loadMembers);
  const checks = useHealthCheckStore((state) => state.checks);
  const { data: specialties } = useSpecialties();
  const { data: doctors, isLoading: doctorsLoading } = useCatalogDoctors();
  const { data: posts } = useBlogPosts();
  const { data: appointments } = usePatientAppointments();

  useEffect(() => {
    loadMembers().catch(() => {
      // Offline: the persisted list stays on screen.
    });
  }, [loadMembers]);

  const latestCheck = checks[0];
  const nextAppointment = appointments?.find((item) => item.status === 'scheduled');

  return (
    <Screen
      tabBarInset
      padded={false}
      header={
        <LinearGradient
          colors={Gradient.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + Spacing.three }]}>
          <View style={styles.headerRow}>
            <PressScale onPress={() => router.push('/(patient)/(tabs)/profile')}>
              <Avatar uri={user?.avatar_url} name={user ? `${user.first_name} ${user.last_name}` : undefined} size={44} />
            </PressScale>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcome}>Welcome back</Text>
              <Text style={styles.greeting}>{firstName(user)} 👋</Text>
            </View>
            <IconButton
              icon="notifications-outline"
              tone="onGradient"
              accessibilityLabel="Notifications"
              badgeCount={2}
              onPress={() => router.push('/(account)/notifications')}
            />
          </View>

          <PressScale onPress={() => router.push('/(patient)/health-check')} style={styles.heroCta}>
            <View style={styles.heroCtaInner}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>Know when it matters</Text>
                <Text style={styles.heroSubtitle}>
                  Answer a few questions and get a Low, Medium, or High risk report in about two minutes.
                </Text>
                <View style={styles.heroButton}>
                  <Ionicons name="pulse" size={14} color="#2563EB" />
                  <Text style={styles.heroButtonLabel}>Start Health Check</Text>
                </View>
              </View>
              <Ionicons name="pulse" size={54} color="rgba(255,255,255,0.35)" />
            </View>
          </PressScale>
        </LinearGradient>
      }>
      <View style={styles.body}>
        {latestCheck ? (
          <Card
            onPress={() => router.push('/(patient)/health-checks')}
            style={[styles.latestCard, { borderColor: tint(RiskTone[latestCheck.riskLevel].color, 0.35) }]}>
            <View style={styles.latestRow}>
              <View
                style={[
                  styles.latestScore,
                  { backgroundColor: tint(RiskTone[latestCheck.riskLevel].color, 0.12) },
                ]}>
                <Text style={[styles.latestScoreText, { color: RiskTone[latestCheck.riskLevel].color }]}>
                  {latestCheck.score ?? '—'}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.latestLabel, { color: theme.textSecondary }]}>LAST HEALTH CHECK</Text>
                <Text style={[styles.latestTitle, { color: theme.text }]} numberOfLines={1}>
                  {latestCheck.title}
                </Text>
                <View style={styles.latestMetaRow}>
                  <RiskBadge level={latestCheck.riskLevel} size="sm" />
                  <Text style={[styles.latestMeta, { color: theme.textMuted }]}>
                    {relativeTime(latestCheck.createdAt)}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </View>
          </Card>
        ) : null}

        {nextAppointment ? (
          <Card
            onPress={() => router.push('/(patient)/(tabs)/appointments')}
            style={styles.nextCard}>
            <View style={[styles.nextIcon, { backgroundColor: tint(theme.primary, 0.12) }]}>
              <Ionicons
                name={nextAppointment.mode === 'video' ? 'videocam' : 'business'}
                size={19}
                color={theme.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nextLabel, { color: theme.textSecondary }]}>NEXT APPOINTMENT</Text>
              <Text style={[styles.nextTitle, { color: theme.text }]} numberOfLines={1}>
                {nextAppointment.doctorName}
              </Text>
              <Text style={[styles.nextMeta, { color: theme.textSecondary }]}>
                {formatDate(nextAppointment.date)} · {nextAppointment.time}
              </Text>
            </View>
            <Badge label={nextAppointment.mode === 'video' ? 'Video' : 'Clinic'} tone="primary" />
          </Card>
        ) : null}

        <SectionHeaderRow
          title="Browse by specialty"
          actionLabel="See all"
          onAction={() => router.push('/(info)/specialties')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialtyRow}>
          {specialties?.map((specialty) => (
            <SpecialtyChip
              key={specialty.slug}
              specialty={specialty}
              onPress={() => router.push(`/(info)/specialties/${specialty.slug}`)}
            />
          ))}
        </ScrollView>

        <SectionHeaderRow title="Quick actions" />
        <View style={styles.grid}>
          <QuickLinkCard
            icon="pulse"
            title="New Health Check"
            description="Get a risk report in minutes"
            onPress={() => router.push('/(patient)/health-check')}
          />
          <QuickLinkCard
            icon="videocam"
            title="Video consult"
            description="Talk to a doctor now"
            tone="teal"
            onPress={() => router.push('/(patient)/telemedicine')}
          />
          <QuickLinkCard
            icon="business"
            title="Find a clinic"
            description="In-person care near you"
            tone="warning"
            onPress={() => router.push('/(info)/clinics')}
          />
          <QuickLinkCard
            icon="people"
            title="Family profiles"
            description="Manage everyone in one place"
            tone="success"
            onPress={() => router.push('/(patient)/(tabs)/family')}
          />
        </View>

        <SectionHeaderRow
          title="Top doctors"
          actionLabel="See all"
          onAction={() => router.push('/(patient)/telemedicine')}
        />
        {doctorsLoading ? (
          <SkeletonList count={2} lines={1} />
        ) : (
          <View style={{ gap: Spacing.two }}>
            {doctors?.slice(0, 3).map((doctor) => (
              <Card
                key={doctor.id}
                onPress={() => router.push(`/(patient)/doctors/${doctor.id}`)}
                style={styles.doctorRow}>
                <Avatar name={doctor.name.replace('Dr. ', '')} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.doctorName, { color: theme.text }]} numberOfLines={1}>
                    {doctor.name}
                  </Text>
                  <Text style={[styles.doctorMeta, { color: theme.textSecondary }]} numberOfLines={1}>
                    {doctor.specialty} · ₹{doctor.fee}
                  </Text>
                </View>
                {doctor.availableToday ? <Badge label="Available" tone="success" /> : null}
              </Card>
            ))}
          </View>
        )}

        <SectionHeaderRow
          title="Health guides"
          actionLabel="See all"
          onAction={() => router.push('/(info)/blog')}
        />
        <View style={{ gap: Spacing.two }}>
          {posts?.slice(0, 2).map((post) => (
            <Card
              key={post.slug}
              onPress={() => router.push(`/(info)/blog/${post.slug}`)}
              style={{ gap: 4 }}>
              <Text style={[styles.postCategory, { color: theme.primary }]}>
                {post.category.toUpperCase()}
              </Text>
              <Text style={[styles.postTitle, { color: theme.text }]}>{post.title}</Text>
              <Text style={[styles.postExcerpt, { color: theme.textSecondary }]} numberOfLines={2}>
                {post.excerpt}
              </Text>
            </Card>
          ))}
        </View>

        <SectionHeaderRow
          title="Family"
          actionLabel="Manage"
          onAction={() => router.push('/(patient)/(tabs)/family')}
        />
        <View style={{ gap: Spacing.two }}>
          {members.slice(0, 2).map((member) => (
            <Card key={member.id} style={styles.doctorRow}>
              <Avatar name={member.name} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.doctorName, { color: theme.text }]}>{member.name}</Text>
                <Text style={[styles.doctorMeta, { color: theme.textSecondary }]}>
                  {relationshipLabel(member.relation)} · {member.age} yrs
                </Text>
              </View>
              <Text style={[styles.doctorMeta, { color: theme.textMuted }]}>{member.lastCheck}</Text>
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    gap: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  welcome: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  greeting: {
    ...Typography.heading,
    color: '#FFFFFF',
  },
  heroCta: {
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.14)',
    padding: Spacing.three,
  },
  heroCtaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    ...Typography.section,
    color: '#FFFFFF',
  },
  heroSubtitle: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 17,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: 7,
    marginTop: Spacing.two - 2,
  },
  heroButtonLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: '#2563EB',
  },
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  latestCard: {
    marginBottom: Spacing.two,
  },
  latestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  latestScore: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  latestScoreText: {
    ...Typography.section,
    fontWeight: '800',
  },
  latestLabel: {
    ...Typography.overline,
  },
  latestTitle: {
    ...Typography.smallStrong,
  },
  latestMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  latestMeta: {
    ...Typography.caption,
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  nextIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLabel: {
    ...Typography.overline,
  },
  nextTitle: {
    ...Typography.smallStrong,
    marginTop: 1,
  },
  nextMeta: {
    ...Typography.caption,
  },
  specialtyRow: {
    gap: Spacing.three - 4,
    paddingVertical: Spacing.one,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  doctorName: {
    ...Typography.smallStrong,
  },
  doctorMeta: {
    ...Typography.caption,
    textTransform: 'capitalize',
  },
  postCategory: {
    ...Typography.overline,
  },
  postTitle: {
    ...Typography.smallStrong,
  },
  postExcerpt: {
    ...Typography.caption,
  },
});
