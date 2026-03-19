import { Stack } from 'expo-router';
import { View, Text, Pressable } from 'react-native';

export default function OwnerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#059669' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'My Properties' }} />
      <Stack.Screen name="job-detail" options={{ title: 'Job Details' }} />
      <Stack.Screen name="submit" options={{ title: 'Submit Photos' }} />
      <Stack.Screen name="schedule" options={{ title: 'Schedule' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
    </Stack>
  );
}
