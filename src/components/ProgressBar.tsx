import React from 'react';
import { CheckCircle, XCircle, Loader, Clock } from 'lucide-react';

interface ProgressBarProps {
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  fileName: string;
  error?: string;
  estimatedTime?: number;
  elapsedTime?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  status, 
  fileName, 
  error, 
  estimatedTime,
  elapsedTime 
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'processing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {fileName}
          </span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {status === 'processing' ? `${Math.round(progress)}%` : status}
        </span>
        {status === 'processing' && estimatedTime && (
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>
              {elapsedTime ? `${Math.round(elapsedTime)}s / ` : ''}
              ~{Math.round(estimatedTime)}s
            </span>
          </div>
        )}
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${Math.max(progress, status === 'completed' ? 100 : 0)}%` }}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};