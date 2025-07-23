import { ProcessingCapabilities, CompressionMethod } from '../types/compression.types';

export class PerformanceMonitor {
  static checkSystemCapabilities(): ProcessingCapabilities {
    const supportsWebCodecs = 'VideoEncoder' in window && 'VideoDecoder' in window;
    const supportsOffscreenCanvas = 'OffscreenCanvas' in window;
    
    // Estimate available memory (rough approximation)
    const availableMemory = (navigator as any).deviceMemory ? 
      (navigator as any).deviceMemory * 1024 : 4096; // Default to 4GB if unknown
    
    const cpuCores = navigator.hardwareConcurrency || 4;
    
    // Determine recommended method based on capabilities
    let recommendedMethod: CompressionMethod['id'] = 'canvas';
    if (supportsWebCodecs && availableMemory >= 4096) {
      recommendedMethod = 'webcodecs';
    } else if (availableMemory >= 8192 && cpuCores >= 4) {
      recommendedMethod = 'ffmpeg';
    }
    
    return {
      supportsWebCodecs,
      supportsOffscreenCanvas,
      availableMemory,
      cpuCores,
      recommendedMethod
    };
  }

  static getCompressionMethods(fileSize: number, duration: number): CompressionMethod[] {
    const capabilities = this.checkSystemCapabilities();
    
    const methods: CompressionMethod[] = [
      {
        id: 'canvas',
        name: 'Quick Compress',
        description: 'Fast canvas-based optimization with frame deduplication',
        estimatedTime: Math.max(5, Math.round(duration * 0.1)), // ~10% of video duration
        quality: 'fast',
        supported: true
      },
      {
        id: 'webcodecs',
        name: 'Smart Compress',
        description: 'Hardware-accelerated compression using WebCodecs API',
        estimatedTime: Math.max(10, Math.round(duration * 0.2)),
        quality: 'balanced',
        supported: capabilities.supportsWebCodecs
      },
      {
        id: 'ffmpeg',
        name: 'Maximum Compress',
        description: 'Professional-grade compression with FFmpeg',
        estimatedTime: Math.max(30, Math.round(duration * 0.5)),
        quality: 'maximum',
        supported: capabilities.availableMemory >= 2048 && fileSize < 500 * 1024 * 1024 // 500MB limit
      }
    ];
    
    return methods.filter(method => method.supported);
  }

  static estimateProcessingTime(
    fileSize: number, 
    duration: number, 
    method: CompressionMethod['id']
  ): number {
    const fileSizeMB = fileSize / (1024 * 1024);
    
    switch (method) {
      case 'canvas':
        return Math.max(5, Math.round(duration * 0.1 + fileSizeMB * 0.1));
      case 'webcodecs':
        return Math.max(10, Math.round(duration * 0.2 + fileSizeMB * 0.05));
      case 'ffmpeg':
        return Math.max(30, Math.round(duration * 0.5 + fileSizeMB * 0.2));
      default:
        return 60;
    }
  }

  static monitorMemoryUsage(): { used: number; available: number; percentage: number } {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        available: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    
    return { used: 0, available: 0, percentage: 0 };
  }
}