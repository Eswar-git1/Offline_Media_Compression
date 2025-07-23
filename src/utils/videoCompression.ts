import { CompressionStrategyFactory } from './compressionStrategies';
import { PerformanceMonitor } from './performanceMonitor';
import { VideoAnalyzer } from './videoAnalyzer';

export const compressVideo = async (
  file: File,
  settings: {
    quality: number;
    resolution: string;
    bitrate: number;
    fps: number;
    codec: 'h264' | 'h265';
  },
  onProgress: (progress: number) => void
): Promise<File> => {
  try {
    console.log('Starting advanced video compression for:', file.name);
    
    // Analyze video to determine best compression method
    const analysis = await VideoAnalyzer.analyzeVideo(file);
    const methods = PerformanceMonitor.getCompressionMethods(file.size, analysis.duration);
    
    // Select best available method
    const capabilities = PerformanceMonitor.checkSystemCapabilities();
    const selectedMethod = methods.find(m => m.id === capabilities.recommendedMethod) || methods[0];
    
    if (!selectedMethod) {
      throw new Error('No suitable compression method available');
    }
    
    console.log(`Using compression method: ${selectedMethod.name}`);
    
    // Create compressor with progress tracking
    const compressor = CompressionStrategyFactory.createCompressor(
      selectedMethod.id,
      (progress) => {
        onProgress(progress.progress);
      }
    );
    
    // Compress the video
    const compressedFile = await compressor.compress(file, settings);
    
    console.log('Video compression completed:', {
      originalSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio: ((file.size - compressedFile.size) / file.size * 100).toFixed(1) + '%'
    });
    
    return compressedFile;
    
  } catch (error) {
    console.error('Video compression error:', error);
    throw new Error(`Video compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Utility functions
export const estimateProcessingTime = (fileSizeBytes: number, settings: any): number => {
  return PerformanceMonitor.estimateProcessingTime(fileSizeBytes, 0, 'canvas');
};

export const initializeFFmpeg = async () => {
  console.log('FFmpeg initialization handled by compression strategies');
  return Promise.resolve();
};