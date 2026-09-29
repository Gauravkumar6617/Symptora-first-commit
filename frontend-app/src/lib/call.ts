import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { Linking, Platform } from 'react-native';

import { callHandoffUrl } from '@/lib/api';

/**
 * Opens the web client's video-call room (client/src/pages/call/CallPage.tsx)
 * in the in-app browser — the app has no native WebRTC stack, so the call
 * itself always runs there. `token` rides in the URL because the browser
 * tab shares no session with the app.
 */
export async function openVideoCall(kind: 'appointment' | 'telemedicine', id: string, token: string) {
  const url = callHandoffUrl(kind, id, token);
  if (Platform.OS === 'web') {
    await Linking.openURL(url);
    return;
  }
  await openBrowserAsync(url, { presentationStyle: WebBrowserPresentationStyle.AUTOMATIC });
}
