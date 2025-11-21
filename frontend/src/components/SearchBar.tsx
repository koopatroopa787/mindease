import { useState } from 'react';
import { Search, X, Sparkles } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string, searchType: 'semantic' | 'keyword' | 'both') => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = 'Search screenshots...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'semantic' | 'keyword' | 'both'>('both');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, searchType);
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-32 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as typeof searchType)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="both">Smart</option>
            <option value="semantic">AI Search</option>
            <option value="keyword">Keyword</option>
          </select>
        </div>
      </div>
      {searchType === 'semantic' && query && (
        <div className="mt-2 flex items-center space-x-1 text-xs text-primary-600">
          <Sparkles className="w-3 h-3" />
          <span>Using AI-powered semantic search</span>
        </div>
      )}
    </form>
  );
}
