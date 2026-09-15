import { Redirect, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { StackHeader } from '@/components/ui/stack-header';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { getBlogPostBySlug } from '@/data/catalog';
import { useTheme } from '@/hooks/use-theme';

export default function BlogPostScreen() {
  const theme = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return <Redirect href="/(info)/blog" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StackHeader title={post.category} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}>
        <Text style={[styles.title, { color: theme.text }]}>{post.title}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: Spacing.four }}>
          {post.author} · {post.date} · {post.readTime}
        </Text>
        {post.content.map((paragraph, index) => (
          <Text key={index} style={[styles.paragraph, { color: theme.text }]}>
            {paragraph}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    marginBottom: Spacing.two,
    lineHeight: 28,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: Spacing.three,
  },
});
