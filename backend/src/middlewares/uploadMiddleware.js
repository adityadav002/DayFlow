const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const entityType = req.baseUrl.includes('projects') ? 'projects' : 'tasks';
    const entityId = req.params.id;
    const dir = path.join(__dirname, '..', '..', 'uploads', entityType, entityId);
    
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}_${sanitized}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const rejectedExtensions = ['.exe', '.bat', '.sh', '.msi', '.dmg', '.app', '.js'];
    
    if (rejectedExtensions.includes(ext)) {
      return cb(new Error('Executable file types are not allowed'), false);
    }
    cb(null, true);
  }
});

module.exports = upload;
