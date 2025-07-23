import { VideoAnalysis } from '../types/compression.types';

export class VideoAnalyzer {
  static async analyzeVideo(file: File): Promise<VideoAnalysis> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        const analysis: VideoAnalysis = {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
          fps: 30, // Default, would need more complex detection for actual FPS
          bitrate: Math.round((file.size * 8) / video.duration), // Rough estimate
          codec: 'unknown',
          size: file.size
        };
        
        URL.revokeObjectURL(url);
        resolve(analysis);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to analyze video'));
      };
      
      video.src = url;
    });
  }

  static getOptimalSettings(analysis: VideoAnalysis) {
    const { width, height, duration, bitrate } = analysis;
    
    // Smart resolution scaling
    let targetWidth = width;
    let targetHeight = height;
    
    if (width > 1920) {
      targetWidth = 1920;
      targetHeight = Math.round((height * 1920) / width);
    } else if (width > 1280 && duration > 600) { // Long videos get more compression
      targetWidth = 1280;
      targetHeight = Math.round((height * 1280) / width);
    }
    
    // Smart bitrate calculation
    const targetBitrate = Math.min(
      bitrate * 0.7, // 70% of original
      targetWidth > 1280 ? 4000000 : 2000000 // Max 4Mbps for HD, 2Mbps for lower
    );
    
    return {
      targetWidth,
      targetHeight,
      targetBitrate,
      targetFps: Math.min(30, analysis.fps),
      quality: 0.8,
      removeThreshold: 0.95 // 95% similarity threshold for duplicate frames
    };
  }
}