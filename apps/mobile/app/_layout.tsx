import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f8fafc' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/magic-link" />
        <Stack.Screen name="auth/forgot-password" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="owner" />
        <Stack.Screen name="scaffolder" />
        <Stack.Screen name="engineer" />
      </Stack>
    </QueryClientProvider>
  );
}
