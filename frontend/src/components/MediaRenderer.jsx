import React, { useState } from 'react';
import { Download, FileText, Music, Video, Image as ImageIcon, File } from 'lucide-react';

export default function MediaRenderer({ media, onDoubleClick, onDownload, showDownload = true }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) return null;

  const currentMedia = media[currentIndex];

  const renderMedia = (item, index) => {
    switch (item.type) {
      case 'image':
        return (
          <img
            key={index}
            src={item.url}
            alt="post media"
            className="w-full h-auto object-contain"
            style={{ maxHeight: '600px' }}
            draggable={false}
            onDoubleClick={onDoubleClick}
          />
        );

      case 'video':
        return (
          <video
            key={index}
            controls
            className="w-full h-full object-contain"
            style={{ maxHeight: '600px' }}
            src={item.url}
          >
            Your browser doesn't support video.
          </video>
        );

      case 'audio':
        return (
          <div key={index} className="w-full p-8 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
              <Music size={40} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 truncate max-w-full px-4">
              {item.fileName || 'Audio file'}
            </p>
            <audio controls className="w-full max-w-md">
              <source src={item.url} type={item.mimeType || 'audio/mpeg'} />
              Your browser doesn't support audio.
            </audio>
          </div>
        );

      case 'pdf':
        return (
          <div key={index} className="w-full p-8 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-slate-800 dark:to-slate-900">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <FileText size={40} className="text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 truncate max-w-full px-4">
              {item.fileName || 'PDF Document'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {item.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(2)} MB` : 'PDF'}
            </p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              View PDF
            </a>
          </div>
        );

      case 'document':
        return (
          <div key={index} className="w-full p-8 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-900">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <File size={40} className="text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 truncate max-w-full px-4">
              {item.fileName || 'Document'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {item.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Document'}
            </p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Open Document
            </a>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative bg-slate-950 flex items-center justify-center">
      {renderMedia(currentMedia, currentIndex)}

      {/* Download button */}
      {showDownload && (
        <button
          onClick={() => onDownload(currentIndex)}
          className="absolute top-4 right-4 p-2.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm"
          title="Download"
        >
          <Download size={20} />
        </button>
      )}

      {/* Multiple media navigation */}
      {media.length > 1 && (
        <>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {media.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'bg-white w-6'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>

          {currentIndex > 0 && (
            <button
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm"
            >
              ←
            </button>
          )}

          {currentIndex < media.length - 1 && (
            <button
              onClick={() => setCurrentIndex(prev => prev + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm"
            >
              →
            </button>
          )}
        </>
      )}

      {/* Media type indicator */}
      <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs font-medium flex items-center gap-1.5">
        {currentMedia.type === 'image' && <ImageIcon size={14} />}
        {currentMedia.type === 'video' && <Video size={14} />}
        {currentMedia.type === 'audio' && <Music size={14} />}
        {currentMedia.type === 'pdf' && <FileText size={14} />}
        {currentMedia.type === 'document' && <File size={14} />}
        <span className="capitalize">{currentMedia.type}</span>
        {media.length > 1 && <span className="ml-1">({currentIndex + 1}/{media.length})</span>}
      </div>
    </div>
  );
}