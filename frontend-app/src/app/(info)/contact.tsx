import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { AlertBanner } from '@/components/ui/alert-banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeaderRow } from '@/components/ui/section-link';
import { StackHeader } from '@/components/ui/stack-header';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing, Typography, tint } from '@/constants/theme';
import { APP_NAME, contactChannels } from '@/data/content';
import { ApiError, sendContactMessage } from '@/lib/api';
import { successFeedback } from '@/lib/haptics';
import { validateEmail } from '@/lib/validation';
import { useTheme } from '@/hooks/use-theme';

interface ContactErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function ContactScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<ContactErrors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    const nextErrors: ContactErrors = {};
    if (!name.trim()) nextErrors.name = 'Tell us your name.';
    const emailError = validateEmail(email);
    if (emailError) nextErrors.email = emailError;
    if (message.trim().length < 10) nextErrors.message = 'Add a little more detail (10+ characters).';

    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await sendContactMessage({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim() || 'General enquiry',
        message: message.trim(),
      });
      successFeedback();
      setSent(true);
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Could not send your message. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      header={<StackHeader title="Contact us" fallbackHref="/" />}
      keyboardAware>
      <Text style={[styles.intro, { color: theme.textSecondary }]}>
        Questions about {APP_NAME}, a booking, or a partnership — send us a message and we&apos;ll get back
        within one business day.
      </Text>

      <View style={{ gap: Spacing.two }}>
        {contactChannels.map((channel) => (
          <Card
            key={channel.label}
            onPress={channel.href ? () => Linking.openURL(channel.href as string) : undefined}
            style={styles.channel}>
            <View style={[styles.iconWrap, { backgroundColor: tint(theme.primary, 0.12) }]}>
              <Ionicons name={channel.icon} size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.channelLabel, { color: theme.textSecondary }]}>
                {channel.label.toUpperCase()}
              </Text>
              <Text style={[styles.channelValue, { color: theme.text }]}>{channel.value}</Text>
            </View>
            {channel.href ? <Ionicons name="open-outline" size={16} color={theme.textMuted} /> : null}
          </Card>
        ))}
      </View>

      <SectionHeaderRow title="Send a message" />

      {sent ? (
        <Card style={styles.successCard}>
          <View style={[styles.successIcon, { backgroundColor: tint(theme.success, 0.12) }]}>
            <Ionicons name="checkmark-circle" size={30} color={theme.success} />
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>Message sent</Text>
          <Text style={[styles.successBody, { color: theme.textSecondary }]}>
            Thanks for reaching out — our team will get back to you at {email} shortly.
          </Text>
          <Button
            label="Send another"
            variant="outline"
            size="sm"
            onPress={() => {
              setSent(false);
              setName('');
              setEmail('');
              setSubject('');
              setMessage('');
            }}
          />
        </Card>
      ) : (
        <Card style={{ gap: Spacing.three }}>
          {formError ? <AlertBanner tone="error" message={formError} /> : null}

          <TextField
            label="Full name"
            icon="person-outline"
            value={name}
            onChangeText={setName}
            error={errors.name}
            placeholder="Your name"
            autoComplete="name"
          />
          <TextField
            label="Email"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="you@example.com"
          />
          <TextField
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            placeholder="What's this about?"
          />
          <TextField
            label="Message"
            value={message}
            onChangeText={setMessage}
            error={errors.message}
            placeholder="Tell us more..."
            multiline
            numberOfLines={5}
            style={styles.multiline}
          />
          <Button label="Send message" onPress={handleSend} loading={loading} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    ...Typography.small,
    marginBottom: Spacing.three,
  },
  channel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelLabel: {
    ...Typography.overline,
  },
  channelValue: {
    ...Typography.smallStrong,
    marginTop: 1,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  successCard: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    ...Typography.heading,
  },
  successBody: {
    ...Typography.small,
    textAlign: 'center',
    maxWidth: 300,
  },
});
