import { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>SO</Text>
          </View>
          <Text style={styles.title}>Solar Ops</Text>
          <Text style={styles.subtitle}>UK Solar Installation Platform</Text>
        </View>

        <View style={styles.actions}>
          <Text style={styles.roleLabel}>I am a...</Text>
          
          <Pressable style={styles.roleCard} onPress={() => router.push('/auth/login')}>
            <Text style={styles.roleIcon}>🔑</Text>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>Property Owner</Text>
              <Text style={styles.roleDesc}>Submit photos and track my job</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>

          <Pressable style={styles.roleCard} onPress={() => router.push('/auth/login')}>
            <Text style={styles.roleIcon}>🏗️</Text>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>Scaffolder</Text>
              <Text style={styles.roleDesc}>View jobs and submit quotes</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>

          <Pressable style={styles.roleCard} onPress={() => router.push('/auth/login')}>
            <Text style={styles.roleIcon}>⚡</Text>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>Engineer</Text>
              <Text style={styles.roleDesc}>Complete site reports</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>

          <Pressable style={styles.roleCardAdmin} onPress={() => router.push('/auth/login')}>
            <Text style={styles.roleIcon}>⚙️</Text>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitleAdmin}>Admin Portal</Text>
              <Text style={styles.roleDescAdmin}>Operations management</Text>
            </View>
            <Text style={styles.arrowWhite}>›</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>Solar Ops © 2026</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1, padding: 24 },
  logoContainer: { alignItems: 'center', marginTop: 60, marginBottom: 48 },
  logo: { width: 80, height: 80, backgroundColor: '#2563eb', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  actions: { flex: 1 },
  roleLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  roleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginBottom: 10 },
  roleCardAdmin: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 10 },
  roleIcon: { fontSize: 28, marginRight: 14 },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  roleDesc: { fontSize: 13, color: '#64748b', marginTop: 2 },
  roleTitleAdmin: { fontSize: 16, fontWeight: '600', color: '#fff' },
  roleDescAdmin: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  arrow: { fontSize: 24, color: '#cbd5e1' },
  arrowWhite: { fontSize: 24, color: '#475569' },
  footer: { textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 16 },
});
