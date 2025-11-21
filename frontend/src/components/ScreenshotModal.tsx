import { X, Heart, Download, Trash2, Tag, Calendar, FileText } from 'lucide-react';
import type { Screenshot } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface ScreenshotModalProps {
  screenshot: Screenshot;
  onClose: () => void;
  onToggleFavorite?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function ScreenshotModal({
  screenshot,
  onClose,
  onToggleFavorite,
  onDelete,
}: ScreenshotModalProps) {
  const getImageUrl = (filePath: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${baseUrl}/${filePath}`;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 truncate">
            {screenshot.file_name}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleFavorite?.(screenshot.id)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={screenshot.is_favorite ? 'Unfavorite' : 'Favorite'}
            >
              <Heart
                className={`w-5 h-5 ${
                  screenshot.is_favorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                }`}
              />
            </button>
            <a
              href={getImageUrl(screenshot.file_path)}
              download={screenshot.file_name}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </a>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this screenshot?')) {
                  onDelete?.(screenshot.id);
                  onClose();
                }
              }}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image */}
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={getImageUrl(screenshot.file_path)}
                  alt={screenshot.file_name}
                  className="w-full h-auto"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Size:</span>{' '}
                  {screenshot.file_size
                    ? `${(screenshot.file_size / 1024).toFixed(2)} KB`
                    : 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Dimensions:</span>{' '}
                  {screenshot.width && screenshot.height
                    ? `${screenshot.width}x${screenshot.height}`
                    : 'N/A'}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6">
              {/* AI Description */}
              {screenshot.ai_description && (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-5 h-5 text-primary-600" />
                    <h3 className="font-semibold text-gray-900">AI Description</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {screenshot.ai_description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {screenshot.ai_tags && screenshot.ai_tags.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Tag className="w-5 h-5 text-primary-600" />
                    <h3 className="font-semibold text-gray-900">Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {screenshot.ai_tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* OCR Text */}
              {screenshot.ocr_text && (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-5 h-5 text-primary-600" />
                    <h3 className="font-semibold text-gray-900">Extracted Text</h3>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {screenshot.ocr_text}
                    </pre>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-gray-900">Metadata</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Created:</span>{' '}
                    <span className="text-gray-900">
                      {formatDistanceToNow(new Date(screenshot.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {screenshot.location && (
                    <div>
                      <span className="font-medium text-gray-600">Location:</span>{' '}
                      <span className="text-gray-900">{screenshot.location}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-600">Processing Status:</span>{' '}
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        screenshot.is_processed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {screenshot.is_processed ? 'Processed' : 'Processing...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
