const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { getIo } = require('../config/socket');

// @desc    Create a new conversation or get existing direct conversation
// @route   POST /api/chat/conversations
// @access  Private
exports.createConversation = async (req, res) => {
  const { participants, isGroup, name } = req.body;
  const userId = req.user._id;

  try {
    // Make sure current user is in participants
    const allParticipants = Array.from(new Set([...participants, userId.toString()]));

    if (!isGroup && allParticipants.length === 2) {
      // Check if a direct conversation already exists
      const existingConv = await Conversation.findOne({
        type: 'direct',
        participants: { $all: allParticipants, $size: 2 }
      });
      if (existingConv) {
        return res.status(200).json(existingConv);
      }
    }

    const conversation = await Conversation.create({
      participants: allParticipants,
      type: isGroup ? 'group' : 'direct',
      name: isGroup ? name : undefined,
      createdBy: isGroup ? userId : undefined
    });

    await conversation.populate('participants', 'name email avatar');

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Server error creating conversation' });
  }
};

// @desc    Create a new direct conversation by email
// @route   POST /api/chat/conversations/by-email
// @access  Private
exports.createConversationByEmail = async (req, res) => {
  const { email } = req.body;
  const userId = req.user._id;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const User = require('../models/User');
    const targetUser = await User.findOne({ email: email.toLowerCase() });
    
    if (!targetUser) {
      return res.status(404).json({ error: 'No user found with this email address' });
    }

    if (targetUser._id.toString() === userId.toString()) {
      return res.status(400).json({ error: 'You cannot start a conversation with yourself' });
    }

    const allParticipants = [userId.toString(), targetUser._id.toString()];

    // Check if a direct conversation already exists
    const existingConv = await Conversation.findOne({
      type: 'direct',
      participants: { $all: allParticipants, $size: 2 }
    });
    
    if (existingConv) {
      return res.status(200).json(existingConv);
    }

    const conversation = await Conversation.create({
      participants: allParticipants,
      type: 'direct'
    });

    await conversation.populate('participants', 'name email avatar');

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error finding or creating conversation by email:', error);
    res.status(500).json({ error: 'Server error creating conversation by email' });
  }
};

// @desc    Get user's conversations
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  const userId = req.user._id;

  try {
    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'name email avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Server error fetching conversations' });
  }
};

// @desc    Get messages in a conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
exports.getMessages = async (req, res) => {
  const conversationId = req.params.id;
  const { limit = 50, before } = req.query;

  try {
    const query = { conversation: conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
};

// @desc    Send a message
// @route   POST /api/chat/conversations/:id/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user._id;
  const { content, type, attachmentUrl } = req.body;

  try {
    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      content,
      type: type || 'text',
      attachmentUrl
    });

    // Update conversation lastMessage
    const conversation = await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id
    }, { new: true });

    // Populate sender info for socket emission
    await message.populate('sender', 'name email avatar');

    // Emit to all participants' individual rooms
    const io = getIo();
    if (conversation && conversation.participants) {
      conversation.participants.forEach(pId => {
        io.to(`user:${pId.toString()}`).emit('chat:message', message);
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Server error sending message' });
  }
};

// @desc    Get peers to chat with (users from shared projects)
// @route   GET /api/chat/peers
// @access  Private
exports.getPeers = async (req, res) => {
  try {
    const Project = require('../models/Project');
    const Workspace = require('../models/Workspace');
    const Board = require('../models/Board');
    const User = require('../models/User');
    
    const userId = req.user._id;
    const peopleIds = new Set();

    // 1. Get from Projects
    const projects = await Project.find({ 'members.user': userId });
    projects.forEach(p => p.members.forEach(m => {
      if (m.user && m.user.toString() !== userId.toString()) peopleIds.add(m.user.toString());
    }));

    // 2. Get from Workspaces
    const workspaces = await Workspace.find({ 'members.user': userId });
    workspaces.forEach(w => w.members.forEach(m => {
      if (m.user && m.user.toString() !== userId.toString()) peopleIds.add(m.user.toString());
    }));

    // 3. Get from Boards
    const boards = await Board.find({ 'members.user': userId });
    boards.forEach(b => b.members.forEach(m => {
      if (m.user && m.user.toString() !== userId.toString()) peopleIds.add(m.user.toString());
    }));

    // 4. Get from existing Conversations
    const conversations = await Conversation.find({ participants: userId });
    conversations.forEach(c => c.participants.forEach(pId => {
      if (pId && pId.toString() !== userId.toString()) peopleIds.add(pId.toString());
    }));

    const people = await User.find({ _id: { $in: Array.from(peopleIds) } })
      .select('name email avatar username');
      
    res.status(200).json(people);
  } catch (error) {
    console.error('Error fetching peers:', error);
    res.status(500).json({ error: 'Server error fetching peers' });
  }
};

// @desc    Add members to group conversation
// @route   POST /api/chat/conversations/:id/members
// @access  Private
exports.addGroupMembers = async (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user._id;
  const { newMembers } = req.body;

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    
    if (conversation.type !== 'group') {
      return res.status(400).json({ error: 'Cannot add members to a direct conversation' });
    }

    if (conversation.createdBy?.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the group admin can add members' });
    }

    const updatedParticipants = Array.from(new Set([
      ...conversation.participants.map(p => p.toString()), 
      ...newMembers
    ]));

    conversation.participants = updatedParticipants;
    await conversation.save();

    const populatedConv = await Conversation.findById(conversationId).populate('participants', 'name email avatar').populate('lastMessage');

    const io = getIo();
    io.to(`user:${userId.toString()}`).emit('chat:group_updated', populatedConv);
    newMembers.forEach(memberId => {
      io.to(`user:${memberId}`).emit('chat:group_added', populatedConv);
    });

    res.status(200).json(populatedConv);
  } catch (error) {
    console.error('Error adding members:', error);
    res.status(500).json({ error: 'Server error adding members' });
  }
};

// @desc    Remove member from group conversation
// @route   DELETE /api/chat/conversations/:id/members/:userId
// @access  Private
exports.removeGroupMember = async (req, res) => {
  const conversationId = req.params.id;
  const adminId = req.user._id;
  const memberToRemove = req.params.userId;

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    if (conversation.type !== 'group') {
      return res.status(400).json({ error: 'Cannot remove members from a direct conversation' });
    }

    if (conversation.createdBy?.toString() !== adminId.toString()) {
      return res.status(403).json({ error: 'Only the group admin can remove members' });
    }

    if (adminId.toString() === memberToRemove) {
      return res.status(400).json({ error: 'Admin cannot remove themselves using this route' });
    }

    conversation.participants = conversation.participants.filter(p => p.toString() !== memberToRemove);
    await conversation.save();

    const populatedConv = await Conversation.findById(conversationId).populate('participants', 'name email avatar').populate('lastMessage');

    const io = getIo();
    io.to(`user:${memberToRemove}`).emit('chat:group_removed', { conversationId });
    
    conversation.participants.forEach(pId => {
      io.to(`user:${pId.toString()}`).emit('chat:group_updated', populatedConv);
    });

    res.status(200).json(populatedConv);
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Server error removing member' });
  }
};

// @desc    Leave group conversation
// @route   DELETE /api/chat/conversations/:id/leave
// @access  Private
exports.leaveGroup = async (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user._id;

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    if (conversation.type !== 'group') {
      return res.status(400).json({ error: 'Cannot leave a direct conversation' });
    }

    conversation.participants = conversation.participants.filter(p => p.toString() !== userId.toString());
    
    // If admin leaves and there are other participants, make the first participant the new admin
    if (conversation.createdBy?.toString() === userId.toString() && conversation.participants.length > 0) {
      conversation.createdBy = conversation.participants[0];
    }
    
    await conversation.save();

    const io = getIo();
    io.to(`user:${userId.toString()}`).emit('chat:group_removed', { conversationId });
    
    if (conversation.participants.length > 0) {
      const populatedConv = await Conversation.findById(conversationId).populate('participants', 'name email avatar').populate('lastMessage');
      conversation.participants.forEach(pId => {
        io.to(`user:${pId.toString()}`).emit('chat:group_updated', populatedConv);
      });
    }

    res.status(200).json({ message: 'Left group successfully' });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ error: 'Server error leaving group' });
  }
};

// @desc    Delete a conversation (Group or Direct)
// @route   DELETE /api/chat/conversations/:id
// @access  Private
exports.deleteConversation = async (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user._id;

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    if (conversation.type === 'group' && conversation.createdBy?.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the group admin can delete the group' });
    }

    await Conversation.findByIdAndDelete(conversationId);
    await Message.deleteMany({ conversation: conversationId });

    const io = getIo();
    conversation.participants.forEach(pId => {
      io.to(`user:${pId.toString()}`).emit('chat:group_removed', { conversationId });
    });

    res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Server error deleting conversation' });
  }
};
