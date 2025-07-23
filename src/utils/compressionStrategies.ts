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
          canvas.width = optimalSettings.targetWidth;
          canvas.height = optimalSettings.targetHeight;
          
          const chunks: Blob[] = [];
          const stream = canvas.captureStream(optimalSettings.targetFps);
          
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: optimalSettings.targetBitrate
          });
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };
          
          mediaRecorder.onstop = () => {
            const compressedBlob = new Blob(chunks, { type: 'video/webm' });
            const compressedFile = new File([compressedBlob], 
              file.name.replace(/\.[^/.]+$/, '_compressed.webm'),
              { type: 'video/webm' }
            );
            
            this.onProgress({ phase: 'finalizing', progress: 100 });
            resolve(compressedFile);
          };
          
          mediaRecorder.start();
          
          // Process frames with duplicate detection
          let previousCanvas: HTMLCanvasElement | null = null;
          let currentTime = 0;
          const frameInterval = 1 / optimalSettings.targetFps;
          let processedFrames = 0;
          const totalFrames = Math.floor(analysis.duration * optimalSettings.targetFps);
          
          const processFrame = () => {
            if (currentTime >= analysis.duration) {
              mediaRecorder.stop();
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
                  optimalSettings.removeThreshold
                );
                shouldSkip = comparison.shouldSkip;
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
              setTimeout(processFrame, 16); // ~60fps processing
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
    
    // Write input file
    await this.ffmpeg.writeFile('input.mp4', await fetchFile(file));
    
    // Build FFmpeg command
    const command = [
      '-i', 'input.mp4',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-vf', `scale=${optimalSettings.targetWidth}:${optimalSettings.targetHeight}`,
      '-r', optimalSettings.targetFps.toString(),
      '-b:v', `${Math.round(optimalSettings.targetBitrate / 1000)}k`,
      '-movflags', '+faststart',
      'output.mp4'
    ];
    
    await this.ffmpeg.exec(command);
    
    this.onProgress({ phase: 'finalizing', progress: 90 });
    
    // Read output file
    const data = await this.ffmpeg.readFile('output.mp4');
    const compressedFile = new File([data], 
      file.name.replace(/\.[^/.]+$/, '_compressed.mp4'),
      { type: 'video/mp4' }
    );
    
    // Cleanup
    await this.ffmpeg.deleteFile('input.mp4');
    await this.ffmpeg.deleteFile('output.mp4');
    
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