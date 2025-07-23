import React, { useState, useCallback } from 'react';
import { FileItem, CompressionSettings } from '../types';
import { CompressionMethod, CompressionProgress } from '../types/compression.types';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import { CompressionStrategyFactory } from '../utils/compressionStrategies';
import { VideoAnalyzer } from '../utils/videoAnalyzer';
import { CompressionMethodSelector } from './CompressionMethodSelector';
import { ProgressMonitor } from './ProgressMonitor';

interface VideoProcessorProps {
  file: FileItem;
  settings: CompressionSettings['video'];
  onProgress: (id: string, updates: Partial<FileItem>) => void;
}

export const VideoProcessor: React.FC<VideoProcessorProps> = ({
  file,
  settings,
  onProgress
}) => {
  const [availableMethods, setAvailableMethods] = useState<CompressionMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<CompressionMethod['id']>('canvas');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<CompressionProgress | null>(null);

  React.useEffect(() => {
    const analyzeAndSetMethods = async () => {
      setIsAnalyzing(true);
      try {
        const analysis = await VideoAnalyzer.analyzeVideo(file.file);
        const methods = PerformanceMonitor.getCompressionMethods(
          file.file.size,
          analysis.duration
        );
        
        setAvailableMethods(methods);
        
        // Set recommended method
        const capabilities = PerformanceMonitor.checkSystemCapabilities();
        const recommendedMethod = methods.find(m => m.id === capabilities.recommendedMethod);
        if (recommendedMethod) {
          setSelectedMethod(recommendedMethod.id);
        }
      } catch (error) {
        console.error('Failed to analyze video:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeAndSetMethods();
  }, [file.file]);

  const handleCompress = useCallback(async () => {
    if (!selectedMethod) return;

    onProgress(file.id, { status: 'processing', progress: 0 });
    
    const startTime = Date.now();
    
    try {
      const compressor = CompressionStrategyFactory.createCompressor(
        selectedMethod,
        (progress: CompressionProgress) => {
          setCompressionProgress(progress);
          onProgress(file.id, { 
            progress: progress.progress,
            elapsedTime: (Date.now() - startTime) / 1000
          });
        }
      );

      const compressedFile = await compressor.compress(file.file, settings);
      const processingTime = (Date.now() - startTime) / 1000;
      const compressionRatio = ((file.originalSize - compressedFile.size) / file.originalSize) * 100;

      onProgress(file.id, {
        status: 'completed',
        progress: 100,
        compressedFile,
        compressedSize: compressedFile.size,
        compressionRatio,
        processingTime
      });

      setCompressionProgress(null);
    } catch (error) {
      onProgress(file.id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Compression failed'
      });
      setCompressionProgress(null);
    }
  }, [selectedMethod, file, settings, onProgress]);

  if (isAnalyzing) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Analyzing video...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CompressionMethodSelector
        methods={availableMethods}
        selectedMethod={selectedMethod}
        onMethodChange={setSelectedMethod}
        fileSize={file.file.size}
        duration={0} // Would need to get from analysis
      />

      {compressionProgress && (
        <ProgressMonitor
          progress={compressionProgress}
          fileName={file.file.name}
        />
      )}

      {file.status === 'pending' && (
        <button
          onClick={handleCompress}
          disabled={!selectedMethod || availableMethods.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Start Video Compression
        </button>
      )}
    </div>
  );
};