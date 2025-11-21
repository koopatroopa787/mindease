import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { searchApi, getMediaUrl } from '../api/client';
import type { SearchResult } from '../types';
import type { RootStackParamList } from '../navigation/AppNavigator';

type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

export default function SearchScreen() {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'semantic' | 'keyword' | 'both'>('both');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['search', searchQuery, searchType],
    queryFn: () =>
      searchApi.search({
        query: searchQuery,
        search_type: searchType,
        limit: 50,
      }),
    enabled: searchQuery.length > 0,
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      refetch();
    }
  };

  const handleResultPress = (result: SearchResult) => {
    navigation.navigate('ScreenshotDetail', { screenshotId: result.screenshot.id });
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => handleResultPress(item)}
    >
      <Image
        source={{ uri: getMediaUrl(item.screenshot.file_path) }}
        style={styles.resultImage}
        resizeMode="cover"
      />
      <View style={styles.resultInfo}>
        <View style={styles.resultHeader}>
          <Text style={styles.matchType}>{item.match_type}</Text>
          <Text style={styles.score}>
            {(item.similarity_score * 100).toFixed(0)}%
          </Text>
        </View>
        {item.screenshot.ai_description && (
          <Text style={styles.resultDescription} numberOfLines={2}>
            {item.screenshot.ai_description}
          </Text>
        )}
        {item.highlights && item.highlights.length > 0 && (
          <View style={styles.highlightsContainer}>
            {item.highlights.slice(0, 3).map((highlight, index) => (
              <View key={index} style={styles.highlight}>
                <Text style={styles.highlightText} numberOfLines={1}>
                  {highlight}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.input}
            placeholder="Search screenshots..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Type Toggle */}
      <View style={styles.searchTypeBar}>
        <TouchableOpacity
          style={[
            styles.searchTypeButton,
            searchType === 'semantic' && styles.searchTypeButtonActive,
          ]}
          onPress={() => setSearchType('semantic')}
        >
          <Ionicons
            name="sparkles"
            size={16}
            color={searchType === 'semantic' ? '#fff' : '#0284c7'}
          />
          <Text
            style={[
              styles.searchTypeText,
              searchType === 'semantic' && styles.searchTypeTextActive,
            ]}
          >
            AI Search
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.searchTypeButton,
            searchType === 'keyword' && styles.searchTypeButtonActive,
          ]}
          onPress={() => setSearchType('keyword')}
        >
          <Ionicons
            name="text"
            size={16}
            color={searchType === 'keyword' ? '#fff' : '#0284c7'}
          />
          <Text
            style={[
              styles.searchTypeText,
              searchType === 'keyword' && styles.searchTypeTextActive,
            ]}
          >
            Keyword
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.searchTypeButton,
            searchType === 'both' && styles.searchTypeButtonActive,
          ]}
          onPress={() => setSearchType('both')}
        >
          <Ionicons
            name="options"
            size={16}
            color={searchType === 'both' ? '#fff' : '#0284c7'}
          />
          <Text
            style={[
              styles.searchTypeText,
              searchType === 'both' && styles.searchTypeTextActive,
            ]}
          >
            Both
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {searchQuery.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyText}>Search your screenshots</Text>
          <Text style={styles.emptySubtext}>
            Use AI-powered semantic search or keyword search
          </Text>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : data && data.results.length > 0 ? (
        <FlatList
          data={data.results}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.screenshot.id.toString()}
          contentContainerStyle={styles.resultsList}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {data.total} result{data.total !== 1 ? 's' : ''} found
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>
            Try different keywords or search type
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchBar: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1e293b',
  },
  searchTypeBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  searchTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  searchTypeButtonActive: {
    backgroundColor: '#0284c7',
  },
  searchTypeText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
  },
  searchTypeTextActive: {
    color: '#fff',
  },
  resultsList: {
    padding: 12,
  },
  resultsHeader: {
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  resultCard: {
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
  resultImage: {
    width: '100%',
    height: 200,
  },
  resultInfo: {
    padding: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
    textTransform: 'uppercase',
  },
  score: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  resultDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 8,
  },
  highlightsContainer: {
    gap: 4,
  },
  highlight: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  highlightText: {
    fontSize: 12,
    color: '#92400e',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
});
