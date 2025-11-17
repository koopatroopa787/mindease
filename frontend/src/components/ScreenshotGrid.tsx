import { Heart, Trash2, Eye } from 'lucide-react';
import type { Screenshot } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface ScreenshotGridProps {
  screenshots: Screenshot[];
  onToggleFavorite?: (id: number) => void;
  onDelete?: (id: number) => void;
  onView?: (screenshot: Screenshot) => void;
}

export default function ScreenshotGrid({
  screenshots,
  onToggleFavorite,
  onDelete,
  onView,
}: ScreenshotGridProps) {
  const getImageUrl = (filePath: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${baseUrl}/${filePath}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {screenshots.map((screenshot) => (
        <div
          key={screenshot.id}
          className="card group relative overflow-hidden cursor-pointer"
          onClick={() => onView?.(screenshot)}
        >
          {/* Image */}
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2">
            <img
              src={getImageUrl(screenshot.file_path)}
              alt={screenshot.file_name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView?.(screenshot);
                }}
                className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                title="View"
              >
                <Eye className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite?.(screenshot.id);
                }}
                className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                title={screenshot.is_favorite ? 'Unfavorite' : 'Favorite'}
              >
                <Heart
                  className={`w-5 h-5 ${screenshot.is_favorite ? 'fill-red-500 text-red-500' : 'text-gray-700'
                    }`}
                />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(screenshot.id);
                }}
                className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {screenshot.file_name}
            </p>
            {screenshot.ai_description && (
              <p className="text-xs text-gray-500 line-clamp-2">
                {screenshot.ai_description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(screenshot.created_at), {
                  addSuffix: true,
                })}
              </span>
              {screenshot.is_favorite && (
                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
              )}
            </div>
            {screenshot.ai_tags && screenshot.ai_tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {screenshot.ai_tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {screenshot.ai_tags.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    +{screenshot.ai_tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Processing Indicator */}
          {!screenshot.is_processed && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span>Processing...</span>
            </div>
          )}
        </div>
      ))}

      {screenshots.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">
          No screenshots found. Upload some to get started!
        </div>
      )}
    </div>
  );
}
