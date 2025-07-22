import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, Share2, Star, Clock, Eye, Tag, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const ResultsDisplay: React.FC = () => {
  const { state } = useAppContext();
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);

  if (!state.results) return null;

  const { 
    originalUrl, 
    imageData, 
    generatedPrompt, 
    variations, 
    metadata 
  } = state.results;

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(type);
      toast.success(`${type} copied to clipboard!`);
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadPrompt = () => {
    const content = `# AI Generated Prompt

## Original Source
- URL: ${originalUrl}
- Platform: ${imageData.platform}
- Title: ${imageData.title}

## Generated Prompt
${generatedPrompt}

${variations && variations.length > 0 ? `## Variations\n${variations.map((v, i) => `### Variation ${i + 1}\n${v}`).join('\n\n')}` : ''}

## Metadata
- Provider: ${metadata.provider}
- Style: ${metadata.style}
- Target Platform: ${metadata.platform || 'Any'}
- Confidence: ${(metadata.confidence * 100).toFixed(1)}%
- Generated: ${metadata.generatedAt}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-prompt-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Prompt downloaded as markdown file!');
  };

  const sharePrompt = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Prompt',
          text: generatedPrompt,
          url: originalUrl
        });
        toast.success('Prompt shared successfully!');
      } catch (error) {
        // User cancelled sharing or sharing failed
        copyToClipboard(generatedPrompt, 'Main Prompt');
      }
    } else {
      copyToClipboard(generatedPrompt, 'Main Prompt');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-6"
    >
      {/* Header with Action Buttons */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Generated AI Prompt</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <div className={`provider-badge ${metadata.provider}`}>
                {metadata.provider.toUpperCase()}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {metadata.processingTime}ms
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                {(metadata.confidence * 100).toFixed(1)}%
              </div>
              {metadata.platform && (
                <div className="flex items-center gap-1">
                  <RefreshCw className="w-4 h-4" />
                  {metadata.platform}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(generatedPrompt, 'Main Prompt')}
              className="btn btn-outline flex items-center gap-2 px-4 py-2"
            >
              {copiedPrompt === 'Main Prompt' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              Copy
            </button>
            
            <button
              onClick={downloadPrompt}
              className="btn btn-outline flex items-center gap-2 px-4 py-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            
            <button
              onClick={sharePrompt}
              className="btn btn-primary flex items-center gap-2 px-4 py-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {/* Main Prompt */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Main Prompt</h3>
          <div className="bg-white rounded-lg p-4 border border-gray-200 font-mono text-sm leading-relaxed">
            {generatedPrompt}
          </div>
        </div>

        {/* Variations */}
        {variations && variations.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Variations</h3>
            <div className="space-y-4">
              {variations.map((variation, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-700">Variation {index + 1}</h4>
                    <button
                      onClick={() => copyToClipboard(variation, `Variation ${index + 1}`)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      {copiedPrompt === `Variation ${index + 1}` ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200 font-mono text-sm">
                    {variation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image and Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Preview */}
        {imageData.imageBase64 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Original Image
            </h3>
            <div className="image-preview aspect-square max-w-md mx-auto">
              <img
                src={`data:image/jpeg;base64,${imageData.imageBase64}`}
                alt={imageData.title}
                className="w-full h-full object-cover rounded-lg cursor-pointer"
                onClick={() => setShowFullImage(true)}
              />
            </div>
            <div className="mt-4 space-y-2">
              <a
                href={originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                View on {imageData.platform}
              </a>
              {imageData.stockId && (
                <p className="text-sm text-gray-600">Stock ID: {imageData.stockId}</p>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Image Metadata
          </h3>
          
          <div className="space-y-4">
            {imageData.title && (
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Title</h4>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {imageData.title}
                </p>
              </div>
            )}

            {imageData.description && (
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Description</h4>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {imageData.description}
                </p>
              </div>
            )}

            {imageData.category && (
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Category</h4>
                <p className="text-sm text-gray-600">{imageData.category}</p>
              </div>
            )}

            {imageData.tags && imageData.tags.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {imageData.tags.slice(0, 15).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {imageData.tags.length > 15 && (
                    <span className="text-xs text-gray-500 py-1">
                      +{imageData.tags.length - 15} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Platform:</span>
                <span className={`platform-badge ${imageData.platform}`}>
                  {imageData.platform}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Analyzed:</span>
                <span>{new Date(imageData.scrapedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {showFullImage && imageData.imageBase64 && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <div className="max-w-4xl max-h-[90vh] overflow-auto">
            <img
              src={`data:image/jpeg;base64,${imageData.imageBase64}`}
              alt={imageData.title}
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ResultsDisplay;