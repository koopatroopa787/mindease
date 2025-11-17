import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { searchApi, screenshotApi } from '../api/client';
import SearchBar from '../components/SearchBar';
import ScreenshotGrid from '../components/ScreenshotGrid';
import { Sparkles, Clock } from 'lucide-react';
import type { Screenshot, SearchResponse } from '../types';

export default function Search() {
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const searchMutation = useMutation({
    mutationFn: (params: {
      query: string;
      search_type: 'semantic' | 'keyword' | 'both';
    }) =>
      searchApi.search({
        query: params.query,
        search_type: params.search_type,
        limit: 50,
      }),
    onSuccess: (data, variables) => {
      setSearchResults(data);
      // Add to recent searches
      setRecentSearches((prev) => {
        const updated = [variables.query, ...prev.filter((q) => q !== variables.query)];
        return updated.slice(0, 5);
      });
    },
  });

  const handleSearch = (query: string, searchType: 'semantic' | 'keyword' | 'both') => {
    searchMutation.mutate({ query, search_type: searchType });
  };

  const handleRecentSearch = (query: string) => {
    searchMutation.mutate({ query, search_type: 'both' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Search Your Screenshots</h2>
        <p className="mt-1 text-gray-600">
          Find anything with powerful AI-powered semantic search
        </p>
      </div>

      {/* Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        placeholder="Try: 'meeting notes from last week' or 'screenshots with code'"
      />

      {/* Search Type Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Sparkles className="w-6 h-6 text-primary-600" />
            <h3 className="font-semibold text-gray-900">AI Semantic Search</h3>
          </div>
          <p className="text-sm text-gray-700">
            Search by meaning, not just keywords. Find screenshots based on context and content.
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Recent Searches</h3>
          </div>
          {recentSearches.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {recentSearches.map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearch(query)}
                  className="px-3 py-1 bg-white text-purple-700 rounded-full text-sm hover:bg-purple-50 transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-700">No recent searches yet</p>
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchMutation.isPending && (
        <div className="text-center py-12 text-gray-500">
          Searching with AI...
        </div>
      )}

      {searchResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Found {searchResults.total} results for "{searchResults.query}"
            </h3>
            <span className="text-sm text-gray-500">
              Search type: {searchResults.search_type}
            </span>
          </div>

          <ScreenshotGrid
            screenshots={searchResults.results.map((r) => r.screenshot)}
            onToggleFavorite={(id) => console.log('Toggle favorite:', id)}
            onDelete={(id) => console.log('Delete:', id)}
            onView={(screenshot) => console.log('View:', screenshot)}
          />
        </div>
      )}

      {!searchResults && !searchMutation.isPending && (
        <div className="text-center py-12 text-gray-500">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">Start searching to find your screenshots</p>
          <p className="text-sm mt-2">Try natural language queries for best results</p>
        </div>
      )}
    </div>
  );
}
