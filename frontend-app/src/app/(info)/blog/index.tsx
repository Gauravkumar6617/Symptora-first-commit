import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { StackHeader } from '@/components/ui/stack-header';
import { Gradient, Radius, Spacing, Typography } from '@/constants/theme';
import { blogCategories } from '@/data/mock/directory';
import { useBlogPosts } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';

export default function BlogListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: posts, isLoading } = useBlogPosts();
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => blogCategories(), []);
  const [featured, ...rest] = posts ?? [];

  const filtered = useMemo(() => {
    if (!posts) return [];
    const list = category ? posts : rest;
    return category ? list.filter((post) => post.category === category) : list;
  }, [posts, rest, category]);

  return (
    <Screen
      header={<StackHeader title="Health guides" subtitle="Written and reviewed by clinicians" fallbackHref="/" />}>
      <View style={styles.filters}>
        <Chip label="All" selected={!category} onPress={() => setCategory(null)} />
        {categories.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={category === item}
            onPress={() => setCategory(category === item ? null : item)}
          />
        ))}
      </View>

      {isLoading ? (
        <SkeletonList count={3} lines={3} />
      ) : (
        <>
          {!category && featured ? (
            <Pressable onPress={() => router.push(`/(info)/blog/${featured.slug}`)}>
              <LinearGradient
                colors={Gradient.teal}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featured}>
                <Text style={styles.featuredKicker}>FEATURED · {featured.category.toUpperCase()}</Text>
                <Text style={styles.featuredTitle}>{featured.title}</Text>
                <Text style={styles.featuredExcerpt} numberOfLines={3}>
                  {featured.excerpt}
                </Text>
                <View style={styles.featuredMeta}>
                  <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.featuredMetaText}>
                    {featured.author} · {featured.readTime}
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          ) : null}

          <View style={{ gap: Spacing.three, marginTop: Spacing.three }}>
            {filtered.map((post) => (
              <Card key={post.slug} onPress={() => router.push(`/(info)/blog/${post.slug}`)} style={styles.card}>
                <Text style={[styles.category, { color: theme.primary }]}>{post.category.toUpperCase()}</Text>
                <Text style={[styles.title, { color: theme.text }]}>{post.title}</Text>
                <Text style={[styles.excerpt, { color: theme.textSecondary }]} numberOfLines={2}>
                  {post.excerpt}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.meta, { color: theme.textMuted }]}>
                    {post.author} · {post.readTime}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={theme.primary} />
                </View>
              </Card>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two - 2,
    marginBottom: Spacing.three,
  },
  featured: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: 6,
  },
  featuredKicker: {
    ...Typography.overline,
    color: 'rgba(255,255,255,0.9)',
  },
  featuredTitle: {
    ...Typography.heading,
    color: '#FFFFFF',
  },
  featuredExcerpt: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.9)',
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: Spacing.two,
  },
  featuredMetaText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  card: {
    gap: 5,
  },
  category: {
    ...Typography.overline,
  },
  title: {
    ...Typography.smallStrong,
    fontSize: 15,
  },
  excerpt: {
    ...Typography.caption,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  meta: {
    ...Typography.caption,
  },
});
