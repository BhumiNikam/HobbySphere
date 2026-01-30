import {
  FileText,
  Music,
  Video,
  Image as ImageIcon,
  Download,
} from 'lucide-react';

export default function MediaRenderer({ file, onDownload }) {
  const type = file.mimetype || '';

  // IMAGE
  if (type.startsWith('image')) {
    return (
      <img
        src={file.url}
        alt=""
        className="w-full h-full object-cover rounded-xl"
      />
    );
  }

  // VIDEO
  if (type.startsWith('video')) {
    return (
      <video
        src={file.url}
        controls
        className="w-full rounded-xl"
      />
    );
  }

  // AUDIO
  if (type.startsWith('audio')) {
    return (
      <audio
        src={file.url}
        controls
        className="w-full"
      />
    );
  }

  // PDF / OTHER
  return (
    <div className="flex items-center gap-3 p-4 border rounded-xl bg-slate-50">
      <FileText className="text-indigo-600" />
      <span className="flex-1 truncate text-sm">{file.originalName || 'Document'}</span>
      <button
        onClick={() => onDownload(file.url)}
        className="text-indigo-600 text-sm font-semibold"
      >
        Download
      </button>
    </div>
  );
}
