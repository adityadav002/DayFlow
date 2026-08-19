const express = require('express');
const boardController = require('../controllers/boardController');
const { protect } = require('../middlewares/authMiddleware');
const { requireBoardMember, requireBoardOwner } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { createBoardSchema, updateBoardSchema, addMemberSchema } = require('../validators/boardValidator');

const router = express.Router();

router.use(protect);

router.post('/', validate(createBoardSchema), boardController.createBoard);
router.get('/', boardController.getBoards);

router.get('/:boardId', requireBoardMember, boardController.getBoardById);
router.patch('/:boardId', requireBoardOwner, validate(updateBoardSchema), boardController.updateBoard);
router.delete('/:boardId', requireBoardOwner, boardController.deleteBoard);

router.post('/:boardId/members', requireBoardOwner, validate(addMemberSchema), boardController.addMember);
router.delete('/:boardId/members/:userId', requireBoardOwner, boardController.removeMember);

module.exports = router;
