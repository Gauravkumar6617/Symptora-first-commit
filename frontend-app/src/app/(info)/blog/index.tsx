import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { StackHeader } from '@/components/ui/stack-header';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useBlogPosts } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';

export default function BlogListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: posts } = useBlogPosts();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StackHeader title="Health guides" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}>
        <View style={{ gap: Spacing.three }}>
          {posts?.map((post) => (
            <Pressable key={post.slug} onPress={() => router.push(`/(info)/blog/${post.slug}`)}>
              <Card style={{ gap: 6 }}>
                <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                  {post.category}
                </Text>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>{post.title}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }} numberOfLines={2}>
                  {post.excerpt}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                  {post.author} · {post.readTime}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
});
