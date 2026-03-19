import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { format } from 'date-fns';

const SCHEDULED_DATE = new Date('2026-03-25');

export default function ScaffolderScheduleScreen() {
  const [confirmed, setConfirmed] = useState(false);
  const [requestChange, setRequestChange] = useState(false);
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    setConfirmed(true);
    Alert.alert('Confirmed', 'You have confirmed you can attend on this date.');
  };

  const handleRequestChange = () => {
    if (!reason) {
      Alert.alert('Reason Required', 'Please provide a reason for the change request.');
      return;
    }
    Alert.alert('Request Submitted', 'The property owner will be notified of your request.');
    setRequestChange(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.dateCard}>
          <Text style={styles.dateLabel}>Scheduled Date</Text>
          <Text style={styles.dateValue}>{format(SCHEDULED_DATE, 'EEEE, MMMM d, yyyy')}</Text>
        </View>

        {!confirmed && !requestChange && (
          <View style={styles.actions}>
            <Text style={styles.actionTitle}>Can you attend on this date?</Text>
            <Pressable style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>✓ Yes, I Can Attend</Text>
            </Pressable>
            <Pressable style={styles.changeButton} onPress={() => setRequestChange(true)}>
              <Text style={styles.changeButtonText}>Request Different Date</Text>
            </Pressable>
          </View>
        )}

        {confirmed && (
          <View style={styles.confirmedCard}>
            <Text style={styles.confirmedText}>✓ You have confirmed attendance</Text>
          </View>
        )}

        {requestChange && (
          <View style={styles.requestSection}>
            <Text style={styles.requestTitle}>Request Date Change</Text>
            <Text style={styles.label}>Reason for change:</Text>
            <TextInput
              style={styles.input}
              value={reason}
              onChangeText={setReason}
              placeholder="Please explain why you need a different date..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="#94a3b8"
            />
            <Pressable style={styles.submitButton} onPress={handleRequestChange}>
              <Text style={styles.submitButtonText}>Submit Request</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={() => setRequestChange(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16 },
  dateCard: { backgroundColor: '#059669', borderRadius: 12, padding: 20, alignItems: 'center' },
  dateLabel: { fontSize: 14, color: '#d1fae5' },
  dateValue: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  actions: { marginTop: 24 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 16 },
  confirmButton: { backgroundColor: '#059669', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  changeButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#f97316', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  changeButtonText: { color: '#f97316', fontSize: 16, fontWeight: '600' },
  confirmedCard: { marginTop: 24, backgroundColor: '#ecfdf5', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#a7f3d0' },
  confirmedText: { fontSize: 16, fontWeight: '600', color: '#059669' },
  requestSection: { marginTop: 24 },
  requestTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  submitButton: { backgroundColor: '#059669', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  cancelButtonText: { color: '#64748b', fontSize: 16, fontWeight: '500' },
});
