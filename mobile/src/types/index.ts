export interface Screenshot {
  id: number;
  user_id: number;
  file_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  ocr_text?: string;
  ai_description?: string;
  ai_tags?: string[];
  location?: string;
  is_favorite: boolean;
  is_processed: boolean;
  captured_at?: string;
  created_at: string;
  updated_at?: string;
  tags: Tag[];
}

export interface Tag {
  id: number;
  name: string;
  color?: string;
}

export interface Collection {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_smart: boolean;
  created_at: string;
  updated_at?: string;
  screenshot_count: number;
}

export interface AudioRecording {
  id: number;
  user_id: number;
  screenshot_id?: number;
  file_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  duration?: number;
  transcription?: string;
  summary?: string;
  is_processed: boolean;
  recorded_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface SearchRequest {
  query: string;
  search_type?: 'semantic' | 'keyword' | 'both';
  collection_id?: number;
  favorites_only?: boolean;
  limit?: number;
}

export interface SearchResult {
  screenshot: Screenshot;
  similarity_score: number;
  match_type: string;
  highlights?: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  search_type: string;
}
