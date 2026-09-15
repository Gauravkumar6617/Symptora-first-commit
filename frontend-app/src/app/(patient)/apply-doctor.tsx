import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { StackHeader } from '@/components/ui/stack-header';
import { TextField } from '@/components/ui/text-field';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ApplyDoctorScreen() {
  const theme = useTheme();
  const [fullName, setFullName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [email, setEmail] = useState('');

  function handleSubmit() {
    Alert.alert('Application received', "Our team will verify your license and reach out within 3 business days.");
    setFullName('');
    setSpecialization('');
    setLicenseNumber('');
    setEmail('');
  }

  const canSubmit = fullName && specialization && licenseNumber && email;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StackHeader title="Apply as a doctor" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}>
        <View style={{ gap: Spacing.three }}>
          <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Dr. Jane Doe" />
          <TextField
            label="Specialization"
            value={specialization}
            onChangeText={setSpecialization}
            placeholder="e.g. Cardiology"
          />
          <TextField
            label="Medical license number"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            placeholder="License #"
          />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
          />
          <Button label="Submit application" onPress={handleSubmit} disabled={!canSubmit} />
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
