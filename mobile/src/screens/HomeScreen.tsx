import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { screenshotApi, getMediaUrl } from '../api/client';
import type { Screenshot } from '../types';
import type { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // 2 columns with padding

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const queryClient = useQueryClient();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['screenshots', showFavoritesOnly],
    queryFn: () => screenshotApi.getAll({ favorites_only: showFavoritesOnly, limit: 100 }),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: number) => screenshotApi.toggleFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screenshots'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => screenshotApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screenshots'] });
    },
  });

  const handleScreenshotPress = (screenshot: Screenshot) => {
    navigation.navigate('ScreenshotDetail', { screenshotId: screenshot.id });
  };

  const handleToggleFavorite = (id: number, e: any) => {
    e.stopPropagation();
    toggleFavoriteMutation.mutate(id);
  };

  const renderScreenshot = ({ item }: { item: Screenshot }) => (
    <TouchableOpacity
      style={styles.screenshotCard}
      onPress={() => handleScreenshotPress(item)}
    >
      <Image
        source={{ uri: getMediaUrl(item.file_path) }}
        style={styles.screenshotImage}
        resizeMode="cover"
      />
      <View style={styles.screenshotOverlay}>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(e) => handleToggleFavorite(item.id, e)}
        >
          <Ionicons
            name={item.is_favorite ? 'heart' : 'heart-outline'}
            size={24}
            color={item.is_favorite ? '#ef4444' : '#fff'}
          />
        </TouchableOpacity>
        {!item.is_processed && (
          <View style={styles.processingBadge}>
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
      </View>
      {item.ai_description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.description} numberOfLines={2}>
            {item.ai_description}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data?.total || 0}</Text>
          <Text style={styles.statLabel}>Screenshots</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {data?.screenshots?.filter(s => s.is_processed).length || 0}
          </Text>
          <Text style={styles.statLabel}>Processed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {data?.screenshots?.filter(s => s.is_favorite).length || 0}
          </Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
      </View>

      {/* Filter Toggle */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            showFavoritesOnly && styles.filterButtonActive,
          ]}
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Ionicons
            name={showFavoritesOnly ? 'heart' : 'heart-outline'}
            size={20}
            color={showFavoritesOnly ? '#fff' : '#0284c7'}
          />
          <Text
            style={[
              styles.filterButtonText,
              showFavoritesOnly && styles.filterButtonTextActive,
            ]}
          >
            Favorites Only
          </Text>
        </TouchableOpacity>
      </View>

      {/* Screenshots Grid */}
      <FlatList
        data={data?.screenshots || []}
        renderItem={renderScreenshot}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No screenshots yet</Text>
            <Text style={styles.emptySubtext}>
              Use the camera tab to capture your first screenshot
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  filterBar: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  filterButtonActive: {
    backgroundColor: '#0284c7',
  },
  filterButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  grid: {
    padding: 12,
  },
  row: {
    justifyContent: 'space-between',
  },
  screenshotCard: {
    width: ITEM_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  screenshotImage: {
    width: '100%',
    height: ITEM_WIDTH * 1.2,
  },
  screenshotOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 8,
  },
  favoriteButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 6,
  },
  processingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  processingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  descriptionContainer: {
    padding: 8,
    backgroundColor: '#fff',
  },
  description: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
});
