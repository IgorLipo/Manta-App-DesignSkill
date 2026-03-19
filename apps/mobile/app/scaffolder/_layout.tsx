import { Tabs } from 'expo-router';
export default function ScaffolderLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#2563eb', tabBarInactiveTintColor: '#94a3b8', tabBarStyle: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, paddingBottom: 8, height: 60 } }}>
      <Tabs.Screen name="index" options={{ title: 'My Jobs', tabBarIcon: () => null }} />
      <Tabs.Screen name="quotes" options={{ title: 'Quotes', tabBarIcon: () => null }} />
      <Tabs.Screen name="schedule" options={{ title: 'Schedule', tabBarIcon: () => null }} />
      <Tabs.Screen name="notifications" options={{ title: 'Alerts', tabBarIcon: () => null }} />
    </Tabs>
  );
}
