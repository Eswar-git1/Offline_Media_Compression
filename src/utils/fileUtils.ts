export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileType = (file: File): 'video' | 'image' | 'pdf' | 'unsupported' => {
  const videoTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'];
  const pdfTypes = ['application/pdf'];

  if (videoTypes.includes(file.type)) return 'video';
  if (imageTypes.includes(file.type)) return 'image';
  if (pdfTypes.includes(file.type)) return 'pdf';
  return 'unsupported';
};

export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const downloadFile = (file: File, filename: string) => {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const createZipDownload = async (files: { file: File; name: string }[]) => {
  // For simplicity, we'll download files individually
  // In a production app, you'd use a library like JSZip
  files.forEach(({ file, name }) => {
    downloadFile(file, name);
  });
};