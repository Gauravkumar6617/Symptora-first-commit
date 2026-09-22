import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { StackHeader } from '@/components/ui/stack-header';
import { Radius, Spacing, Typography, tint } from '@/constants/theme';
import { blogPosts, getBlogPostBySlug } from '@/data/mock/directory';
import { useTheme } from '@/hooks/use-theme';

export default function BlogPostScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return <Redirect href="/(info)/blog" />;
  }

  const related = blogPosts.filter((item) => item.slug !== post.slug).slice(0, 2);

  return (
    <Screen header={<StackHeader title={post.category} fallbackHref="/(info)/blog" />}>
      <Chip label={post.category} />
      <Text style={[styles.title, { color: theme.text }]}>{post.title}</Text>

      <View style={[styles.byline, { borderBottomColor: theme.border }]}>
        <View style={[styles.authorDot, { backgroundColor: tint(theme.primary, 0.14) }]}>
          <Ionicons name="person" size={14} color={theme.primary} />
        </View>
        <Text style={[styles.bylineText, { color: theme.textSecondary }]}>
          {post.author} · {post.date} · {post.readTime}
        </Text>
      </View>

      {post.content.map((paragraph, index) => (
        <Text key={index} style={[styles.paragraph, { color: theme.text }]}>
          {paragraph}
        </Text>
      ))}

      <Card variant="muted" style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={18} color={theme.primary} />
        <Text style={[styles.disclaimerText, { color: theme.textSecondary }]}>
          Health guides are general information, not a diagnosis. Run a Health Check or talk to a doctor
          about your own symptoms.
        </Text>
      </Card>

      <Button
        label="Run a Health Check"
        icon="pulse"
        onPress={() => router.push('/(patient)/health-check')}
        style={{ marginTop: Spacing.three }}
      />

      {related.length > 0 ? (
        <>
          <Text style={[styles.relatedHeading, { color: theme.text }]}>Keep reading</Text>
          <View style={{ gap: Spacing.two }}>
            {related.map((item) => (
              <Card
                key={item.slug}
                onPress={() => router.replace(`/(info)/blog/${item.slug}`)}
                style={styles.relatedCard}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.relatedCategory, { color: theme.primary }]}>
                    {item.category.toUpperCase()}
                  </Text>
                  <Text style={[styles.relatedTitle, { color: theme.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              </Card>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...Typography.display,
    fontSize: 24,
    lineHeight: 31,
    marginTop: Spacing.two,
  },
  byline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  authorDot: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bylineText: {
    ...Typography.caption,
  },
  paragraph: {
    ...Typography.body,
    lineHeight: 24,
    marginBottom: Spacing.three,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
  relatedHeading: {
    ...Typography.section,
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
  },
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  relatedCategory: {
    ...Typography.overline,
  },
  relatedTitle: {
    ...Typography.smallStrong,
    marginTop: 2,
  },
});
