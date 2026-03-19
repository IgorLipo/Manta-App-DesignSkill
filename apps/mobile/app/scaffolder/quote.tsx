import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { jobsApi, getErrorMessage } from '../../src/lib/api';
import { JobStatus } from '../../src/stores/jobStore';

interface JobInfo {
  id: string;
  address: string;
  propertyType?: string;
  status: JobStatus;
}

export default function QuoteScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  const [job, setJob] = useState<JobInfo | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) {
        // For demo purposes, use mock data if no jobId provided
        setJob({
          id: '1',
          address: '14 Oak Avenue, Bristol BS1',
          propertyType: 'Detached House',
          status: 'QUOTE_PENDING',
        });
        setLoadingJob(false);
        return;
      }

      try {
        const { data } = await jobsApi.get(jobId);
        setJob(data);
      } catch (err: any) {
        const message = getErrorMessage(err);
        setError(message);
        if (err.response?.status === 401) {
          router.replace('/auth/login');
        }
      } finally {
        setLoadingJob(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleSubmit = async () => {
    if (!amount || !startDate || !endDate) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid quote amount');
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      Alert.alert('Invalid Date', 'Please enter dates in YYYY-MM-DD format');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const targetJobId = jobId || 'demo-job-id';

      await jobsApi.submitQuote(targetJobId, {
        amount: amountNum,
        startDate,
        endDate,
        notes,
      });

      Alert.alert('Quote Submitted', 'Your quote has been submitted for review.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      const message = getErrorMessage(err);
      setError(message);
      Alert.alert('Submission Failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    Alert.alert('Draft Saved', 'Your quote has been saved as a draft.');
    // In a real app, this would save to local storage or API
  };

  if (loadingJob) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading job details...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        <View style={styles.jobSummary}>
          <Text style={styles.jobTitle}>{job?.address || 'Loading...'}</Text>
          <Text style={styles.jobType}>{job?.propertyType || ''}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Quote Amount (GBP) *</Text>
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
            placeholder="YYYY-MM-DD (e.g. 2026-04-01)"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Proposed End Date *</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD (e.g. 2026-04-05)"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
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

          <Pressable
            style={[styles.submitButton, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Quote</Text>
            )}
          </Pressable>

          <Pressable style={styles.draftButton} onPress={handleSaveDraft} disabled={submitting}>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b' },
  errorBanner: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorBannerText: { color: '#dc2626', fontSize: 14 },
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
