import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Radius, Shadow, Spacing, Typography, tint } from '@/constants/theme';
import { useMessages, useSendMessage } from '@/hooks/use-queries';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import type { MessageRecord } from '@/types';

interface ChatThreadModalProps {
  visible: boolean;
  kind: 'appointment' | 'telemedicine';
  id: string | null;
  onClose: () => void;
}

/** Chat follow-ups on one appointment or instant consultation — plain REST,
 * polled every few seconds; not latency-critical like the call signaling. */
export function ChatThreadModal({ visible, kind, id, onClose }: ChatThreadModalProps) {
  const theme = useTheme();
  const userId = useAuthStore((state) => state.user?.id);
  const { data: messages = [] } = useMessages(kind, visible ? id : null);
  const sendMessage = useSendMessage(kind, id);
  const [body, setBody] = useState('');
  const listRef = useRef<FlatList<MessageRecord>>(null);

  useEffect(() => {
    if (messages.length) requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length]);

  function handleSend() {
    const text = body.trim();
    if (!text) return;
    setBody('');
    sendMessage.mutate(text);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            Shadow.lg,
            { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Messages</Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const mine = item.sender_id === userId;
              return (
                <View style={[styles.bubbleRow, { alignItems: mine ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.sender, { color: theme.textMuted }]}>{item.sender_name ?? 'Someone'}</Text>
                  <View
                    style={[
                      styles.bubble,
                      { backgroundColor: mine ? theme.primary : tint(theme.primary, 0.1) },
                    ]}>
                    <Text style={{ color: mine ? '#FFFFFF' : theme.text }}>{item.body}</Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: theme.textMuted }]}>No messages yet — say hello.</Text>
            }
          />

          <View style={[styles.inputRow, { borderColor: theme.border }]}>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Type a message…"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text }]}
              onSubmitEditing={handleSend}
            />
            <Pressable
              onPress={handleSend}
              disabled={!body.trim() || sendMessage.isPending}
              style={[styles.sendButton, { backgroundColor: theme.primary, opacity: body.trim() ? 1 : 0.4 }]}>
              <Ionicons name="send" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '75%',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  title: {
    ...Typography.heading,
  },
  list: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  bubbleRow: {
    gap: 2,
  },
  sender: {
    ...Typography.overline,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two - 2,
  },
  empty: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.five,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
