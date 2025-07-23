import React from 'react';
import { CompressionProgress } from '../types/compression.types';
import { Activity, Cpu, Zap, CheckCircle } from 'lucide-react';

interface ProgressMonitorProps {
  progress: CompressionProgress;
  fileName: string;
}

export const ProgressMonitor: React.FC<ProgressMonitorProps> = ({
  progress,
  fileName
}) => {
  const getPhaseIcon = () => {
    switch (progress.phase) {
      case 'analyzing':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'processing':
        return <Cpu className="w-4 h-4 text-orange-500 animate-spin" />;
      case 'encoding':
        return <Zap className="w-4 h-4 text-purple-500 animate-pulse" />;
      case 'finalizing':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPhaseDescription = () => {
    switch (progress.phase) {
      case 'analyzing':
        return 'Analyzing video structure...';
      case 'processing':
        return 'Processing frames and removing duplicates...';
      case 'encoding':
        return 'Encoding compressed video...';
      case 'finalizing':
        return 'Finalizing compressed file...';
      default:
        return 'Processing...';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getPhaseIcon()}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {fileName}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getPhaseDescription()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {Math.round(progress.progress)}%
            </div>
            {progress.estimatedTimeRemaining && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                ~{formatTime(progress.estimatedTimeRemaining)} left
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(progress.progress, 0)}%` }}
          />
        </div>

        {/* Detailed Progress Info */}
        {(progress.currentFrame || progress.processedBytes) && (
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            {progress.currentFrame && progress.totalFrames && (
              <div>
                <span className="font-medium">Frames:</span> {progress.currentFrame.toLocaleString()} / {progress.totalFrames.toLocaleString()}
              </div>
            )}
            {progress.processedBytes && progress.totalBytes && (
              <div>
                <span className="font-medium">Data:</span> {Math.round(progress.processedBytes / 1024 / 1024)}MB / {Math.round(progress.totalBytes / 1024 / 1024)}MB
              </div>
            )}
          </div>
        )}

        {/* Memory Usage Warning */}
        <div className="text-xs text-amber-600 dark:text-amber-400">
          <p>💡 Large videos may take several minutes to process. Keep this tab active for best performance.</p>
        </div>
      </div>
    </div>
  );
};