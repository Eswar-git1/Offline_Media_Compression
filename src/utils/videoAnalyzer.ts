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
    
    // More aggressive scaling for better compression
    if (width > 1920) {
      targetWidth = 1920;
      targetHeight = Math.round((height * 1920) / width);
    } else if (width > 1280) {
      targetWidth = 1280;
      targetHeight = Math.round((height * 1280) / width);
    } else if (width > 854 && duration > 300) { // Videos longer than 5 min get more compression
      targetWidth = 854;
      targetHeight = Math.round((height * 854) / width);
    }
    
    // More aggressive bitrate calculation for better compression
    const targetBitrate = Math.min(
      bitrate * 0.4, // 40% of original for better compression
      targetWidth > 1280 ? 2500000 : targetWidth > 854 ? 1500000 : 800000
    );
    
    return {
      targetWidth,
      targetHeight,
      targetBitrate,
      targetFps: Math.min(24, analysis.fps), // Lower FPS for better compression
      quality: 0.8,
      removeThreshold: 0.90 // 90% similarity threshold for more aggressive duplicate removal
    };
  }
}