import React from 'react';
import { CompressionSettings as Settings, CompressionPreset } from '../types';
import { Sliders, Monitor, Image, FileText } from 'lucide-react';

interface CompressionSettingsProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  activeTab: 'video' | 'image' | 'pdf';
  onTabChange: (tab: 'video' | 'image' | 'pdf') => void;
}

const presets: CompressionPreset[] = [
  {
    name: 'High Quality',
    description: 'Minimal compression, best quality',
    settings: {
      video: { quality: 85, resolution: 'original', bitrate: 8000, fps: 30, codec: 'h264' },
      image: { quality: 90, format: 'original' },
      pdf: { imageQuality: 85, removeMetadata: false, optimizeImages: true }
    }
  },
  {
    name: 'Balanced',
    description: 'Good balance of size and quality',
    settings: {
      video: { quality: 70, resolution: '1920x1080', bitrate: 4000, fps: 30, codec: 'h264' },
      image: { quality: 75, format: 'original' },
      pdf: { imageQuality: 70, removeMetadata: true, optimizeImages: true }
    }
  },
  {
    name: 'High Compression',
    description: 'Maximum compression, smaller files',
    settings: {
      video: { quality: 50, resolution: '1280x720', bitrate: 2000, fps: 24, codec: 'h264' },
      image: { quality: 60, format: 'jpeg' },
      pdf: { imageQuality: 50, removeMetadata: true, optimizeImages: true }
    }
  }
];

export const CompressionSettings: React.FC<CompressionSettingsProps> = ({
  settings,
  onSettingsChange,
  activeTab,
  onTabChange
}) => {
  const applyPreset = (preset: CompressionPreset) => {
    onSettingsChange(preset.settings);
  };

  const updateVideoSettings = (key: keyof Settings['video'], value: any) => {
    onSettingsChange({
      ...settings,
      video: { ...settings.video, [key]: value }
    });
  };

  const updateImageSettings = (key: keyof Settings['image'], value: any) => {
    onSettingsChange({
      ...settings,
      image: { ...settings.image, [key]: value }
    });
  };

  const updatePdfSettings = (key: keyof Settings['pdf'], value: any) => {
    onSettingsChange({
      ...settings,
      pdf: { ...settings.pdf, [key]: value }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Sliders className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Compression Settings
        </h2>
      </div>

      {/* Presets */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Quick Presets
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="font-medium text-sm text-gray-900 dark:text-white">
                {preset.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <button
          onClick={() => onTabChange('video')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'video'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>Video</span>
        </button>
        <button
          onClick={() => onTabChange('image')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'image'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>Image</span>
        </button>
        <button
          onClick={() => onTabChange('pdf')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'pdf'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>PDF</span>
        </button>
      </div>

      {/* Video Settings */}
      {activeTab === 'video' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quality: {settings.video.quality}%
            </label>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {settings.video.quality >= 80 ? 'High Quality (minimal compression)' :
               settings.video.quality >= 60 ? 'Balanced (good compression)' :
               settings.video.quality >= 40 ? 'High Compression (smaller files)' :
               'Maximum Compression (smallest files)'}
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={settings.video.quality}
              onChange={(e) => updateVideoSettings('quality', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resolution
            </label>
            <select
              value={settings.video.resolution}
              onChange={(e) => updateVideoSettings('resolution', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="original">Original</option>
              <option value="1920x1080">1080p (1920x1080)</option>
              <option value="1280x720">720p (1280x720)</option>
              <option value="854x480">480p (854x480)</option>
              <option value="640x360">360p (640x360) - High Compression</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bitrate: {settings.video.bitrate}k
            </label>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Lower bitrate = smaller file size
            </div>
            <input
              type="range"
              min="200"
              max="10000"
              step="100"
              value={settings.video.bitrate}
              onChange={(e) => updateVideoSettings('bitrate', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frame Rate: {settings.video.fps} fps
            </label>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Lower frame rate = better compression
            </div>
            <input
              type="range"
              min="15"
              max="60"
              value={settings.video.fps}
              onChange={(e) => updateVideoSettings('fps', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Codec
            </label>
            <select
              value={settings.video.codec}
              onChange={(e) => updateVideoSettings('codec', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="h264">H.264 (Most compatible)</option>
              <option value="h265">H.265 (Better compression)</option>
            </select>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Output format will match your input file format when possible.
            </p>
          </div>
          
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              Compression Tips:
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Lower quality settings provide much better compression</li>
              <li>• Reducing resolution significantly decreases file size</li>
              <li>• Lower frame rates help with compression</li>
              <li>• The app removes duplicate frames automatically</li>
            </ul>
          </div>
        </div>
      )}

      {/* Image Settings */}
      {activeTab === 'image' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quality: {settings.image.quality}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={settings.image.quality}
              onChange={(e) => updateImageSettings('quality', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Output Format
            </label>
            <select
              value={settings.image.format}
              onChange={(e) => updateImageSettings('format', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="original">Keep Original</option>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Width (px)
            </label>
            <input
              type="number"
              value={settings.image.maxWidth || ''}
              onChange={(e) => updateImageSettings('maxWidth', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Original"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Height (px)
            </label>
            <input
              type="number"
              value={settings.image.maxHeight || ''}
              onChange={(e) => updateImageSettings('maxHeight', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Original"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* PDF Settings */}
      {activeTab === 'pdf' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image Quality: {settings.pdf.imageQuality}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={settings.pdf.imageQuality}
              onChange={(e) => updatePdfSettings('imageQuality', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="removeMetadata"
              checked={settings.pdf.removeMetadata}
              onChange={(e) => updatePdfSettings('removeMetadata', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="removeMetadata" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Remove metadata
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="optimizeImages"
              checked={settings.pdf.optimizeImages}
              onChange={(e) => updatePdfSettings('optimizeImages', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="optimizeImages" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Optimize embedded images
            </label>
          </div>
        </div>
      )}
    </div>
  );
};