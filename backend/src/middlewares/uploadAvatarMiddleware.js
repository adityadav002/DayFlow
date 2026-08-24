const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Only JPG, PNG, and WebP images are allowed'), false);
    }
    
    // Also check mime type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid image mime type'), false);
    }
    
    cb(null, true);
  }
});

module.exports = uploadAvatar;
