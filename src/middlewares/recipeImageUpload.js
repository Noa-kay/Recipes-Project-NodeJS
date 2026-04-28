const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'recipes');

fs.mkdirSync(uploadDir, { recursive: true });

const mimeToExt = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/pjpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    let ext = path.extname(file.originalname || '').toLowerCase();
    if (ext === '.jpeg') ext = '.jpg';
    if (!['.jpg', '.png', '.gif', '.webp'].includes(ext)) {
      ext = mimeToExt[file.mimetype] || '.jpg';
    }
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

const allowedMime = /^image\/(jpeg|pjpeg|png|gif|webp)$/i;

const fileFilter = (_req, file, cb) => {
  if (allowedMime.test(file.mimetype)) return cb(null, true);
  return cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

/** Express middleware: single field `image`, passes Multer errors as { status: 400 }. */
function recipeImageUploadSingle(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next({ status: 400, message: 'Image too large (maximum 5MB)' });
    }
    return next({ status: 400, message: err.message || 'Upload failed' });
  });
}

module.exports = { recipeImageUploadSingle };
