import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Image, Alert, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const PHOTO_GUIDE = [
  { id: '1', category: 'EXTERIOR_FRONT', label: 'Front of Property', required: true, example: '📷 Take from across the street, showing full front elevation' },
  { id: '2', category: 'EXTERIOR_REAR', label: 'Rear of Property', required: true, example: '📷 Show the back of the house where panels will likely go' },
  { id: '3', category: 'ROOF_OVERVIEW', label: 'Roof Overview', required: true, example: '📷 Wide shot showing roof pitch and direction' },
  { id: '4', category: 'ROOF_PANEL_AREA', label: 'Panel Area', required: true, example: '📷 Close up of the area where panels will be installed' },
  { id: '5', category: 'ACCESS_CONSTRAINTS', label: 'Access Points', required: true, example: '📷 Show gates, driveways, or any access constraints' },
  { id: '6', category: 'HEIGHT_REFERENCE', label: 'Height Reference', required: false, example: '📷 Include a person or reference object for scale' },
  { id: '7', category: 'OBSTACLE_CLOSEUP', label: 'Obstacles (optional)', required: false, example: '📷 Chimneys, Velux windows, aerials, satellite dishes' },
];

export default function SubmitPhotosScreen() {
  const [step, setStep] = useState<'guide' | 'location' | 'photos' | 'review'>('guide');
  const [photos, setPhotos] = useState<Record<string, string[]>>({});
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);

  const requestPermissions = async () => {
    const camera = await ImagePicker.requestCameraPermissionsAsync();
    const location = await Location.requestForegroundPermissionsAsync();
    if (!camera.granted || !location.granted) {
      Alert.alert('Permissions needed', 'Camera and location permissions are required');
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const loc = await Location.getCurrentPosition({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch {
      Alert.alert('Location Error', 'Could not get your location. Please pin it manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  const takePhoto = async (category: string) => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => ({
        ...prev,
        [category]: [...(prev[category] || []), result.assets![0].uri],
      }));
    }
  };

  const requiredDone = PHOTO_GUIDE.filter((g) => g.required).every((g) => (photos[g.category]?.length || 0) > 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress */}
      <View style={styles.progress}>
        {['guide', 'location', 'photos', 'review'].map((s, i) => (
          <View key={s} style={[styles.progressStep, i <= ['guide', 'location', 'photos', 'review'].indexOf(step) && styles.progressStepActive]} />
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20 }}>
        {step === 'guide' && (
          <View>
            <Text style={styles.stepTitle}>Submit Your Property</Text>
            <Text style={styles.stepDesc}>Follow the guide below to photograph your property. Good photos help us give you an accurate quote.</Text>
            {PHOTO_GUIDE.map((item) => (
              <View key={item.id} style={styles.guideItem}>
                <View style={styles.guideHeader}>
                  <Text style={styles.guideLabel}>{item.label}</Text>
                  {item.required && <View style={styles.requiredBadge}><Text style={styles.requiredText}>Required</Text></View>}
                </View>
                <Text style={styles.guideExample}>{item.example}</Text>
              </View>
            ))}
            <Pressable style={styles.primaryButton} onPress={() => { requestPermissions(); setStep('location'); }}>
              <Text style={styles.primaryButtonText}>Continue to Location</Text>
            </Pressable>
          </View>
        )}

        {step === 'location' && (
          <View>
            <Text style={styles.stepTitle}>Pin Your Property</Text>
            <Text style={styles.stepDesc}>We need your property location to match you with local scaffolders.</Text>
            <Pressable style={styles.secondaryButton} onPress={getCurrentLocation} disabled={locationLoading}>
              <Text style={styles.secondaryButtonText}>{locationLoading ? 'Getting location...' : '📍 Use My Current Location'}</Text>
            </Pressable>
            {location && (
              <View style={styles.locationConfirm}>
                <Text style={styles.locationText}>✅ Location captured</Text>
                <Text style={styles.locationCoords}>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</Text>
              </View>
            )}
            <View style={styles.manualLocation}>
              <Text style={styles.manualLabel}>Or enter your postcode:</Text>
              <TextInput style={styles.input} placeholder="e.g. BS1 4LG" />
            </View>
            <View style={styles.buttonRow}>
              <Pressable style={styles.backButton} onPress={() => setStep('guide')}><Text style={styles.backButtonText}>Back</Text></Pressable>
              <Pressable style={[styles.primaryButton, (!location) && styles.buttonDisabled]} onPress={() => setStep('photos')} disabled={!location}>
                <Text style={styles.primaryButtonText}>Continue</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 'photos' && (
          <View>
            <Text style={styles.stepTitle}>Take Photos</Text>
            {!currentCategory ? (
              <View>
                {PHOTO_GUIDE.map((item) => {
                  const hasPhoto = (photos[item.category]?.length || 0) > 0;
                  return (
                    <Pressable key={item.id} style={styles.photoCategoryCard} onPress={() => setCurrentCategory(item.category)}>
                      <View style={styles.photoCategoryInfo}>
                        <Text style={styles.photoCategoryLabel}>{item.label}</Text>
                        {item.required && <Text style={styles.requiredSmall}>Required</Text>}
                      </View>
                      {hasPhoto ? (
                        <View style={styles.photoDone}><Text style={styles.photoDoneText}>✅ {photos[item.category].length} photo(s)</Text></View>
                      ) : (
                        <View style={styles.photoEmpty}><Text style={styles.photoEmptyText}>+ Add</Text></View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View>
                <Pressable onPress={() => setCurrentCategory(null)}><Text style={styles.backLink}>← Back to list</Text></Pressable>
                <Text style={styles.categoryTitle}>{PHOTO_GUIDE.find((g) => g.category === currentCategory)?.label}</Text>
                <Text style={styles.categoryGuide}>{PHOTO_GUIDE.find((g) => g.category === currentCategory)?.example}</Text>
                {photos[currentCategory]?.map((uri, i) => (
                  <View key={i} style={styles.photoPreview}><Image source={{ uri }} style={styles.previewImage} /></View>
                ))}
                <Pressable style={styles.cameraButton} onPress={() => takePhoto(currentCategory)}>
                  <Text style={styles.cameraButtonText}>📷 Take Photo</Text>
                </Pressable>
              </View>
            )}
            {requiredDone && (
              <Pressable style={styles.primaryButton} onPress={() => setStep('review')}>
                <Text style={styles.primaryButtonText}>Review & Submit</Text>
              </Pressable>
            )}
          </View>
        )}

        {step === 'review' && (
          <View>
            <Text style={styles.stepTitle}>Review & Submit</Text>
            <Text style={styles.stepDesc}>Check your submission before sending to our team.</Text>
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>📍 Location</Text>
              <Text style={styles.reviewValue}>{location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Not set'}</Text>
            </View>
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>📷 Photos</Text>
              <Text style={styles.reviewValue}>{Object.values(photos).flat().length} photo(s) submitted</Text>
              {PHOTO_GUIDE.filter((g) => g.required).map((g) => (
                <Text key={g.id} style={styles.reviewItem}>• {g.label}: {photos[g.category]?.length || 0}</Text>
              ))}
            </View>
            <View style={styles.buttonRow}>
              <Pressable style={styles.backButton} onPress={() => setStep('photos')}><Text style={styles.backButtonText}>Back</Text></Pressable>
              <Pressable style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Submit for Review</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  progress: { flexDirection: 'row', gap: 6, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  progressStep: { flex: 1, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2 },
  progressStepActive: { backgroundColor: '#059669' },
  scroll: { flex: 1 },
  stepTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  stepDesc: { fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 20 },
  guideItem: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginBottom: 10 },
  guideHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  guideLabel: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  requiredBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  requiredText: { fontSize: 11, color: '#dc2626', fontWeight: '600' },
  guideExample: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  primaryButton: { backgroundColor: '#059669', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  secondaryButtonText: { fontSize: 15, color: '#374151', fontWeight: '500' },
  locationConfirm: { backgroundColor: '#ecfdf5', borderRadius: 10, padding: 14, marginBottom: 16 },
  locationText: { fontSize: 14, color: '#059669', fontWeight: '600' },
  locationCoords: { fontSize: 12, color: '#64748b', marginTop: 4 },
  manualLocation: { marginBottom: 16 },
  manualLabel: { fontSize: 13, color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  backButton: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  backButtonText: { color: '#374151', fontSize: 16, fontWeight: '500' },
  buttonDisabled: { opacity: 0.5 },
  photoCategoryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginBottom: 10 },
  photoCategoryInfo: { flex: 1 },
  photoCategoryLabel: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  requiredSmall: { fontSize: 11, color: '#dc2626', marginTop: 2 },
  photoDone: { backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  photoDoneText: { fontSize: 13, color: '#059669', fontWeight: '600' },
  photoEmpty: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  photoEmptyText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  backLink: { fontSize: 14, color: '#059669', marginBottom: 16 },
  categoryTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  categoryGuide: { fontSize: 14, color: '#64748b', marginBottom: 16, lineHeight: 20 },
  photoPreview: { marginBottom: 12, borderRadius: 12, overflow: 'hidden' },
  previewImage: { width: '100%', height: 200, borderRadius: 12 },
  cameraButton: { backgroundColor: '#1e293b', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  cameraButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  reviewSection: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginBottom: 12 },
  reviewLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  reviewValue: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  reviewItem: { fontSize: 13, color: '#64748b', marginTop: 4 },
  submitButton: { flex: 1, backgroundColor: '#059669', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
