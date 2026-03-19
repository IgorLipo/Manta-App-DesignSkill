import { Stack } from 'expo-router';

export default function ScaffolderLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#059669' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'My Jobs' }} />
      <Stack.Screen name="job-detail" options={{ title: 'Job Details' }} />
      <Stack.Screen name="quote" options={{ title: 'Submit Quote' }} />
      <Stack.Screen name="schedule" options={{ title: 'Schedule' }} />
      <Stack.Screen name="complete" options={{ title: 'Complete Work' }} />
    </Stack>
  );
}
