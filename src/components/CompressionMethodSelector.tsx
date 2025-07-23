import React from 'react';
import { CompressionMethod } from '../types/compression.types';
import { Zap, Cpu, Settings, Clock, CheckCircle } from 'lucide-react';

interface CompressionMethodSelectorProps {
  methods: CompressionMethod[];
  selectedMethod: CompressionMethod['id'];
  onMethodChange: (method: CompressionMethod['id']) => void;
  fileSize: number;
  duration: number;
}

export const CompressionMethodSelector: React.FC<CompressionMethodSelectorProps> = ({
  methods,
  selectedMethod,
  onMethodChange,
  fileSize,
  duration
}) => {
  const getMethodIcon = (method: CompressionMethod) => {
    switch (method.id) {
      case 'canvas':
        return <Zap className="w-5 h-5" />;
      case 'webcodecs':
        return <Cpu className="w-5 h-5" />;
      case 'ffmpeg':
        return <Settings className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const getQualityColor = (quality: CompressionMethod['quality']) => {
    switch (quality) {
      case 'fast':
        return 'text-green-600 dark:text-green-400';
      case 'balanced':
        return 'text-blue-600 dark:text-blue-400';
      case 'maximum':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Compression Method
        </h3>
      </div>

      <div className="space-y-3">
        {methods.map((method) => (
          <div
            key={method.id}
            className={`
              relative p-4 border rounded-lg cursor-pointer transition-all duration-200
              ${selectedMethod === method.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }
              ${!method.supported ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => method.supported && onMethodChange(method.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`
                  p-2 rounded-lg
                  ${selectedMethod === method.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }
                `}>
                  {getMethodIcon(method)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {method.name}
                    </h4>
                    <span className={`
                      text-xs px-2 py-1 rounded-full font-medium
                      ${getQualityColor(method.quality)}
                      bg-current bg-opacity-10
                    `}>
                      {method.quality}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {method.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>~{formatTime(method.estimatedTime)}</span>
                    </div>
                    {!method.supported && (
                      <span className="text-red-500 dark:text-red-400">
                        Not supported
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedMethod === method.id && method.supported && (
                <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>

      {methods.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No compression methods available for this file</p>
        </div>
      )}
    </div>
  );
};