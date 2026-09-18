import { Tabs } from 'expo-router/js-tabs';

import { createAppTabBar, type TabIcons } from '@/components/ui/app-tab-bar';

const icons: TabIcons = {
  index: ['home-outline', 'home'],
  appointments: ['calendar-outline', 'calendar'],
  family: ['people-outline', 'people'],
  profile: ['person-circle-outline', 'person-circle'],
};

const AppTabBar = createAppTabBar(icons);

export default function PatientTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="appointments" options={{ title: 'Appointments' }} />
      <Tabs.Screen name="family" options={{ title: 'Family' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
