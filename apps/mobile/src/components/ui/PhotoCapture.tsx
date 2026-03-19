import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface PhotoCaptureProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  required?: boolean;
}

export function PhotoCapture({ photos, onPhotosChange, maxPhotos = 10, required = false }: PhotoCaptureProps) {
  const [loading, setLoading] = React.useState(false);

  const requestPermissions = async () => {
    const camera = await ImagePicker.requestCameraPermissionsAsync();
    if (!camera.granted) {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Limit Reached', `Maximum ${maxPhotos} photos allowed`);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotosChange([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Limit Reached', `Maximum ${maxPhotos} photos allowed`);
      return;
    }

    const hasPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!hasPermission.granted) {
      Alert.alert('Permission Required', 'Photo library permission is needed');
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsMultipleSelection: true,
      });

      if (!result.canceled) {
        const newPhotos = result.assets.map(asset => asset.uri);
        const remaining = maxPhotos - photos.length;
        const photosToAdd = newPhotos.slice(0, remaining);
        onPhotosChange([...photos, ...photosToAdd]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick photos');
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = (index: number) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const newPhotos = photos.filter((_, i) => i !== index);
          onPhotosChange(newPhotos);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttons}>
        <Pressable
          style={[styles.button, styles.cameraButton]}
          onPress={takePhoto}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>📷 Take Photo</Text>
          )}
        </Pressable>
        <Pressable
          style={[styles.button, styles.galleryButton]}
          onPress={pickFromGallery}
          disabled={loading}
        >
          <Text style={styles.galleryButtonText}>🖼️ Gallery</Text>
        </Pressable>
      </View>

      {photos.length > 0 && (
        <View style={styles.grid}>
          {photos.map((uri, index) => (
            <Pressable
              key={index}
              style={styles.photoWrapper}
              onPress={() => deletePhoto(index)}
            >
              <Image source={{ uri }} style={styles.photo} />
              <View style={styles.deleteOverlay}>
                <Text style={styles.deleteText}>×</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {required && photos.length === 0 && (
        <Text style={styles.requiredText}>At least one photo is required</Text>
      )}

      <Text style={styles.counter}>{photos.length} / {maxPhotos} photos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cameraButton: {
    backgroundColor: '#059669',
  },
  galleryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  galleryButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  deleteOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  requiredText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 8,
  },
  counter: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 4,
  },
});
