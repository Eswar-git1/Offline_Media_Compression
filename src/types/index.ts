export interface FileItem {
  id: string;
  file: File;
  type: 'video' | 'image' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  originalSize: number;
  compressedSize?: number;
  compressedFile?: File;
  error?: string;
  compressionRatio?: number;
  processingTime?: number;
  estimatedTime?: number;
  elapsedTime?: number;
}

export interface CompressionSettings {
  video: {
    quality: number;
    resolution: string;
    bitrate: number;
    fps: number;
    codec: 'h264' | 'h265';
  };
  image: {
    quality: number;
    format: 'jpeg' | 'png' | 'webp' | 'original';
    maxWidth?: number;
    maxHeight?: number;
  };
  pdf: {
    imageQuality: number;
    removeMetadata: boolean;
    optimizeImages: boolean;
  };
}

export interface CompressionPreset {
  name: string;
  description: string;
  settings: CompressionSettings;
}