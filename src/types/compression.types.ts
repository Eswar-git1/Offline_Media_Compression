export interface VideoAnalysis {
  width: number;
  height: number;
  duration: number;
  fps: number;
  bitrate: number;
  codec: string;
  size: number;
}

export interface CompressionMethod {
  id: 'canvas' | 'webcodecs' | 'ffmpeg';
  name: string;
  description: string;
  estimatedTime: number;
  quality: 'fast' | 'balanced' | 'maximum';
  supported: boolean;
}

export interface ProcessingCapabilities {
  supportsWebCodecs: boolean;
  supportsOffscreenCanvas: boolean;
  availableMemory: number;
  cpuCores: number;
  recommendedMethod: CompressionMethod['id'];
}

export interface FrameComparisonResult {
  similarity: number;
  isDuplicate: boolean;
  shouldSkip: boolean;
}

export interface CompressionProgress {
  phase: 'analyzing' | 'processing' | 'encoding' | 'finalizing';
  progress: number;
  currentFrame?: number;
  totalFrames?: number;
  processedBytes?: number;
  totalBytes?: number;
  estimatedTimeRemaining?: number;
}