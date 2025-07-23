import { FrameComparisonResult } from '../types/compression.types';

export class FrameComparator {
  private static getImageData(canvas: HTMLCanvasElement): ImageData {
    const ctx = canvas.getContext('2d')!;
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  static compareFrames(
    canvas1: HTMLCanvasElement, 
    canvas2: HTMLCanvasElement,
    threshold: number = 0.90
  ): FrameComparisonResult {
    const data1 = this.getImageData(canvas1);
    const data2 = this.getImageData(canvas2);
    
    if (data1.data.length !== data2.data.length) {
      return { similarity: 0, isDuplicate: false, shouldSkip: false };
    }
    
    let matchingPixels = 0;
    const totalPixels = data1.data.length / 4; // RGBA = 4 values per pixel
    
    // More thorough comparison for better duplicate detection
    for (let i = 0; i < data1.data.length; i += 8) { // Skip 2 pixels at a time
      const r1 = data1.data[i];
      const g1 = data1.data[i + 1];
      const b1 = data1.data[i + 2];
      
      const r2 = data2.data[i];
      const g2 = data2.data[i + 1];
      const b2 = data2.data[i + 2];
      
      // Calculate color difference
      const diff = Math.sqrt(
        Math.pow(r1 - r2, 2) + 
        Math.pow(g1 - g2, 2) + 
        Math.pow(b1 - b2, 2)
      );
      
      if (diff < 40) { // More lenient threshold for "similar" pixels
        matchingPixels++;
      }
    }
    
    const similarity = matchingPixels / (totalPixels / 2);
    const isDuplicate = similarity >= threshold;
    
    return {
      similarity,
      isDuplicate,
      shouldSkip: isDuplicate
    };
  }

  static calculateSceneDifference(
    canvas1: HTMLCanvasElement,
    canvas2: HTMLCanvasElement
  ): number {
    const data1 = this.getImageData(canvas1);
    const data2 = this.getImageData(canvas2);
    
    let totalDifference = 0;
    const sampleSize = Math.min(data1.data.length, 10000); // Sample for performance
    
    for (let i = 0; i < sampleSize; i += 4) {
      const r1 = data1.data[i];
      const g1 = data1.data[i + 1];
      const b1 = data1.data[i + 2];
      
      const r2 = data2.data[i];
      const g2 = data2.data[i + 1];
      const b2 = data2.data[i + 2];
      
      totalDifference += Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
    }
    
    return totalDifference / sampleSize;
  }
}