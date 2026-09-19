import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { TextField } from '@/components/ui/text-field';

/**
 * TEMPORARY isolation route for the keyboard-dismiss bug. Delete once traced.
 *
 * Each input strips away one more layer of the app. Whichever is the FIRST to
 * type normally tells us which layer introduces the problem.
 */
export default function KeyboardTestScreen() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');

  useEffect(() => {
    console.log('[KBD-TEST] screen mounted');
  }, []);

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>1. Bare TextInput, no wrapper</Text>
      <TextInput
        value={a}
        onChangeText={setA}
        placeholder="type here"
        style={styles.input}
        onFocus={() => console.log('[KBD-TEST] 1 bare FOCUS')}
        onBlur={() => console.log('[KBD-TEST] 1 bare BLUR')}
      />

      <Text style={styles.heading}>2. Uncontrolled (no value prop)</Text>
      <TextInput
        placeholder="type here"
        style={styles.input}
        onFocus={() => console.log('[KBD-TEST] 2 uncontrolled FOCUS')}
        onBlur={() => console.log('[KBD-TEST] 2 uncontrolled BLUR')}
      />

      <Text style={styles.heading}>3. Inside a plain ScrollView</Text>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="always">
        <TextInput
          value={b}
          onChangeText={setB}
          placeholder="type here"
          style={styles.input}
          onFocus={() => console.log('[KBD-TEST] 3 scroll FOCUS')}
          onBlur={() => console.log('[KBD-TEST] 3 scroll BLUR')}
        />
      </ScrollView>

      <Text style={styles.heading}>4. The app&apos;s TextField</Text>
      <TextField label="App TextField" value={c} onChangeText={setC} placeholder="type here" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 24,
    paddingTop: 72,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  heading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B1220',
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0B1220',
  },
  scroll: {
    maxHeight: 90,
  },
});
