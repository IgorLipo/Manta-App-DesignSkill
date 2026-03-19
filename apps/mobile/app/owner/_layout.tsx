import { Tabs } from 'expo-router';

export default function OwnerLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#2563eb', tabBarInactiveTintColor: '#94a3b8', tabBarStyle: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, paddingBottom: 8, height: 60 } }}>
      <Tabs.Screen name="index" options={{ title: 'My Jobs', tabBarIcon: () => null }} />
      <Tabs.Screen name="submit" options={{ title: 'Submit Photos', tabBarIcon: () => null }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifications', tabBarIcon: () => null }} />
    </Tabs>
  );
}
