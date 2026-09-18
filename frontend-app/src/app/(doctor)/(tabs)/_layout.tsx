import { Tabs } from 'expo-router/js-tabs';

import { createAppTabBar, type TabIcons } from '@/components/ui/app-tab-bar';

const icons: TabIcons = {
  index: ['grid-outline', 'grid'],
  schedule: ['calendar-outline', 'calendar'],
  patients: ['people-outline', 'people'],
  profile: ['person-circle-outline', 'person-circle'],
};

const AppTabBar = createAppTabBar(icons);

export default function DoctorTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule' }} />
      <Tabs.Screen name="patients" options={{ title: 'Patients' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
