import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { screenshotApi } from '../api/client';
import ScreenshotUpload from '../components/ScreenshotUpload';
import ScreenshotGrid from '../components/ScreenshotGrid';
import ScreenshotModal from '../components/ScreenshotModal';
import SearchBar from '../components/SearchBar';
import { Filter, Star } from 'lucide-react';
import type { Screenshot } from '../types';

export default function Home() {
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const queryClient = useQueryClient();

  const { data: screenshotsData, isLoading } = useQuery({
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

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['screenshots'] });
  };

  const handleToggleFavorite = (id: number) => {
    toggleFavoriteMutation.mutate(id);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this screenshot?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSearch = (query: string, searchType: string) => {
    setSearchQuery(query);
    // TODO: Implement actual search
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Your Screenshots</h2>
        <p className="mt-1 text-gray-600">
          Capture, organize, and search your visual memories
        </p>
      </div>

      {/* Upload Section */}
      <ScreenshotUpload onUploadComplete={handleUploadComplete} />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar onSearch={handleSearch} />
        </div>
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${showFavoritesOnly
            ? 'bg-primary-600 text-white'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
        >
          <Star className={`w-5 h-5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
          <span>Favorites</span>
        </button>
      </div>

      {/* Screenshots Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">
          Loading screenshots...
        </div>
      ) : (
        <ScreenshotGrid
          screenshots={screenshotsData?.screenshots || []}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDelete}
          onView={setSelectedScreenshot}
        />
      )}

      {/* Stats */}
      {screenshotsData && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {screenshotsData.total}
              </div>
              <div className="text-sm text-gray-600">Total Screenshots</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {screenshotsData.screenshots.filter(s => s.is_processed).length}
              </div>
              <div className="text-sm text-gray-600">Processed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600">
                {screenshotsData.screenshots.filter(s => s.is_favorite).length}
              </div>
              <div className="text-sm text-gray-600">Favorites</div>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Detail Modal */}
      {selectedScreenshot && (
        <ScreenshotModal
          screenshot={selectedScreenshot}
          onClose={() => setSelectedScreenshot(null)}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
