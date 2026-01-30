const multer = require('multer');

/* ===============================
   MEMORY STORAGE (CLOUDINARY)
================================ */
const storage = multer.memoryStorage();

/* ===============================
   FILE FILTER
================================ */
const fileFilter = (req, file, cb) => {
  const allowedImage = file.mimetype.startsWith('image/');
  const allowedVideo = file.mimetype.startsWith('video/');

  if (allowedImage || allowedVideo) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        'Only images and videos are allowed'
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
    fileSize: 30 * 1024 * 1024, // ✅ 30MB (safe for reels / short videos)
    files: 4,                  // ✅ max 4 files (matches frontend)
  },
  fileFilter,
});

module.exports = upload;
