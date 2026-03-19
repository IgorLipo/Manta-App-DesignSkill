import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { format, isToday, isSameDay } from 'date-fns';

const PROPOSED_DATE = new Date('2026-03-25');
const CONFIRMED_BY = ['John Smith (You)', 'Apex Scaffolding Ltd'];

export default function ScheduleScreen() {
  const [response, setResponse] = useState<'confirm' | 'reschedule' | 'unavailable' | null>(null);
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    Alert.alert('Date Confirmed', 'You have confirmed the scaffolding date.', [{ text: 'OK' }]);
    setResponse('confirm');
  };

  const handleReschedule = () => {
    if (!reason) {
      Alert.alert('Reason Required', 'Please provide a reason for requesting a change.');
      return;
    }
    Alert.alert('Change Requested', 'Your request has been submitted.', [{ text: 'OK' }]);
    setResponse('reschedule');
  };

  const handleUnavailable = () => {
    if (!reason) {
      Alert.alert('Reason Required', 'Please explain why this date does not work.');
      return;
    }
    Alert.alert('Marked Unavailable', 'We will contact you to find an alternative date.', [{ text: 'OK' }]);
    setResponse('unavailable');
  };

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
          <Text style={styles.dateValue}>{format(PROPOSED_DATE, 'EEEE, MMMM d, yyyy')}</Text>
        </View>

        <View style={styles.calendar}>
          <Text style={styles.calendarTitle}>{format(PROPOSED_DATE, 'MMMM yyyy')}</Text>
          <View style={styles.calendarGrid}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <Text key={i} style={styles.dayLabel}>{d}</Text>
            ))}
            {days.map((day, i) => {
              const isSelected = isSameDay(day, PROPOSED_DATE);
              const today = isToday(day);
              return (
                <View key={i} style={[styles.dayCell, isSelected && styles.dayCellSelected, today && styles.dayCellToday]}>
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day.getDate()}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.confirmedBy}>
          <Text style={styles.confirmedTitle}>Confirmed Attendees</Text>
          {CONFIRMED_BY.map((name, i) => (
            <View key={i} style={styles.confirmedItem}>
              <Text style={styles.confirmedCheck}>✓</Text>
              <Text style={styles.confirmedName}>{name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Text style={styles.actionTitle}>How would you like to respond?</Text>
          <Pressable style={[styles.actionButton, styles.confirmButton]} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>✓ Confirm Date</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.rescheduleButton]} onPress={handleReschedule}>
            <Text style={styles.rescheduleButtonText}>📅 Request Change</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.unavailableButton]} onPress={handleUnavailable}>
            <Text style={styles.unavailableButtonText}>✕ Mark Unavailable</Text>
          </Pressable>

          {(response === 'reschedule' || response === 'unavailable') && (
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonLabel}>Reason:</Text>
              <TextInput style={styles.reasonInput} value={reason} onChangeText={setReason} placeholder="Please explain..." multiline numberOfLines={3} placeholderTextColor="#94a3b8" />
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
  reasonContainer: { marginTop: 16 },
  reasonLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  reasonInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
});
