import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionApi } from '../api/client';
import { Plus, Folder, X } from 'lucide-react';
import type { Collection } from '../types';

export default function Collections() {
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: collectionsData, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => collectionApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      collectionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setIsCreating(false);
      setNewCollectionName('');
      setNewCollectionDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => collectionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCollectionName.trim()) {
      createMutation.mutate({
        name: newCollectionName,
        description: newCollectionDescription || undefined,
      });
    }
  };

  const handleDeleteCollection = (id: number) => {
    if (confirm('Are you sure you want to delete this collection?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Collections</h2>
          <p className="mt-1 text-gray-600">Organize your screenshots into collections</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Create Collection Form */}
      {isCreating && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Create New Collection</h3>
            <button
              onClick={() => setIsCreating(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreateCollection} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection Name *
              </label>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., Work Documents, Personal Photos"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Optional description..."
                className="input"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn-primary"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Collection'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Collections Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading collections...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {collectionsData?.collections.map((collection) => (
            <div
              key={collection.id}
              className="card group relative cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <Folder className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{collection.name}</h3>
                    <p className="text-sm text-gray-500">
                      {collection.screenshot_count} items
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCollection(collection.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
              {collection.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {collection.description}
                </p>
              )}
            </div>
          ))}

          {collectionsData?.collections.length === 0 && !isCreating && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No collections yet. Create one to get started!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
