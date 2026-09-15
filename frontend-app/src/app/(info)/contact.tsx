import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { StackHeader } from '@/components/ui/stack-header';
import { TextField } from '@/components/ui/text-field';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ContactScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleSend() {
    Alert.alert('Message sent', "We'll get back to you within 1 business day.");
    setName('');
    setEmail('');
    setMessage('');
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StackHeader title="Contact us" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}>
        <View style={{ gap: Spacing.three }}>
          <TextField label="Name" value={name} onChangeText={setName} placeholder="Your name" />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
          />
          <TextField
            label="Message"
            value={message}
            onChangeText={setMessage}
            placeholder="How can we help?"
            multiline
            numberOfLines={5}
            style={{ minHeight: 120, textAlignVertical: 'top' }}
          />
          <Button label="Send message" onPress={handleSend} disabled={!name || !email || !message} />
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
