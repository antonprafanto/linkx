import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Copy, 
  ExternalLink, 
  Trash2, 
  Clock,
  Filter,
  CheckCircle,
  Image as ImageIcon
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { HistoryItem } from '../types';
import toast from 'react-hot-toast';

interface HistoryPanelProps {
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ onClose }) => {
  const { state, removeFromHistory, clearHistory, setResults } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('');
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  // Filter and search history
  const filteredHistory = state.history.filter(item => {
    const matchesSearch = !searchQuery || 
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.imageData.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProvider = !filterProvider || item.provider === filterProvider;
    
    return matchesSearch && matchesProvider;
  });

  // Get unique providers for filter
  const uniqueProviders = Array.from(new Set(state.history.map(item => item.provider)));

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(itemId);
      toast.success('Prompt copied to clipboard!');
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    // Convert history item back to results format
    const results = {
      originalUrl: item.url,
      imageData: item.imageData,
      generatedPrompt: item.prompt,
      variations: [], // History doesn't store variations currently
      metadata: {
        provider: item.provider,
        style: 'detailed', // Default since not stored in history
        confidence: 0.85, // Default confidence
        processingTime: 0,
        generatedAt: item.createdAt.toISOString()
      }
    };
    
    setResults(results);
    onClose();
    toast.success('History item loaded!');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Prompt History ({state.history.length})</h3>
          {state.history.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all history? This cannot be undone.')) {
                  clearHistory();
                  toast.success('History cleared');
                }
              }}
              className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50 flex items-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search prompts, URLs, or titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="input pl-10 pr-8"
            >
              <option value="">All Providers</option>
              {uniqueProviders.map(provider => (
                <option key={provider} value={provider}>
                  {provider.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredHistory.length !== state.history.length && (
          <p className="text-sm text-gray-500">
            Showing {filteredHistory.length} of {state.history.length} items
          </p>
        )}
      </div>

      {/* History Items */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            {state.history.length === 0 ? (
              <div className="text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No prompt history yet</p>
                <p className="text-sm mt-1">Generated prompts will appear here</p>
              </div>
            ) : (
              <div className="text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No items match your search</p>
              </div>
            )}
          </div>
        ) : (
          filteredHistory.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-white transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`provider-badge ${item.provider} text-xs`}>
                      {item.provider.toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {item.createdAt.toLocaleDateString()} {item.createdAt.toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 truncate">
                    {item.imageData.title || 'Untitled'}
                  </h4>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`platform-badge ${item.imageData.platform} text-xs`}>
                      {item.imageData.platform}
                    </span>
                    {item.imageData.category && (
                      <span className="text-xs text-gray-500">
                        {item.imageData.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={() => copyToClipboard(item.prompt, item.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="Copy prompt"
                  >
                    {copiedPrompt === item.id ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="View original"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  
                  <button
                    onClick={() => removeFromHistory(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Prompt Preview */}
              <div className="bg-white border border-gray-200 rounded-md p-3 mb-3">
                <p className="text-sm text-gray-700 line-clamp-3 font-mono">
                  {item.prompt}
                </p>
              </div>

              {/* Tags */}
              {item.imageData.tags && item.imageData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.imageData.tags.slice(0, 5).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {item.imageData.tags.length > 5 && (
                    <span className="text-xs text-gray-500 py-0.5">
                      +{item.imageData.tags.length - 5} more
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end">
                <button
                  onClick={() => loadHistoryItem(item)}
                  className="btn btn-primary text-sm px-4 py-2"
                >
                  Load Item
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {state.history.length > 0 && (
            <span>
              Oldest: {state.history[state.history.length - 1]?.createdAt.toLocaleDateString()}
            </span>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="btn btn-primary"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default HistoryPanel;