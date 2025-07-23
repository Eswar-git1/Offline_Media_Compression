import React from 'react';
import { Download, Eye, TrendingDown } from 'lucide-react';
import { FileItem } from '../types';
import { formatFileSize, downloadFile } from '../utils/fileUtils';

interface ResultsDisplayProps {
  files: FileItem[];
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ files }) => {
  const completedFiles = files.filter(file => file.status === 'completed' && file.compressedFile);
  
  if (completedFiles.length === 0) {
    return null;
  }

  const totalOriginalSize = completedFiles.reduce((sum, file) => sum + file.originalSize, 0);
  const totalCompressedSize = completedFiles.reduce((sum, file) => sum + (file.compressedSize || 0), 0);
  const totalSavings = totalOriginalSize - totalCompressedSize;
  const totalSavingsPercent = ((totalSavings / totalOriginalSize) * 100);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <TrendingDown className="w-5 h-5 text-green-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Compression Results
        </h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatFileSize(totalSavings)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Saved</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {totalSavingsPercent.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Size Reduction</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {completedFiles.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Files Processed</p>
        </div>
      </div>

      {/* Individual Files */}
      <div className="space-y-3">
        {completedFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {file.file.name}
              </h3>
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{formatFileSize(file.originalSize)} → {formatFileSize(file.compressedSize || 0)}</span>
                <span className="text-green-600 dark:text-green-400">
                  -{((file.originalSize - (file.compressedSize || 0)) / file.originalSize * 100).toFixed(1)}%
                </span>
                {file.processingTime && (
                  <span>{file.processingTime.toFixed(1)}s</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => {
                  // In a real app, you'd implement a preview modal
                  console.log('Preview file:', file.file.name);
                }}
                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (file.compressedFile) {
                    downloadFile(file.compressedFile, file.compressedFile.name);
                  }
                }}
                className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Batch Download */}
      {completedFiles.length > 1 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={() => {
              completedFiles.forEach(file => {
                if (file.compressedFile) {
                  downloadFile(file.compressedFile, file.compressedFile.name);
                }
              });
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Download All Compressed Files
          </button>
        </div>
      )}
    </div>
  );
};