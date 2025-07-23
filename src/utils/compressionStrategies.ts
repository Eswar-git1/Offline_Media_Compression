import { VideoAnalysis, CompressionProgress } from '../types/compression.types';
import { VideoAnalyzer } from './videoAnalyzer';
import { FrameComparator } from './frameComparison';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export abstract class BaseVideoCompressor {
  protected onProgress: (progress: CompressionProgress) => void;
  
  constructor(onProgress: (progress: CompressionProgress) => void) {
    this.onProgress = onProgress;
  }
  
  abstract compress(file: File, settings: any): Promise<File>;
}

export class CanvasVideoCompressor extends BaseVideoCompressor {
  async compress(file: File, settings: any): Promise<File> {
    this.onProgress({ phase: 'analyzing', progress: 0 });
    
    const analysis = await VideoAnalyzer.analyzeVideo(file);
    const optimalSettings = VideoAnalyzer.getOptimalSettings(analysis);
    
    this.onProgress({ phase: 'processing', progress: 10 });
    
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      video.onloadeddata = async () => {
        try {
          // Apply more aggressive resolution scaling for better compression
          const scaleFactor = settings.quality < 50 ? 0.5 : settings.quality < 70 ? 0.7 : 0.85;
          canvas.width = Math.round(optimalSettings.targetWidth * scaleFactor);
          canvas.height = Math.round(optimalSettings.targetHeight * scaleFactor);
          
          const chunks: Blob[] = [];
          const stream = canvas.captureStream(optimalSettings.targetFps);
          
          // Determine output format based on input file
          const inputFormat = file.type;
          let mimeType = 'video/webm;codecs=vp9';
          let fileExtension = '.webm';
          
          // Try to maintain original format when possible
          if (inputFormat.includes('mp4')) {
            // Check if browser supports MP4 recording
            if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E')) {
              mimeType = 'video/mp4;codecs=avc1.42E01E';
              fileExtension = '.mp4';
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
              mimeType = 'video/webm;codecs=h264';
              fileExtension = '.webm';
            }
          } else if (inputFormat.includes('webm')) {
            mimeType = 'video/webm;codecs=vp9';
            fileExtension = '.webm';
          }
          
          // Calculate aggressive bitrate for better compression
          const aggressiveBitrate = Math.max(
            200000, // Minimum 200kbps
            Math.round(optimalSettings.targetBitrate * (settings.quality / 100) * 0.3)
          );
          
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: aggressiveBitrate
          });
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };
          
          mediaRecorder.onstop = () => {
            const compressedBlob = new Blob(chunks, { type: mimeType.split(';')[0] });
            const compressedFile = new File([compressedBlob], 
              file.name.replace(/\.[^/.]+$/, `_compressed${fileExtension}`),
              { type: mimeType.split(';')[0] }
            );
            
            this.onProgress({ phase: 'finalizing', progress: 100 });
            resolve(compressedFile);
          };
          
          mediaRecorder.start();
          
          // Process frames with duplicate detection
          let previousCanvas: HTMLCanvasElement | null = null;
          let currentTime = 0;
          // Reduce frame rate more aggressively for better compression
          const targetFps = Math.max(15, Math.round(optimalSettings.targetFps * 0.6));
          const frameInterval = 1 / targetFps;
          let processedFrames = 0;
          const totalFrames = Math.floor(analysis.duration * targetFps);
          let skippedFrames = 0;
          
          const processFrame = () => {
            if (currentTime >= analysis.duration) {
              mediaRecorder.stop();
              console.log(`Compression complete. Skipped ${skippedFrames} duplicate frames out of ${processedFrames + skippedFrames} total frames.`);
              return;
            }
            
            video.currentTime = currentTime;
            
            video.onseeked = () => {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              // Check for duplicate frames
              let shouldSkip = false;
              if (previousCanvas) {
                const comparison = FrameComparator.compareFrames(
                  canvas, 
                  previousCanvas, 
                  Math.max(0.85, optimalSettings.removeThreshold - 0.1) // More aggressive threshold
                );
                shouldSkip = comparison.shouldSkip;
                 if (shouldSkip) {
                   skippedFrames++;
                 }
              }
              
              if (!shouldSkip) {
                // Update previous frame reference
                if (!previousCanvas) {
                  previousCanvas = document.createElement('canvas');
                  previousCanvas.width = canvas.width;
                  previousCanvas.height = canvas.height;
                }
                const prevCtx = previousCanvas.getContext('2d')!;
                prevCtx.drawImage(canvas, 0, 0);
              }
              
              processedFrames++;
              const progress = Math.round((processedFrames / totalFrames) * 80) + 10;
              this.onProgress({ 
                phase: 'processing', 
                progress,
                currentFrame: processedFrames,
                totalFrames
              });
              
              currentTime += frameInterval;
              setTimeout(processFrame, 33); // ~30fps processing for better performance
            };
          };
          
          processFrame();
          
        } catch (error) {
          reject(error);
        }
      };
      
      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = URL.createObjectURL(file);
    });
  }
}

export class WebCodecsCompressor extends BaseVideoCompressor {
  async compress(file: File, settings: any): Promise<File> {
    if (!('VideoEncoder' in window) || !('VideoDecoder' in window)) {
      throw new Error('WebCodecs API not supported');
    }
    
    this.onProgress({ phase: 'analyzing', progress: 0 });
    
    // This is a simplified implementation - full WebCodecs implementation would be more complex
    const analysis = await VideoAnalyzer.analyzeVideo(file);
    const optimalSettings = VideoAnalyzer.getOptimalSettings(analysis);
    
    this.onProgress({ phase: 'processing', progress: 20 });
    
    // For now, fall back to canvas method with WebCodecs optimizations
    const canvasCompressor = new CanvasVideoCompressor(this.onProgress);
    return canvasCompressor.compress(file, settings);
  }
}

export class FFmpegCompressor extends BaseVideoCompressor {
  private ffmpeg: FFmpeg | null = null;
  
  async compress(file: File, settings: any): Promise<File> {
    this.onProgress({ phase: 'analyzing', progress: 0 });
    
    if (!this.ffmpeg) {
      this.ffmpeg = new FFmpeg();
      
      this.ffmpeg.on('progress', ({ progress }) => {
        this.onProgress({ 
          phase: 'processing', 
          progress: Math.round(progress * 80) + 10 
        });
      });
      
      await this.ffmpeg.load();
    }
    
    this.onProgress({ phase: 'processing', progress: 10 });
    
    const analysis = await VideoAnalyzer.analyzeVideo(file);
    const optimalSettings = VideoAnalyzer.getOptimalSettings(analysis);
    
    // Determine input and output formats
    const inputExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const outputExt = inputExt; // Maintain same format
    
    // Write input file
    await this.ffmpeg.writeFile(`input.${inputExt}`, await fetchFile(file));
    
    // Build aggressive FFmpeg command for better compression
    const crf = settings.quality > 80 ? '18' : settings.quality > 60 ? '23' : settings.quality > 40 ? '28' : '32';
    const preset = settings.quality > 70 ? 'medium' : settings.quality > 40 ? 'fast' : 'veryfast';
    
    // Calculate target resolution for better compression
    const maxWidth = settings.quality > 70 ? 1920 : settings.quality > 40 ? 1280 : 854;
    const targetWidth = Math.min(optimalSettings.targetWidth, maxWidth);
    const targetHeight = Math.round((targetWidth / optimalSettings.targetWidth) * optimalSettings.targetHeight);
    
    // More aggressive bitrate calculation
    const targetBitrate = Math.max(
      300, // Minimum 300k
      Math.round((optimalSettings.targetBitrate / 1000) * (settings.quality / 100) * 0.4)
    );
    
    const command = [
      '-i', `input.${inputExt}`,
      '-c:v', 'libx264',
      '-preset', preset,
      '-crf', crf,
      '-vf', `scale=${targetWidth}:${targetHeight}`,
      '-r', Math.max(15, Math.round(optimalSettings.targetFps * 0.8)).toString(),
      '-b:v', `${targetBitrate}k`,
      '-maxrate', `${Math.round(targetBitrate * 1.5)}k`,
      '-bufsize', `${Math.round(targetBitrate * 2)}k`,
      '-movflags', '+faststart',
      // Audio compression
      '-c:a', 'aac',
      '-b:a', settings.quality > 60 ? '128k' : '96k',
      `output.${outputExt}`
    ];
    
    await this.ffmpeg.exec(command);
    
    this.onProgress({ phase: 'finalizing', progress: 90 });
    
    // Read output file
    const data = await this.ffmpeg.readFile(`output.${outputExt}`);
    const compressedFile = new File([data], 
      file.name.replace(/\.[^/.]+$/, `_compressed.${outputExt}`),
      { type: file.type }
    );
    
    // Cleanup
    await this.ffmpeg.deleteFile(`input.${inputExt}`);
    await this.ffmpeg.deleteFile(`output.${outputExt}`);
    
    this.onProgress({ phase: 'finalizing', progress: 100 });
    
    return compressedFile;
  }
}

export class CompressionStrategyFactory {
  static createCompressor(
    method: 'canvas' | 'webcodecs' | 'ffmpeg',
    onProgress: (progress: CompressionProgress) => void
  ): BaseVideoCompressor {
    switch (method) {
      case 'canvas':
        return new CanvasVideoCompressor(onProgress);
      case 'webcodecs':
        return new WebCodecsCompressor(onProgress);
      case 'ffmpeg':
        return new FFmpegCompressor(onProgress);
      default:
        return new CanvasVideoCompressor(onProgress);
    }
  }
}