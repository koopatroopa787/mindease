import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { screenshotApi, audioApi } from '../api/client';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import type { Screenshot, AudioRecording } from '../types';

interface CaptureState {
  imageUri: string;
  savedAssetId?: string;
  screenshot?: Screenshot;
  audioUri?: string;
  audioDuration?: number;
}

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [audioPermission, requestAudioPermission] = Audio.usePermissions();

  const [captureState, setCaptureState] = useState<CaptureState | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [showResults, setShowResults] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Upload screenshot mutation
  const uploadScreenshotMutation = useMutation({
    mutationFn: ({ uri, fileName }: { uri: string; fileName: string }) =>
      screenshotApi.upload(uri, fileName, 'image/jpeg'),
    onSuccess: (data) => {
      setCaptureState((prev) => prev ? { ...prev, screenshot: data } : null);
      queryClient.invalidateQueries({ queryKey: ['screenshots'] });
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to upload screenshot. Please try again.');
      console.error('Upload error:', error);
    },
  });

  // Upload audio mutation
  const uploadAudioMutation = useMutation({
    mutationFn: ({ uri, fileName, screenshotId }: { uri: string; fileName: string; screenshotId: number }) =>
      audioApi.upload(uri, fileName, screenshotId, 'audio/m4a'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio'] });
      setShowResults(true);
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to upload voice memo. Please try again.');
      console.error('Audio upload error:', error);
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  if (!cameraPermission || !mediaPermission || !audioPermission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  if (!cameraPermission.granted || !mediaPermission.granted || !audioPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#cbd5e1" />
        <Text style={styles.permissionTitle}>Permissions Required</Text>
        <Text style={styles.permissionText}>
          MindEase needs camera, storage, and microphone access to capture and analyze screenshots
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => {
            requestCameraPermission();
            requestMediaPermission();
            requestAudioPermission();
          }}
        >
          <Text style={styles.permissionButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });

        if (photo) {
          // Save to device storage
          const asset = await MediaLibrary.createAssetAsync(photo.uri);

          Alert.alert(
            'Screenshot Captured!',
            'Your screenshot has been saved to your device. Uploading for AI analysis...',
            [{ text: 'OK' }]
          );

          setCaptureState({
            imageUri: photo.uri,
            savedAssetId: asset.id,
          });

          // Auto-upload for AI analysis
          const fileName = `screenshot_${Date.now()}.jpg`;
          uploadScreenshotMutation.mutate({ uri: photo.uri, fileName });
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture image');
      }
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;

        setCaptureState({
          imageUri: uri,
        });

        // Auto-upload for AI analysis
        const fileName = `screenshot_${Date.now()}.jpg`;
        uploadScreenshotMutation.mutate({ uri, fileName });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const startAudioRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecordingAudio(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= 60) {
            stopAudioRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopAudioRecording = async () => {
    if (!recording) return;

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setIsRecordingAudio(false);
      setRecording(null);

      if (uri) {
        setCaptureState((prev) => prev ? {
          ...prev,
          audioUri: uri,
          audioDuration: recordingTime,
        } : null);

        Alert.alert(
          'Voice Memo Recorded!',
          'Your voice memo will be transcribed and analyzed with the screenshot.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const handleSubmit = () => {
    if (!captureState?.screenshot) {
      Alert.alert('Error', 'Please wait for screenshot to upload');
      return;
    }

    if (captureState.audioUri) {
      // Upload voice memo
      const fileName = `voice_memo_${Date.now()}.m4a`;
      uploadAudioMutation.mutate({
        uri: captureState.audioUri,
        fileName,
        screenshotId: captureState.screenshot.id,
      });
    } else {
      // No voice memo, just show results
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setCaptureState(null);
    setShowResults(false);
    setRecordingTime(0);
    queryClient.invalidateQueries({ queryKey: ['screenshots'] });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // Results Modal
  if (showResults && captureState?.screenshot) {
    const screenshot = captureState.screenshot;

    return (
      <ScrollView style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Ionicons name="checkmark-circle" size={64} color="#10b981" />
          <Text style={styles.resultsTitle}>Analysis Complete!</Text>
        </View>

        <Image
          source={{ uri: captureState.imageUri }}
          style={styles.resultImage}
          resizeMode="contain"
        />

        {/* Processing Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Ionicons name="image" size={24} color="#0284c7" />
            <Text style={styles.statusLabel}>Screenshot</Text>
            <View style={[styles.statusBadge, styles.statusComplete]}>
              <Text style={styles.statusText}>✓ Processed</Text>
            </View>
          </View>
          {captureState.audioUri && (
            <View style={styles.statusRow}>
              <Ionicons name="mic" size={24} color="#0284c7" />
              <Text style={styles.statusLabel}>Voice Memo</Text>
              <View style={[styles.statusBadge,
                uploadAudioMutation.isPending ? styles.statusProcessing : styles.statusComplete]}>
                <Text style={styles.statusText}>
                  {uploadAudioMutation.isPending ? '⏳ Processing...' : '✓ Processed'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* AI Analysis Results */}
        {screenshot.ai_description && (
          <View style={styles.resultCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="sparkles" size={20} color="#0284c7" />
              <Text style={styles.cardTitle}>AI Analysis</Text>
            </View>
            <Text style={styles.resultText}>{screenshot.ai_description}</Text>
          </View>
        )}

        {/* Tags */}
        {screenshot.ai_tags && screenshot.ai_tags.length > 0 && (
          <View style={styles.resultCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="pricetag" size={20} color="#0284c7" />
              <Text style={styles.cardTitle}>Auto Tags</Text>
            </View>
            <View style={styles.tagsContainer}>
              {screenshot.ai_tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* OCR Text */}
        {screenshot.ocr_text && (
          <View style={styles.resultCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={20} color="#0284c7" />
              <Text style={styles.cardTitle}>Extracted Text</Text>
            </View>
            <View style={styles.ocrContainer}>
              <Text style={styles.ocrText}>{screenshot.ocr_text}</Text>
            </View>
          </View>
        )}

        {/* Storage Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#64748b" />
          <Text style={styles.infoText}>
            Screenshot saved to your device and analyzed by AI. You can find it in the Home tab.
          </Text>
        </View>

        <TouchableOpacity style={styles.doneButton} onPress={handleReset}>
          <Text style={styles.doneButtonText}>Capture Another Screenshot</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // Capture Preview & Voice Memo
  if (captureState) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: captureState.imageUri }}
          style={styles.preview}
          resizeMode="contain"
        />

        <View style={styles.previewOverlay}>
          {/* Processing Indicator */}
          {uploadScreenshotMutation.isPending && (
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color="#0284c7" />
              <Text style={styles.processingText}>Analyzing screenshot with AI...</Text>
            </View>
          )}

          {/* Voice Memo Section */}
          {captureState.screenshot && !uploadScreenshotMutation.isPending && (
            <View style={styles.voiceMemoCard}>
              <View style={styles.voiceMemoHeader}>
                <Ionicons name="mic-circle" size={32} color="#0284c7" />
                <Text style={styles.voiceMemoTitle}>Add Voice Memo (Optional)</Text>
              </View>
              <Text style={styles.voiceMemoSubtitle}>
                Record additional context about this screenshot
              </Text>

              {!captureState.audioUri && !isRecordingAudio && (
                <TouchableOpacity
                  style={styles.recordButton}
                  onPress={startAudioRecording}
                >
                  <Ionicons name="mic" size={24} color="#fff" />
                  <Text style={styles.recordButtonText}>Start Recording</Text>
                </TouchableOpacity>
              )}

              {isRecordingAudio && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.recordingText}>Recording...</Text>
                  <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
                  <TouchableOpacity
                    style={styles.stopButton}
                    onPress={stopAudioRecording}
                  >
                    <Ionicons name="stop" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              {captureState.audioUri && (
                <View style={styles.audioComplete}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  <Text style={styles.audioCompleteText}>
                    Voice memo recorded ({formatTime(captureState.audioDuration || 0)})
                  </Text>
                  <TouchableOpacity
                    onPress={() => setCaptureState((prev) => prev ? {
                      ...prev,
                      audioUri: undefined,
                      audioDuration: undefined,
                    } : null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {captureState.screenshot && !uploadScreenshotMutation.isPending && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleReset}
            >
              <Ionicons name="close" size={24} color="#ef4444" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={uploadAudioMutation.isPending}
            >
              {uploadAudioMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={24} color="#fff" />
                  <Text style={styles.submitButtonText}>
                    {captureState.audioUri ? 'Submit All' : 'Continue'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Camera View
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.cameraOverlay}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.centerHelp}>
            <View style={styles.helpCard}>
              <Ionicons name="information-circle" size={24} color="#0284c7" />
              <Text style={styles.helpText}>
                Capture a screenshot to analyze with AI
              </Text>
            </View>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.iconButton} onPress={pickFromGallery}>
              <Ionicons name="images" size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <View style={{ width: 48 }} />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
  },
  permissionText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingTop: 40,
  },
  centerHelp: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  helpCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  helpText: {
    marginTop: 8,
    fontSize: 14,
    color: '#1e293b',
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  iconButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#0284c7',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0284c7',
  },
  preview: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  processingCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 250,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  voiceMemoCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  voiceMemoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  voiceMemoTitle: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  voiceMemoSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  recordButtonText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recordingIndicator: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    marginBottom: 12,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  recordingTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  stopButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 8,
  },
  audioCompleteText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#15803d',
    fontWeight: '600',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  cancelButtonText: {
    marginLeft: 8,
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#0284c7',
  },
  submitButtonText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  resultsHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
  },
  resultsTitle: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  resultImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#e2e8f0',
  },
  statusCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusComplete: {
    backgroundColor: '#dcfce7',
  },
  statusProcessing: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  resultCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  resultText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
  },
  ocrContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
  },
  ocrText: {
    fontSize: 12,
    color: '#475569',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#0369a1',
    lineHeight: 18,
  },
  doneButton: {
    backgroundColor: '#0284c7',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
