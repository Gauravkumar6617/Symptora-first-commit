import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  appointmentReminders: boolean;
  healthCheckNudges: boolean;
  productUpdates: boolean;
  hapticsEnabled: boolean;
  toggle: (key: ToggleableSetting) => void;
}

export type ToggleableSetting =
  | 'appointmentReminders'
  | 'healthCheckNudges'
  | 'productUpdates'
  | 'hapticsEnabled';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      appointmentReminders: true,
      healthCheckNudges: true,
      productUpdates: false,
      hapticsEnabled: true,
      toggle: (key) => set((state) => ({ [key]: !state[key] }) as Pick<SettingsState, ToggleableSetting>),
    }),
    {
      name: 'symptora-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
