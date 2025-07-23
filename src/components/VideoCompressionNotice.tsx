import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export const VideoCompressionNotice: React.FC = () => {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
            Video Compression Limitations
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
            Browser-based video compression is extremely resource-intensive and slow. For professional video compression, we recommend using dedicated desktop applications.
          </p>
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-amber-800 dark:text-amber-200">
              Recommended Tools:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <a
                href="https://handbrake.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span>HandBrake (Free)</span>
              </a>
              <a
                href="https://ffmpeg.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span>FFmpeg (Free)</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};