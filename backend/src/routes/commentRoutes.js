const express = require('express');
const commentController = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { createCommentSchema } = require('../validators/commentValidator');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get('/', commentController.getComments);
router.post('/', validate(createCommentSchema), commentController.addComment);
router.put('/:cid', commentController.editComment);
router.delete('/:cid', commentController.deleteComment);

module.exports = router;
