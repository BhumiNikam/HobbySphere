const multer = require('multer');

/* ===============================
   MEMORY STORAGE (CLOUDINARY)
================================ */
const storage = multer.memoryStorage();

/* ===============================
   FILE FILTER - ALL MEDIA TYPES
================================ */
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Videos
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp3',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        'Invalid file type. Allowed: images, videos, audio, PDFs, and documents'
      ),
      false
    );
  }
};

/* ===============================
   MULTER CONFIG
================================ */
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB for videos
    files: 10, // Max 10 files
  },
  fileFilter,
});

module.exports = upload;