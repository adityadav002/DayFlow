const express = require('express');
const attachmentController = require('../controllers/attachmentController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get('/', attachmentController.getAttachments);
router.post('/', upload.single('file'), attachmentController.uploadAttachment);
router.post('/link', attachmentController.addLinkAttachment);
router.delete('/:aid', attachmentController.deleteAttachment);

module.exports = router;
