import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { screenshotApi, audioApi, getMediaUrl } from '../api/client';
import type { RootStackParamList } from '../navigation/AppNavigator';
import AudioRecorder from '../components/AudioRecorder';
import AudioList from '../components/AudioList';
import { formatDistanceToNow } from 'date-fns';

type ScreenshotDetailRouteProp = RouteProp<RootStackParamList, 'ScreenshotDetail'>;

const { width } = Dimensions.get('window');

export default function ScreenshotDetailScreen() {
  const route = useRoute<ScreenshotDetailRouteProp>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { screenshotId } = route.params;
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  const { data: screenshot, isLoading } = useQuery({
    queryKey: ['screenshot', screenshotId],
    queryFn: () => screenshotApi.getById(screenshotId),
  });

  const { data: audioData } = useQuery({
    queryKey: ['audio', screenshotId],
    queryFn: () => audioApi.getAll({ screenshot_id: screenshotId, limit: 50 }),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: () => screenshotApi.toggleFavorite(screenshotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screenshot', screenshotId] });
      queryClient.invalidateQueries({ queryKey: ['screenshots'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => screenshotApi.delete(screenshotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screenshots'] });
      navigation.goBack();
    },
  });

  const deleteAudioMutation = useMutation({
    mutationFn: (id: number) => audioApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio', screenshotId] });
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Screenshot',
      'Are you sure you want to delete this screenshot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  const handleAudioRecordingComplete = (uri: string, duration: number) => {
    setShowAudioRecorder(false);
    // The AudioRecorder component will handle the upload
  };

  if (isLoading || !screenshot) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Image */}
      <Image
        source={{ uri: getMediaUrl(screenshot.file_path) }}
        style={styles.image}
        resizeMode="contain"
      />

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => toggleFavoriteMutation.mutate()}
        >
          <Ionicons
            name={screenshot.is_favorite ? 'heart' : 'heart-outline'}
            size={24}
            color={screenshot.is_favorite ? '#ef4444' : '#64748b'}
          />
          <Text style={styles.actionText}>
            {screenshot.is_favorite ? 'Unfavorite' : 'Favorite'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Size:</Text>
          <Text style={styles.infoValue}>
            {screenshot.file_size
              ? `${(screenshot.file_size / 1024).toFixed(2)} KB`
              : 'N/A'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dimensions:</Text>
          <Text style={styles.infoValue}>
            {screenshot.width && screenshot.height
              ? `${screenshot.width}x${screenshot.height}`
              : 'N/A'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Created:</Text>
          <Text style={styles.infoValue}>
            {formatDistanceToNow(new Date(screenshot.created_at), {
              addSuffix: true,
            })}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <View
            style={[
              styles.statusBadge,
              screenshot.is_processed ? styles.statusProcessed : styles.statusProcessing,
            ]}
          >
            <Text style={styles.statusText}>
              {screenshot.is_processed ? 'Processed' : 'Processing...'}
            </Text>
          </View>
        </View>
      </View>

      {/* AI Description */}
      {screenshot.ai_description && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="sparkles" size={20} color="#0284c7" />
            <Text style={styles.cardTitle}>AI Description</Text>
          </View>
          <Text style={styles.description}>{screenshot.ai_description}</Text>
        </View>
      )}

      {/* Tags */}
      {screenshot.ai_tags && screenshot.ai_tags.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pricetag" size={20} color="#0284c7" />
            <Text style={styles.cardTitle}>Tags</Text>
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
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={20} color="#0284c7" />
            <Text style={styles.cardTitle}>Extracted Text</Text>
          </View>
          <View style={styles.ocrContainer}>
            <Text style={styles.ocrText}>{screenshot.ocr_text}</Text>
          </View>
        </View>
      )}

      {/* Voice Memos */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="mic" size={20} color="#0284c7" />
          <Text style={styles.cardTitle}>Voice Memos</Text>
          {audioData && audioData.recordings.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{audioData.recordings.length}</Text>
            </View>
          )}
        </View>

        {!showAudioRecorder && (
          <TouchableOpacity
            style={styles.addVoiceMemoButton}
            onPress={() => setShowAudioRecorder(true)}
          >
            <Ionicons name="add-circle" size={20} color="#0284c7" />
            <Text style={styles.addVoiceMemoText}>Add Voice Memo</Text>
          </TouchableOpacity>
        )}

        {showAudioRecorder && (
          <View style={styles.audioRecorderContainer}>
            <AudioRecorder
              screenshotId={screenshotId}
              onRecordingComplete={handleAudioRecordingComplete}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAudioRecorder(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {audioData && (
          <AudioList
            recordings={audioData.recordings}
            onDelete={(id) => deleteAudioMutation.mutate(id)}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  image: {
    width: width,
    height: width * 1.2,
    backgroundColor: '#e2e8f0',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusProcessed: {
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
  description: {
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
  badge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
  },
  addVoiceMemoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0284c7',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addVoiceMemoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#0284c7',
    fontWeight: '600',
  },
  audioRecorderContainer: {
    marginBottom: 16,
  },
  cancelButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#64748b',
  },
});
