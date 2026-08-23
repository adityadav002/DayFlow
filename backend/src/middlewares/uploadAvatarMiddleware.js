const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save to uploads/users/{userId}
    const userId = req.user._id;
    const dir = path.join(__dirname, '..', '..', 'uploads', 'users', userId.toString());
    
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // The file will be processed by sharp later, but we save the original temporarily
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `temp_${Date.now()}_${sanitized}`);
  }
});

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
