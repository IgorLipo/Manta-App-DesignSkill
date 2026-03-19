import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function QuoteScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!amount || !startDate || !endDate) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Quote Submitted', 'Your quote has been submitted for review.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }, 1000);
  };

  const handleSaveDraft = () => {
    Alert.alert('Draft Saved', 'Your quote has been saved as a draft.');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.jobSummary}>
          <Text style={styles.jobTitle}>14 Oak Avenue, Bristol BS1</Text>
          <Text style={styles.jobType}>Detached House</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Quote Amount (£) *</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g. 2500"
            keyboardType="numeric"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Proposed Start Date *</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="e.g. 2026-04-01"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Proposed End Date *</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="e.g. 2026-04-05"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Notes (assumptions, exclusions)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Excludes VAT. Assumes standard roof access..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#94a3b8"
          />

          <Pressable style={[styles.submitButton, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.submitButtonText}>Submit Quote</Text>
          </Pressable>

          <Pressable style={styles.draftButton} onPress={handleSaveDraft}>
            <Text style={styles.draftButtonText}>Save as Draft</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16 },
  jobSummary: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginBottom: 20 },
  jobTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  jobType: { fontSize: 14, color: '#64748b', marginTop: 4 },
  form: {},
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16 },
  textArea: { minHeight: 100, paddingTop: 12 },
  submitButton: { backgroundColor: '#059669', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  draftButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  draftButtonText: { color: '#374151', fontSize: 16, fontWeight: '500' },
});
