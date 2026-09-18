import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface AvatarPickerProps {
  value: string | null;
  onChange: (uri: string | null) => void;
  name?: string;
  label?: string;
  size?: number;
}

/**
 * Profile photo picker. The chosen URI is what gets sent as the backend
 * `avatar` column (UserBase.avatar).
 */
export function AvatarPicker({
  value,
  onChange,
  name,
  label = 'Profile photo (optional)',
  size = 84,
}: AvatarPickerProps) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);

  async function pick() {
    try {
      setBusy(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow photo access to choose a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        onChange(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Could not open photos', 'Something went wrong picking that image.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={pick} disabled={busy} accessibilityRole="button" accessibilityLabel={label}>
        <View>
          <Avatar uri={value} name={name} size={size} gradient={!value} />
          <View style={[styles.editBadge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
            <Ionicons name={value ? 'pencil' : 'camera'} size={13} color={theme.onPrimary} />
          </View>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        <View style={styles.linkRow}>
          <Pressable onPress={pick} hitSlop={6}>
            <Text style={[styles.link, { color: theme.primary }]}>{value ? 'Change' : 'Upload'}</Text>
          </Pressable>
          {value ? (
            <Pressable onPress={() => onChange(null)} hitSlop={6}>
              <Text style={[styles.link, { color: theme.textSecondary }]}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flex: 1,
    gap: 4,
  },
  label: {
    ...Typography.label,
  },
  linkRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  link: {
    ...Typography.smallStrong,
  },
});
