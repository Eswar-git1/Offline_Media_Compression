import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { FileItem } from '../types';
import { getFileType, generateUniqueId, formatFileSize } from '../utils/fileUtils';

interface FileUploaderProps {
  files: FileItem[];
  onFilesAdd: (files: FileItem[]) => void;
  onFileRemove: (id: string) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ files, onFilesAdd, onFileRemove }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileItem[] = acceptedFiles.map(file => {
      const type = getFileType(file);
      if (type === 'unsupported') {
        return null;
      }
      
      return {
        id: generateUniqueId(),
        file,
        type: type as 'video' | 'image' | 'pdf',
        status: 'pending',
        progress: 0,
        originalSize: file.size,
      };
    }).filter(Boolean) as FileItem[];
    
    onFilesAdd(newFiles);
  }, [onFilesAdd]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.webm', '.mkv'],
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.tiff', '.bmp'],
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          or click to select files
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Supports videos (MP4, AVI, MOV, WebM), images (JPEG, PNG, WebP), and PDFs
        </p>
        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
          <p className="text-yellow-700 dark:text-yellow-300 font-medium">Note about video compression:</p>
          <p className="text-yellow-600 dark:text-yellow-400">
            Browser-based video compression is limited. For best results with videos, use desktop software like HandBrake or FFmpeg.
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Files ({files.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {fileItem.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(fileItem.originalSize)} • {fileItem.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onFileRemove(fileItem.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};