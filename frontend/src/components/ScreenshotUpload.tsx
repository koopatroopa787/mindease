import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, Loader } from 'lucide-react';
import { screenshotApi } from '../api/client';
import type { Screenshot } from '../types';

interface ScreenshotUploadProps {
  onUploadComplete?: (screenshots: Screenshot[]) => void;
}

export default function ScreenshotUpload({ onUploadComplete }: ScreenshotUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Screenshot[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setUploading(true);

    try {
      const uploadPromises = acceptedFiles.map(file => screenshotApi.upload(file));
      const results = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...results]);
      onUploadComplete?.(results);
    } catch (err) {
      setError('Failed to upload screenshots. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    multiple: true,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-2">
          <Upload className="w-12 h-12 text-gray-400" />
          {isDragActive ? (
            <p className="text-primary-600 font-medium">Drop screenshots here...</p>
          ) : (
            <>
              <p className="text-gray-600">
                Drag & drop screenshots here, or click to select
              </p>
              <p className="text-sm text-gray-400">
                Supports PNG, JPG, GIF, WEBP
              </p>
            </>
          )}
        </div>
      </div>

      {uploading && (
        <div className="flex items-center justify-center space-x-2 text-primary-600">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Uploading and processing...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">
              {uploadedFiles.length} screenshot{uploadedFiles.length > 1 ? 's' : ''} uploaded successfully
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
