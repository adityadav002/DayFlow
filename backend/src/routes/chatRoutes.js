const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/peers', chatController.getPeers);
router.post('/conversations', chatController.createConversation);
router.post('/conversations/by-email', chatController.createConversationByEmail);
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:id/messages', chatController.getMessages);
router.post('/conversations/:id/messages', chatController.sendMessage);
router.post('/conversations/:id/members', chatController.addGroupMembers);
router.delete('/conversations/:id/members/:userId', chatController.removeGroupMember);
router.delete('/conversations/:id/leave', chatController.leaveGroup);
router.delete('/conversations/:id', chatController.deleteConversation);

module.exports = router;
