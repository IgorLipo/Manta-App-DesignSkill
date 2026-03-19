import { Stack } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';

export default function AuthLayout() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f8fafc' },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="magic-link" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="register" />
      </Stack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});
