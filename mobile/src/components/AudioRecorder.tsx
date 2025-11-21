import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { audioApi } from '../api/client';

interface AudioRecorderProps {
  screenshotId: number;
  maxDuration?: number;
  onRecordingComplete?: (uri: string, duration: number) => void;
}

export default function AudioRecorder({
  screenshotId,
  maxDuration = 60,
  onRecordingComplete,
}: AudioRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: ({ uri, fileName }: { uri: string; fileName: string }) =>
      audioApi.upload(uri, fileName, screenshotId, 'audio/m4a'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio', screenshotId] });
      Alert.alert('Success', 'Voice memo uploaded successfully!');
      resetRecorder();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to upload voice memo. Please try again.');
    },
  });

  const requestPermissions = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      return permission.granted;
    } catch (err) {
      console.error('Failed to get permission', err);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Microphone access is required to record audio');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const pauseRecording = async () => {
    if (recording) {
      await recording.pauseAsync();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = async () => {
    if (recording) {
      await recording.startAsync();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setIsRecording(false);
      setRecording(null);

      if (uri && onRecordingComplete) {
        onRecordingComplete(uri, duration);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordingUri });
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      await newSound.playAsync();
    } catch (err) {
      console.error('Failed to play recording', err);
    }
  };

  const pausePlayback = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    setRecordingUri(null);
    setDuration(0);
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
  };

  const resetRecorder = () => {
    deleteRecording();
    setIsRecording(false);
    setIsPaused(false);
  };

  const handleUpload = () => {
    if (recordingUri) {
      const fileName = `voice_memo_${Date.now()}.m4a`;
      uploadMutation.mutate({ uri: recordingUri, fileName });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (recordingUri) {
    return (
      <View style={styles.container}>
        <View style={styles.completedContainer}>
          <Ionicons name="checkmark-circle" size={48} color="#10b981" />
          <Text style={styles.completedText}>Recording Complete</Text>
          <Text style={styles.durationText}>Duration: {formatTime(duration)}</Text>

          <View style={styles.playbackControls}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={isPlaying ? pausePlayback : playRecording}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={24}
                color="#0284c7"
              />
              <Text style={styles.playButtonText}>
                {isPlaying ? 'Pause' : 'Play'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={deleteRecording}>
              <Ionicons name="trash" size={24} color="#ef4444" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUpload}
            disabled={uploadMutation.isPending}
          >
            <Text style={styles.uploadButtonText}>
              {uploadMutation.isPending ? 'Uploading...' : 'Upload Voice Memo'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isRecording) {
    return (
      <View style={styles.container}>
        <View style={styles.recordingContainer}>
          <View style={styles.recordingIndicator}>
            <View style={styles.pulseDot} />
            <Text style={styles.recordingText}>Recording...</Text>
          </View>
          <Text style={styles.timerText}>{formatTime(duration)}</Text>
          <Text style={styles.maxDurationText}>Max: {formatTime(maxDuration)}</Text>

          <View style={styles.controls}>
            {isPaused ? (
              <TouchableOpacity style={styles.controlButton} onPress={resumeRecording}>
                <Ionicons name="play" size={32} color="#0284c7" />
                <Text style={styles.controlText}>Resume</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.controlButton} onPress={pauseRecording}>
                <Ionicons name="pause" size={32} color="#f59e0b" />
                <Text style={styles.controlText}>Pause</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.controlButton} onPress={stopRecording}>
              <Ionicons name="stop" size={32} color="#ef4444" />
              <Text style={styles.controlText}>Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.startContainer}>
        <Ionicons name="mic-outline" size={48} color="#0284c7" />
        <Text style={styles.startTitle}>Record Voice Memo</Text>
        <Text style={styles.startSubtitle}>
          Maximum duration: {maxDuration} seconds
        </Text>
        <TouchableOpacity style={styles.startButton} onPress={startRecording}>
          <Ionicons name="mic" size={24} color="#fff" />
          <Text style={styles.startButtonText}>Start Recording</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  startContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  startTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 12,
  },
  startSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  recordingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  maxDurationText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  completedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 12,
  },
  durationText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
  },
  playbackControls: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  playButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  uploadButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
