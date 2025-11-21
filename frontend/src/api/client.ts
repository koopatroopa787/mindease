import axios from 'axios';
import type {
  Screenshot,
  Collection,
  AudioRecording,
  SearchRequest,
  SearchResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Screenshot API
export const screenshotApi = {
  upload: async (file: File): Promise<Screenshot> => {
    const formData = new FormData();
    formData.append('file', file);
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
  upload: async (file: File, screenshotId?: number): Promise<AudioRecording> => {
    const formData = new FormData();
    formData.append('file', file);
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

export default client;
