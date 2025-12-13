import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { collectionApi } from '../api/client';
import type { Collection } from '../types';

export default function CollectionsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => collectionApi.getAll(),
  });

  const renderCollection = ({ item }: { item: Collection }) => (
    <TouchableOpacity style={styles.collectionCard}>
      <View style={styles.collectionHeader}>
        <View
          style={[
            styles.collectionIcon,
            { backgroundColor: item.color || '#0284c7' },
          ]}
        >
          <Ionicons
            name={(item.icon as keyof typeof Ionicons.glyphMap) || 'folder'}
            size={24}
            color="#fff"
          />
        </View>
        <View style={styles.collectionInfo}>
          <Text style={styles.collectionName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.collectionDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
        {item.is_smart && (
          <View style={styles.smartBadge}>
            <Ionicons name="sparkles" size={12} color="#f59e0b" />
          </View>
        )}
      </View>
      <View style={styles.collectionFooter}>
        <View style={styles.countContainer}>
          <Ionicons name="images" size={16} color="#64748b" />
          <Text style={styles.countText}>
            {item.screenshot_count} screenshot{item.screenshot_count !== 1 ? 's' : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.collections || []}
        renderItem={renderCollection}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          data && data.collections.length > 0 ? (
            <View style={styles.header}>
              <Text style={styles.headerText}>
                {data.total} collection{data.total !== 1 ? 's' : ''}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No collections yet</Text>
            <Text style={styles.emptySubtext}>
              Collections are automatically created based on screenshot content
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  list: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  collectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  collectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  collectionDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  smartBadge: {
    backgroundColor: '#fef3c7',
    padding: 6,
    borderRadius: 12,
  },
  collectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#64748b',
  },
  emptyState: {
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
    paddingHorizontal: 32,
  },
});
