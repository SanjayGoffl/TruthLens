const multer = require('multer');
const AppError = require('../utils/AppError');
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new AppError('Profile picture must be a JPEG, PNG, WebP or GIF image under 2 MB.', 400, 'BAD_FILE_TYPE'));
    }
    return cb(null, true);
  }
});
module.exports = upload;
