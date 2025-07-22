import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Image, Brain, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const LoadingOverlay: React.FC = () => {
  const { state } = useAppContext();
  
  const isVisible = state.loadingStatus.state !== 'idle';

  const getStageInfo = () => {
    switch (state.loadingStatus.state) {
      case 'analyzing':
        return {
          icon: <Image className="w-8 h-8" />,
          title: 'Analyzing Image',
          subtitle: 'Extracting metadata from stock photo URL...',
          color: 'text-blue-500'
        };
      case 'generating':
        return {
          icon: <Brain className="w-8 h-8" />,
          title: 'Generating Prompt',
          subtitle: 'AI is analyzing the image and creating prompts...',
          color: 'text-purple-500'
        };
      case 'complete':
        return {
          icon: <CheckCircle className="w-8 h-8" />,
          title: 'Complete!',
          subtitle: 'AI prompt generated successfully',
          color: 'text-green-500'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-8 h-8" />,
          title: 'Error',
          subtitle: state.loadingStatus.message,
          color: 'text-red-500'
        };
      default:
        return {
          icon: <Loader2 className="w-8 h-8" />,
          title: 'Processing',
          subtitle: 'Please wait...',
          color: 'text-gray-500'
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-auto text-center"
          >
            {/* Icon */}
            <div className={`flex items-center justify-center mb-4 ${stageInfo.color}`}>
              {state.loadingStatus.state === 'analyzing' || state.loadingStatus.state === 'generating' ? (
                <div className="animate-spin">
                  {stageInfo.icon}
                </div>
              ) : (
                <div className={state.loadingStatus.state === 'complete' ? 'animate-bounce' : ''}>
                  {stageInfo.icon}
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className={`text-xl font-semibold mb-2 ${stageInfo.color}`}>
              {stageInfo.title}
            </h3>

            {/* Subtitle/Message */}
            <p className="text-gray-600 mb-6">
              {stageInfo.subtitle}
            </p>

            {/* Progress Steps */}
            {(state.loadingStatus.state === 'analyzing' || state.loadingStatus.state === 'generating') && (
              <div className="space-y-4">
                {/* Step Indicators */}
                <div className="flex items-center justify-center space-x-4">
                  <div className={`flex items-center space-x-2 ${
                    state.loadingStatus.state === 'analyzing' ? 'text-blue-500' : 'text-green-500'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${
                      state.loadingStatus.state === 'analyzing' ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
                    }`} />
                    <span className="text-sm font-medium">Analyze</span>
                  </div>
                  
                  <div className={`w-8 h-0.5 ${
                    state.loadingStatus.state === 'generating' ? 'bg-purple-500' : 'bg-gray-300'
                  } transition-colors`} />
                  
                  <div className={`flex items-center space-x-2 ${
                    state.loadingStatus.state === 'generating' ? 'text-purple-500' : 'text-gray-400'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${
                      state.loadingStatus.state === 'generating' ? 'bg-purple-500 animate-pulse' : 'bg-gray-300'
                    }`} />
                    <span className="text-sm font-medium">Generate</span>
                  </div>
                </div>

                {/* Animated Dots */}
                <div className="flex justify-center space-x-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className={`w-2 h-2 rounded-full ${stageInfo.color.replace('text-', 'bg-')}`}
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Processing Tips */}
            {(state.loadingStatus.state === 'analyzing' || state.loadingStatus.state === 'generating') && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-600">
                    {state.loadingStatus.state === 'analyzing' ? (
                      <div>
                        <p className="font-medium mb-1">What's happening:</p>
                        <ul className="text-xs space-y-1">
                          <li>• Downloading image from URL</li>
                          <li>• Extracting metadata and tags</li>
                          <li>• Processing image for AI analysis</li>
                        </ul>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium mb-1">AI is working:</p>
                        <ul className="text-xs space-y-1">
                          <li>• Analyzing visual elements</li>
                          <li>• Creating detailed descriptions</li>
                          <li>• Generating optimized prompts</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Auto-close for success/error states */}
            {(state.loadingStatus.state === 'complete' || state.loadingStatus.state === 'error') && (
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 3 }}
                className="mt-4 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay;