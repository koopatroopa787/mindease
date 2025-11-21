import axios from 'axios';
import type {
  Screenshot,
  Collection,
  AudioRecording,
  SearchRequest,
  SearchResponse,
} from '../types';

// For React Native, we'll use an environment variable or default
// You can set this in app.json or use expo-constants
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000'; // Android emulator default

const client = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to create FormData for React Native
const createFormData = (uri: string, name: string, type: string = 'image/jpeg') => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    name,
    type,
  } as any); // React Native FormData accepts uri, name, type
  return formData;
};

// Screenshot API
export const screenshotApi = {
  upload: async (uri: string, fileName: string, mimeType: string = 'image/jpeg'): Promise<Screenshot> => {
    const formData = createFormData(uri, fileName, mimeType);
    const { data } = await client.post('/screenshots/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getAll: async (params?: {
    skip?: number;
    limit?: number;
    favorites_only?: boolean;
  }): Promise<{ screenshots: Screenshot[]; total: number; page: number; page_size: number }> => {
    const { data } = await client.get('/screenshots', { params });
    return data;
  },

  getById: async (id: number): Promise<Screenshot> => {
    const { data } = await client.get(`/screenshots/${id}`);
    return data;
  },

  update: async (id: number, updates: Partial<Screenshot>): Promise<Screenshot> => {
    const { data } = await client.patch(`/screenshots/${id}`, updates);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/screenshots/${id}`);
  },

  toggleFavorite: async (id: number): Promise<Screenshot> => {
    const { data } = await client.post(`/screenshots/${id}/favorite`);
    return data;
  },
};

// Collection API
export const collectionApi = {
  create: async (collection: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  }): Promise<Collection> => {
    const { data } = await client.post('/collections', collection);
    return data;
  },

  getAll: async (): Promise<{ collections: Collection[]; total: number }> => {
    const { data } = await client.get('/collections');
    return data;
  },

  getById: async (id: number): Promise<Collection> => {
    const { data } = await client.get(`/collections/${id}`);
    return data;
  },

  update: async (id: number, updates: Partial<Collection>): Promise<Collection> => {
    const { data } = await client.patch(`/collections/${id}`, updates);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/collections/${id}`);
  },

  addScreenshots: async (collectionId: number, screenshotIds: number[]): Promise<void> => {
    await client.post(`/collections/${collectionId}/screenshots`, {
      screenshot_ids: screenshotIds,
    });
  },

  removeScreenshot: async (collectionId: number, screenshotId: number): Promise<void> => {
    await client.delete(`/collections/${collectionId}/screenshots/${screenshotId}`);
  },
};

// Search API
export const searchApi = {
  search: async (request: SearchRequest): Promise<SearchResponse> => {
    const { data } = await client.post('/search', request);
    return data;
  },

  getRelated: async (screenshotId: number, limit = 10): Promise<{ results: any[]; total: number }> => {
    const { data } = await client.get(`/search/related/${screenshotId}`, {
      params: { limit },
    });
    return data;
  },
};

// Audio API
export const audioApi = {
  upload: async (uri: string, fileName: string, screenshotId?: number, mimeType: string = 'audio/m4a'): Promise<AudioRecording> => {
    const formData = createFormData(uri, fileName, mimeType);
    const params = screenshotId ? { screenshot_id: screenshotId } : {};
    const { data } = await client.post('/audio/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params,
    });
    return data;
  },

  getAll: async (params?: {
    skip?: number;
    limit?: number;
    screenshot_id?: number;
  }): Promise<{ recordings: AudioRecording[]; total: number; page: number; page_size: number }> => {
    const { data } = await client.get('/audio', { params });
    return data;
  },

  getById: async (id: number): Promise<AudioRecording> => {
    const { data } = await client.get(`/audio/${id}`);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/audio/${id}`);
  },
};

// Helper to get full URL for images/audio
export const getMediaUrl = (filePath: string): string => {
  return `${API_BASE_URL}/${filePath}`;
};

export default client;
