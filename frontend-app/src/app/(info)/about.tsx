import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GradientHeader } from '@/components/ui/gradient-header';
import { Screen } from '@/components/ui/screen';
import { SectionHeaderRow } from '@/components/ui/section-link';
import { StatGrid, StatTile } from '@/components/ui/stat-tile';
import { Gradient, Radius, Spacing, Typography, tint } from '@/constants/theme';
import { aboutStats, APP_NAME, APP_TAGLINE, brandValues, ourStory, testimonials } from '@/data/content';
import { useTheme } from '@/hooks/use-theme';

export default function AboutScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen
      header={
        <GradientHeader
          title="Healthcare shouldn't start with a guessing game"
          subtitle={APP_TAGLINE}
          back
          fallbackHref="/">
          <StatGrid>
            {aboutStats.map((stat) => (
              <StatTile key={stat.label} value={stat.value} label={stat.label} onGradient />
            ))}
          </StatGrid>
        </GradientHeader>
      }>
      <SectionHeaderRow title="Our mission" />
      <Card>
        <Text style={[styles.body, { color: theme.text }]}>
          {APP_NAME} was built to close the gap between &quot;something feels off&quot; and &quot;I&apos;m
          talking to a doctor&quot; — with a quick risk assessment, family profiles, and telemedicine that
          connects you automatically when it&apos;s serious.
        </Text>
      </Card>

      <SectionHeaderRow title="Our story" />
      <Card variant="muted">
        <Text style={[styles.body, { color: theme.textSecondary }]}>{ourStory}</Text>
      </Card>

      <SectionHeaderRow title="What we stand for" />
      <View style={styles.valueGrid}>
        {brandValues.map((value) => (
          <Card key={value.title} style={styles.valueCard}>
            <View style={[styles.iconWrap, { backgroundColor: tint(theme.primary, 0.12) }]}>
              <Ionicons name={value.icon} size={20} color={theme.primary} />
            </View>
            <Text style={[styles.valueTitle, { color: theme.text }]}>{value.title}</Text>
            <Text style={[styles.valueBody, { color: theme.textSecondary }]}>{value.description}</Text>
          </Card>
        ))}
      </View>

      <SectionHeaderRow title="Trusted by families like yours" />
      <View style={{ gap: Spacing.three }}>
        {testimonials.map((item) => (
          <Card key={item.name} style={{ gap: Spacing.two }}>
            <Ionicons name="chatbox-ellipses" size={20} color={tint(theme.primary, 0.6)} />
            <Text style={[styles.quote, { color: theme.text }]}>&ldquo;{item.quote}&rdquo;</Text>
            <View style={styles.quoteFooter}>
              <View>
                <Text style={[styles.quoteName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.quoteRole, { color: theme.textSecondary }]}>{item.role}</Text>
              </View>
              <View style={styles.stars}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Ionicons key={index} name="star" size={12} color={theme.warning} />
                ))}
              </View>
            </View>
          </Card>
        ))}
      </View>

      <LinearGradient
        colors={Gradient.brandDeep}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cta}>
        <Text style={styles.ctaTitle}>Are you a practising doctor?</Text>
        <Text style={styles.ctaBody}>
          Join {APP_NAME} and offer telemedicine consultations to the patients who need you most.
        </Text>
        <Button
          label="Apply as a doctor"
          variant="secondary"
          size="sm"
          onPress={() => router.push('/(patient)/apply-doctor')}
          style={styles.ctaButton}
        />
      </LinearGradient>

      <Card style={styles.contactCard}>
        <Ionicons name="heart-circle" size={28} color={theme.primary} />
        <Text style={[styles.contactText, { color: theme.textSecondary }]}>
          Have questions about {APP_NAME}, partnerships, or press? We&apos;d love to hear from you.
        </Text>
        <Button
          label="Contact us"
          variant="outline"
          size="sm"
          onPress={() => router.push('/(info)/contact')}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    ...Typography.body,
    lineHeight: 23,
  },
  valueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  valueCard: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 4,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  valueTitle: {
    ...Typography.smallStrong,
  },
  valueBody: {
    ...Typography.caption,
  },
  quote: {
    ...Typography.small,
    lineHeight: 21,
  },
  quoteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  quoteName: {
    ...Typography.smallStrong,
  },
  quoteRole: {
    ...Typography.caption,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  cta: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.two,
    marginTop: Spacing.five,
  },
  ctaTitle: {
    ...Typography.heading,
    color: '#FFFFFF',
  },
  ctaBody: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.88)',
  },
  ctaButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
    minWidth: 180,
  },
  contactCard: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  contactText: {
    ...Typography.small,
    textAlign: 'center',
  },
});
