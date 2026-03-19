import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format, isToday, isSameDay } from 'date-fns';
import { jobsApi, getErrorMessage } from '../../src/lib/api';

interface ScheduleData {
  date: string;
  confirmedBy: string[];
}

export default function ScheduleScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();

  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [response, setResponse] = useState<'confirm' | 'reschedule' | 'unavailable' | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!jobId) {
        // Demo/mock data
        setSchedule({
          date: '2026-03-25',
          confirmedBy: ['John Smith (You)', 'Apex Scaffolding Ltd'],
        });
        setLoading(false);
        return;
      }

      try {
        const { data } = await jobsApi.getSchedule(jobId);
        setSchedule(data.schedule || null);
      } catch (err: any) {
        const message = getErrorMessage(err);
        setError(message);
        if (err.response?.status === 401) {
          router.replace('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [jobId]);

  const handleConfirm = async () => {
    if (!jobId) {
      Alert.alert('Date Confirmed', 'You have confirmed the scaffolding date.', [{ text: 'OK' }]);
      setResponse('confirm');
      return;
    }

    setSubmitting(true);
    try {
      await jobsApi.confirmSchedule(jobId);
      Alert.alert('Date Confirmed', 'You have confirmed the scaffolding date.', [{ text: 'OK' }]);
      setResponse('confirm');
    } catch (err: any) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = async () => {
    if (!reason) {
      Alert.alert('Reason Required', 'Please provide a reason for requesting a change.');
      return;
    }

    if (!jobId) {
      Alert.alert('Change Requested', 'Your request has been submitted.', [{ text: 'OK' }]);
      setResponse('reschedule');
      return;
    }

    setSubmitting(true);
    try {
      await jobsApi.requestScheduleChange(jobId, reason);
      Alert.alert('Change Requested', 'Your request has been submitted.', [{ text: 'OK' }]);
      setResponse('reschedule');
    } catch (err: any) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnavailable = async () => {
    if (!reason) {
      Alert.alert('Reason Required', 'Please explain why this date does not work.');
      return;
    }

    if (!jobId) {
      Alert.alert('Marked Unavailable', 'We will contact you to find an alternative date.', [{ text: 'OK' }]);
      setResponse('unavailable');
      return;
    }

    setSubmitting(true);
    try {
      await jobsApi.markUnavailable(jobId, reason);
      Alert.alert('Marked Unavailable', 'We will contact you to find an alternative date.', [{ text: 'OK' }]);
      setResponse('unavailable');
    } catch (err: any) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      </View>
    );
  }

  const proposedDate = schedule?.date ? new Date(schedule.date) : new Date('2026-03-25');

  // Generate calendar days
  const days = Array.from({ length: 35 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 5 + i);
    return date;
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.dateCard}>
          <Text style={styles.dateLabel}>Proposed Date</Text>
          <Text style={styles.dateValue}>{format(proposedDate, 'EEEE, MMMM d, yyyy')}</Text>
        </View>

        <View style={styles.calendar}>
          <Text style={styles.calendarTitle}>{format(proposedDate, 'MMMM yyyy')}</Text>
          <View style={styles.calendarGrid}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <Text key={i} style={styles.dayLabel}>{d}</Text>
            ))}
            {days.map((day, i) => {
              const isSelected = isSameDay(day, proposedDate);
              const today = isToday(day);
              return (
                <View key={i} style={[styles.dayCell, isSelected && styles.dayCellSelected, today && styles.dayCellToday]}>
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day.getDate()}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {schedule?.confirmedBy && schedule.confirmedBy.length > 0 && (
          <View style={styles.confirmedBy}>
            <Text style={styles.confirmedTitle}>Confirmed Attendees</Text>
            {schedule.confirmedBy.map((name, i) => (
              <View key={i} style={styles.confirmedItem}>
                <Text style={styles.confirmedCheck}>✓</Text>
                <Text style={styles.confirmedName}>{name}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <Text style={styles.actionTitle}>How would you like to respond?</Text>
          <Pressable
            style={[styles.actionButton, styles.confirmButton, submitting && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Date</Text>
            )}
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.rescheduleButton, submitting && styles.buttonDisabled]}
            onPress={handleReschedule}
            disabled={submitting}
          >
            <Text style={styles.rescheduleButtonText}>Request Change</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.unavailableButton, submitting && styles.buttonDisabled]}
            onPress={handleUnavailable}
            disabled={submitting}
          >
            <Text style={styles.unavailableButtonText}>Mark Unavailable</Text>
          </Pressable>

          {(response === 'reschedule' || response === 'unavailable') && (
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonLabel}>Reason:</Text>
              <TextInput
                style={styles.reasonInput}
                value={reason}
                onChangeText={setReason}
                placeholder="Please explain..."
                multiline
                numberOfLines={3}
                placeholderTextColor="#94a3b8"
              />
            </View>
          )}
        </View>
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
  calendar: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginTop: 16 },
  calendarTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', textAlign: 'center', marginBottom: 12 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayLabel: { width: '14.28%', textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  dayCellSelected: { backgroundColor: '#059669' },
  dayCellToday: { borderWidth: 2, borderColor: '#059669' },
  dayText: { fontSize: 14, color: '#1e293b' },
  dayTextSelected: { color: '#fff', fontWeight: '600' },
  confirmedBy: { marginTop: 20, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16 },
  confirmedTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
  confirmedItem: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  confirmedCheck: { color: '#059669', fontSize: 14, marginRight: 8 },
  confirmedName: { fontSize: 14, color: '#374151' },
  actions: { marginTop: 24 },
  actionTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
  actionButton: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  confirmButton: { backgroundColor: '#059669' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  rescheduleButton: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#f97316' },
  rescheduleButtonText: { color: '#f97316', fontSize: 16, fontWeight: '600' },
  unavailableButton: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#dc2626' },
  unavailableButtonText: { color: '#dc2626', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
  reasonContainer: { marginTop: 16 },
  reasonLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  reasonInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
});
