import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { CompressionSettings } from './components/CompressionSettings';
import { VideoProcessor } from './components/VideoProcessor';
import { ProgressBar } from './components/ProgressBar';
import { ResultsDisplay } from './components/ResultsDisplay';
import { FileItem, CompressionSettings as Settings } from './types';
import { compressVideo } from './utils/videoCompression';
import { compressImage } from './utils/imageCompression';
import { compressPDF } from './utils/pdfCompression';
import { Play, Pause, RotateCcw } from 'lucide-react';

const defaultSettings: Settings = {
  video: {
    quality: 70,
    resolution: '1920x1080',
    bitrate: 4000,
    fps: 30,
    codec: 'h264'
  },
  image: {
    quality: 75,
    format: 'original'
  },
  pdf: {
    imageQuality: 70,
    removeMetadata: true,
    optimizeImages: true
  }
};

function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<'video' | 'image' | 'pdf'>('image');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesAdd = useCallback((newFiles: FileItem[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleFileRemove = useCallback((id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  const updateFileProgress = useCallback((id: string, updates: Partial<FileItem>) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ));
  }, []);

  const compressFile = async (file: FileItem) => {
    const startTime = Date.now();
    
    try {
      updateFileProgress(file.id, { 
        status: 'processing', 
        progress: 0
      });

      let compressedFile: File;
      
      // Track elapsed time for long operations
      const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        updateFileProgress(file.id, { elapsedTime: elapsed });
      }, 1000);
      
      switch (file.type) {
        case 'video':
          compressedFile = await compressVideo(
            file.file,
            settings.video,
            (progress) => updateFileProgress(file.id, { progress })
          );
          break;
        case 'image':
          compressedFile = await compressImage(
            file.file,
            settings.image,
            (progress) => updateFileProgress(file.id, { progress })
          );
          break;
        case 'pdf':
          compressedFile = await compressPDF(
            file.file,
            settings.pdf,
            (progress) => updateFileProgress(file.id, { progress })
          );
          break;
        default:
          throw new Error('Unsupported file type');
      }

      clearInterval(progressInterval);

      const processingTime = (Date.now() - startTime) / 1000;
      const compressionRatio = ((file.originalSize - compressedFile.size) / file.originalSize) * 100;

      updateFileProgress(file.id, {
        status: 'completed',
        progress: 100,
        compressedFile,
        compressedSize: compressedFile.size,
        compressionRatio,
        processingTime
      });
    } catch (error) {
      clearInterval(progressInterval);
      updateFileProgress(file.id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Compression failed'
      });
    }
  };

  const startCompression = async () => {
    setIsProcessing(true);
    const pendingFiles = files.filter(file => file.status === 'pending' && file.type !== 'video');
    
    for (const file of pendingFiles) {
      await compressFile(file);
    }
    
    setIsProcessing(false);
  };

  const resetAll = () => {
    setFiles([]);
    setIsProcessing(false);
  };

  const pendingFiles = files.filter(file => file.status === 'pending');
  const processingFiles = files.filter(file => file.status === 'processing');
  const hasActiveFiles = pendingFiles.length > 0 || processingFiles.length > 0;
  const hasVideoFiles = files.some(file => file.type === 'video');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - File Upload and Settings */}
          <div className="lg:col-span-2 space-y-8">
            <FileUploader
              files={files}
              onFilesAdd={handleFilesAdd}
              onFileRemove={handleFileRemove}
            />
            
            <CompressionSettings
              settings={settings}
              onSettingsChange={setSettings}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Video Processing Section */}
            {hasVideoFiles && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Video Processing
                </h2>
                {files.filter(f => f.type === 'video').map(file => (
                  <VideoProcessor
                    key={file.id}
                    file={file}
                    settings={settings.video}
                    onProgress={updateFileProgress}
                  />
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {files.filter(f => f.type !== 'video').length > 0 && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={startCompression}
                  disabled={isProcessing || pendingFiles.filter(f => f.type !== 'video').length === 0}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    isProcessing || pendingFiles.filter(f => f.type !== 'video').length === 0
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Pause className="w-5 h-5" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Compress Images & PDFs ({pendingFiles.filter(f => f.type !== 'video').length})</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={resetAll}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Reset All</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Progress and Results */}
          <div className="space-y-8">
            {/* Progress Tracking */}
            {hasActiveFiles && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Progress
                </h2>
                <div className="space-y-4">
                  {[...processingFiles, ...pendingFiles].map((file) => (
                    <ProgressBar
                      key={file.id}
                      progress={file.progress}
                      status={file.status}
                      fileName={file.file.name}
                      error={file.error}
                      estimatedTime={file.estimatedTime}
                      elapsedTime={file.elapsedTime}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            <ResultsDisplay files={files} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;