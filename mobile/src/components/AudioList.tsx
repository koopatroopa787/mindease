import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import type { AudioRecording } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { getMediaUrl } from '../api/client';

interface AudioListProps {
  recordings: AudioRecording[];
  onDelete?: (id: number) => void;
}

export default function AudioList({ recordings, onDelete }: AudioListProps) {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [sounds, setSounds] = useState<{ [key: number]: Audio.Sound }>({});

  const togglePlay = async (recording: AudioRecording) => {
    try {
      if (playingId === recording.id) {
        // Pause current
        const sound = sounds[recording.id];
        if (sound) {
          await sound.pauseAsync();
          setPlayingId(null);
        }
      } else {
        // Stop any currently playing audio
        if (playingId !== null && sounds[playingId]) {
          await sounds[playingId].pauseAsync();
        }

        // Play new audio
        let sound = sounds[recording.id];
        if (!sound) {
          const { sound: newSound } = await Audio.Sound.createAsync({
            uri: getMediaUrl(recording.file_path),
          });

          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setPlayingId(null);
            }
          });

          setSounds((prev) => ({ ...prev, [recording.id]: newSound }));
          sound = newSound;
        }

        await sound.playAsync();
        setPlayingId(recording.id);
      }
    } catch (err) {
      console.error('Error playing audio:', err);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Voice Memo',
      'Are you sure you want to delete this voice memo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Stop and unload sound if playing
            if (sounds[id]) {
              sounds[id].unloadAsync();
              const newSounds = { ...sounds };
              delete newSounds[id];
              setSounds(newSounds);
            }
            if (playingId === id) {
              setPlayingId(null);
            }
            onDelete?.(id);
          },
        },
      ]
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (recordings.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="mic-outline" size={48} color="#cbd5e1" />
        <Text style={styles.emptyText}>No voice memos yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {recordings.map((recording) => (
        <View key={recording.id} style={styles.recordingCard}>
          <View style={styles.recordingHeader}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => togglePlay(recording)}
            >
              <Ionicons
                name={playingId === recording.id ? 'pause' : 'play'}
                size={24}
                color="#0284c7"
              />
            </TouchableOpacity>

            <View style={styles.recordingInfo}>
              <View style={styles.recordingTitleRow}>
                <Ionicons name="mic" size={16} color="#64748b" />
                <Text style={styles.recordingTitle} numberOfLines={1}>
                  {recording.file_name}
                </Text>
                {recording.is_processed && (
                  <View style={styles.processedBadge}>
                    <Text style={styles.processedText}>✓</Text>
                  </View>
                )}
              </View>

              <View style={styles.recordingMetadata}>
                {recording.duration && (
                  <View style={styles.metadataItem}>
                    <Ionicons name="time-outline" size={14} color="#94a3b8" />
                    <Text style={styles.metadataText}>
                      {formatDuration(recording.duration)}
                    </Text>
                  </View>
                )}
                <Text style={styles.metadataText}>•</Text>
                <Text style={styles.metadataText}>
                  {formatDistanceToNow(new Date(recording.created_at), {
                    addSuffix: true,
                  })}
                </Text>
              </View>
            </View>

            {onDelete && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(recording.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>

          {/* Transcription */}
          {recording.transcription && (
            <View style={styles.transcriptionContainer}>
              <View style={styles.transcriptionHeader}>
                <Ionicons name="document-text-outline" size={14} color="#64748b" />
                <Text style={styles.transcriptionLabel}>Transcription</Text>
              </View>
              <Text style={styles.transcriptionText}>{recording.transcription}</Text>
            </View>
          )}

          {/* Summary */}
          {recording.summary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Summary: </Text>
                {recording.summary}
              </Text>
            </View>
          )}

          {/* Processing status */}
          {!recording.is_processed && (
            <View style={styles.processingContainer}>
              <View style={styles.processingDot} />
              <Text style={styles.processingText}>Processing transcription...</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
  },
  recordingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recordingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recordingTitle: {
    flex: 1,
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  processedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  processedText: {
    fontSize: 10,
    color: '#15803d',
    fontWeight: '600',
  },
  recordingMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  deleteButton: {
    padding: 4,
  },
  transcriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  transcriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  transcriptionLabel: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  transcriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  summaryContainer: {
    marginTop: 8,
  },
  summaryText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  summaryLabel: {
    fontWeight: '600',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  processingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
    marginRight: 6,
  },
  processingText: {
    fontSize: 12,
    color: '#f59e0b',
  },
});
