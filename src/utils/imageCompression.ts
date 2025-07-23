import imageCompression from 'browser-image-compression';

export const compressImage = async (
  file: File,
  settings: {
    quality: number;
    format: 'jpeg' | 'png' | 'webp' | 'original';
    maxWidth?: number;
    maxHeight?: number;
  },
  onProgress: (progress: number) => void
): Promise<File> => {
  try {
    const options = {
      maxSizeMB: Infinity,
      maxWidthOrHeight: Math.max(settings.maxWidth || 1920, settings.maxHeight || 1080),
      useWebWorker: true,
      fileType: settings.format === 'original' ? undefined : `image/${settings.format}`,
      initialQuality: settings.quality / 100,
      onProgress: (progress: number) => {
        onProgress(progress);
      }
    };

    const compressedFile = await imageCompression(file, options);
    
    // If format conversion is needed and not 'original'
    if (settings.format !== 'original' && settings.format !== file.type.split('/')[1]) {
      return await convertImageFormat(compressedFile, settings.format, settings.quality);
    }
    
    return new File([compressedFile], 
      file.name.replace(/\.[^/.]+$/, `_compressed.${settings.format === 'original' ? file.name.split('.').pop() : settings.format}`),
      { type: compressedFile.type }
    );
  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error('Failed to compress image');
  }
};

const convertImageFormat = async (file: File, format: string, quality: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const convertedFile = new File([blob], 
                file.name.replace(/\.[^/.]+$/, `.${format}`),
                { type: `image/${format}` }
              );
              resolve(convertedFile);
            } else {
              reject(new Error('Failed to convert image format'));
            }
          },
          `image/${format}`,
          quality / 100
        );
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};