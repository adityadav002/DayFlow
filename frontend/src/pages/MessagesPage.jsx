import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, Phone, Video, MoreVertical, Send, MessageSquare, Trash2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { joinMeeting } from '../redux/slices/meetingSlice';
import useSocket from '../hooks/useSocket';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';
import CreateGroupModal from '../components/chat/CreateGroupModal';
import GroupDetailsModal from '../components/chat/GroupDetailsModal';

const MessagesPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { onlineUsers } = useSelector(state => state.ui);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]); // to start new chats
  const [emailInput, setEmailInput] = useState('');
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { socket } = useSocket();

  useEffect(() => {
    fetchConversations();
    // For demo purposes, fetch some users to chat with if no conversations exist
    fetchUsers();
  }, []);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data);
      if (data.length > 0) setActiveConversation(data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/chat/peers');
      setUsers(data);
    } catch (err) {
      console.error('Failed to load peers', err);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const { data } = await api.get(`/chat/conversations/${convId}/messages`);
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);
    }
  }, [activeConversation]);

  useEffect(() => {
    const handleChatMessage = (e) => {
      const msg = e.detail;
      console.log('window received chat:message:', msg);
      // If it's for the currently active conversation, append to messages
      if (activeConversation && msg.conversation === activeConversation._id) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      
      // Update the conversations list with the latest message and reorder
      setConversations(prev => {
        const convIndex = prev.findIndex(c => c._id === msg.conversation);
        if (convIndex > -1) {
          const updatedConv = { ...prev[convIndex], lastMessage: msg, updatedAt: msg.createdAt };
          const newConvs = [...prev];
          newConvs.splice(convIndex, 1);
          return [updatedConv, ...newConvs]; // Move to top
        }
        return prev;
      });
    };
    
    window.addEventListener('chat:message', handleChatMessage);
    return () => {
      window.removeEventListener('chat:message', handleChatMessage);
    };
  }, [activeConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const { data } = await api.post(`/chat/conversations/${activeConversation._id}/messages`, {
        content: newMessage
      });
      setMessages(prev => {
        if (prev.find(m => m._id === data._id)) return prev;
        return [...prev, data];
      });
      
      setConversations(prev => {
        const convIndex = prev.findIndex(c => c._id === data.conversation);
        if (convIndex > -1) {
          const updatedConv = { ...prev[convIndex], lastMessage: data, updatedAt: data.createdAt };
          const newConvs = [...prev];
          newConvs.splice(convIndex, 1);
          return [updatedConv, ...newConvs];
        }
        return prev;
      });
      
      setNewMessage('');
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const handleStartChat = async (peer) => {
    try {
      const { data } = await api.post('/chat/conversations', {
        isGroup: false,
        participants: [peer._id]
      });
      // Check if conversation is already in the list
      if (!conversations.find(c => c._id === data._id)) {
        setConversations(prev => [data, ...prev]);
      }
      setActiveConversation(data);
    } catch (err) {
      console.error('Failed to start chat', err);
      toast.error('Failed to start chat');
    }
  };

  const handleStartChatByEmail = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsAddingEmail(true);
    try {
      const { data } = await api.post('/chat/conversations/by-email', { email: emailInput.trim() });
      if (!conversations.find(c => c._id === data._id)) {
        setConversations(prev => [data, ...prev]);
      }
      setActiveConversation(data);
      setEmailInput('');
      toast.success('Chat started!');
    } catch (err) {
      console.error('Failed to add by email', err);
      toast.error(err.response?.data?.error || 'Failed to start chat by email');
    } finally {
      setIsAddingEmail(false);
    }
  };

  const getOtherParticipant = (conv) => {
    if (!conv) return null;
    return conv.participants.find(p => p._id !== user._id);
  };

  const startCall = async (type) => {
    if (!activeConversation) return;
    
    let participantIds = [];
    let title = '';
    
    if (activeConversation.type === 'group') {
      participantIds = activeConversation.participants.filter(p => p._id !== user._id).map(p => p._id);
      title = `Group Call: ${activeConversation.name}`;
      if (participantIds.length === 0) return toast.error('No other participants to call');
    } else {
      const peer = getOtherParticipant(activeConversation);
      if (!peer) return;
      participantIds = [peer._id];
      title = `Call with ${peer.name}`;
    }

    try {
      const { data } = await api.post('/meetings/initiate', {
        title,
        participantIds,
        type
      });
      toast.success(activeConversation.type === 'group' ? `Starting group call...` : `Calling ${getOtherParticipant(activeConversation)?.name}...`);
      dispatch(joinMeeting({ meeting: data }));
    } catch (error) {
      console.error(error);
      toast.error('Failed to initiate call');
    }
  };

  const handleDeleteDirectChat = async () => {
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        await api.delete(`/chat/conversations/${activeConversation._id}`);
        toast.success('Chat deleted');
        setActiveConversation(null);
        setConversations(prev => prev.filter(c => c._id !== activeConversation._id));
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete chat');
      }
    }
  };

  useEffect(() => {
    const handleGroupUpdated = (updatedConv) => {
      setConversations(prev => {
        const idx = prev.findIndex(c => c._id === updatedConv._id);
        if (idx > -1) {
          const newConvs = [...prev];
          newConvs[idx] = updatedConv;
          return newConvs;
        }
        return prev;
      });
      if (activeConversation?._id === updatedConv._id) {
        setActiveConversation(updatedConv);
      }
    };
    
    const handleGroupRemoved = ({ conversationId }) => {
      setConversations(prev => prev.filter(c => c._id !== conversationId));
      if (activeConversation?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    };
    
    const handleGroupAdded = (newConv) => {
      setConversations(prev => [newConv, ...prev]);
    };

    if (socket) {
      socket.on('chat:group_updated', handleGroupUpdated);
      socket.on('chat:group_removed', handleGroupRemoved);
      socket.on('chat:group_added', handleGroupAdded);
    }
    
    return () => {
      if (socket) {
        socket.off('chat:group_updated', handleGroupUpdated);
        socket.off('chat:group_removed', handleGroupRemoved);
        socket.off('chat:group_added', handleGroupAdded);
      }
    };
  }, [activeConversation, socket]);

  return (
    <div className="flex h-full bg-white">
      {/* Conversations List Sidebar */}
      <div className="w-80 border-r border-surface-200 flex flex-col">
        <div className="p-4 border-b border-surface-200">
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full rounded-md border border-surface-300 pl-9 pr-4 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations
            .filter((conv) => {
              const isGroup = conv.type === 'group';
              const peer = isGroup ? null : getOtherParticipant(conv);
              const displayName = isGroup ? conv.name : peer?.name;
              return displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     (!isGroup && peer?.email?.toLowerCase().includes(searchQuery.toLowerCase()));
            })
            .map((conv) => {
            const isGroup = conv.type === 'group';
            const peer = isGroup ? null : getOtherParticipant(conv);
            const displayName = isGroup ? conv.name : peer?.name;
            const avatarChar = isGroup ? (conv.name?.charAt(0) || 'G') : (peer?.name?.charAt(0) || '?');
            const isOnline = !isGroup && onlineUsers?.includes(peer?._id);

            return (
              <div
                key={conv._id}
                onClick={() => setActiveConversation(conv)}
                className={`flex items-center p-4 cursor-pointer hover:bg-surface-50 transition-colors border-b border-surface-100 ${activeConversation?._id === conv._id ? 'bg-primary-50' : ''}`}
              >
                <div className="relative">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-medium ${isGroup ? 'bg-indigo-100 text-indigo-700' : 'bg-primary-100 text-primary-700'}`}>
                    {avatarChar}
                  </div>
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                  )}
                </div>
                <div className="ml-3 flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-surface-900 truncate">{displayName}</p>
                    <span className="text-xs text-surface-400">{conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <p className="text-xs text-surface-500 truncate">{conv.lastMessage?.content || 'No messages yet'}</p>
                </div>
              </div>
            );
          })}
          
          {/* Start New Chat Section */}
          <div className="mt-4 pb-4">
            <div className="px-4 flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Start New Chat</h3>
              <button 
                onClick={() => setIsCreateGroupOpen(true)}
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                + New Group
              </button>
            </div>
            
            <div className="px-4 mb-4">
              <form onSubmit={handleStartChatByEmail} className="flex space-x-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter user email..."
                  className="flex-1 rounded-md border border-surface-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isAddingEmail || !emailInput.trim()}
                  className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {isAddingEmail ? '...' : 'Add'}
                </button>
              </form>
            </div>

            {users.length > 0 && users.map(peer => (
                <div
                  key={peer._id}
                  onClick={() => handleStartChat(peer)}
                  className="flex items-center p-3 cursor-pointer hover:bg-surface-50 transition-colors"
                >
                  <div className="relative">
                    <div className="h-8 w-8 rounded-full bg-surface-200 flex items-center justify-center text-surface-600 font-medium text-xs">
                      {peer.name?.charAt(0)}
                    </div>
                    {onlineUsers?.includes(peer._id) && (
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-surface-800">{peer.name}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Active Conversation Area */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="h-16 border-b border-surface-200 flex items-center justify-between px-6 bg-white flex-shrink-0">
            <div className="flex items-center cursor-pointer" onClick={() => activeConversation.type === 'group' ? setIsGroupDetailsOpen(true) : null}>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-medium mr-3 ${activeConversation.type === 'group' ? 'bg-indigo-100 text-indigo-700' : 'bg-primary-100 text-primary-700'}`}>
                {activeConversation.type === 'group' ? (activeConversation.name?.charAt(0) || 'G') : (getOtherParticipant(activeConversation)?.name?.charAt(0))}
              </div>
              <div>
                <h3 className="font-medium text-surface-900">
                  {activeConversation.type === 'group' ? activeConversation.name : getOtherParticipant(activeConversation)?.name}
                </h3>
                {activeConversation.type === 'group' ? (
                  <p className="text-xs text-surface-500 font-medium hover:text-primary-600 transition-colors">
                    {activeConversation.participants?.length || 0} members
                  </p>
                ) : (
                  <p className="text-xs text-green-600 font-medium">
                    {onlineUsers?.includes(getOtherParticipant(activeConversation)?._id) ? 'Online' : 'Offline'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => startCall('audio')} className="p-2 rounded-full hover:bg-surface-100 text-surface-600 transition-colors" title="Audio Call">
                <Phone className="h-5 w-5" />
              </button>
              <button onClick={() => startCall('video')} className="p-2 rounded-full hover:bg-surface-100 text-surface-600 transition-colors" title="Video Call">
                <Video className="h-5 w-5" />
              </button>
              {activeConversation.type === 'group' ? (
                <button 
                  onClick={() => setIsGroupDetailsOpen(true)}
                  className="px-3 py-1.5 ml-2 text-sm font-medium rounded-md bg-surface-100 text-surface-700 hover:bg-surface-200 transition-colors"
                >
                  Members
                </button>
              ) : (
                <button onClick={handleDeleteDirectChat} className="p-2 ml-2 rounded-full hover:bg-red-50 text-surface-600 hover:text-red-500 transition-colors" title="Delete Chat">
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 bg-surface-50 space-y-4">
            {messages.map((msg, index) => {
              const isMine = msg.sender._id === user._id || msg.sender === user._id;
              const isGroup = activeConversation.type === 'group';
              
              // Only show name for incoming group messages.
              // To avoid clutter, optionally only show it if the previous message wasn't from the same person.
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const isSameSenderAsPrev = prevMsg && (prevMsg.sender._id === msg.sender._id);
              const showName = isGroup && !isMine && !isSameSenderAsPrev;
              const showAvatar = !isMine;

              return (
                <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
                  {showAvatar && (
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium mr-2 self-end mb-1 ${isSameSenderAsPrev ? 'invisible' : 'bg-indigo-100 text-indigo-700'}`}>
                      {msg.sender?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${isMine ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white border border-surface-200 text-surface-900 rounded-bl-sm'}`}>
                    {showName && (
                      <span className="text-xs font-bold text-indigo-600 mb-0.5 block">
                        {msg.sender?.name || 'Unknown'}
                      </span>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <span className={`text-[10px] mt-1 block text-right ${isMine ? 'text-primary-100' : 'text-surface-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-surface-200">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-full border border-surface-300 bg-surface-50 px-4 py-2 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4 ml-1" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-surface-50">
          <div className="text-center">
            <div className="h-16 w-16 bg-surface-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-surface-400" />
            </div>
            <h3 className="text-lg font-medium text-surface-900">Your Messages</h3>
            <p className="text-sm text-surface-500 mt-1">Select a conversation or start a new one</p>
          </div>
        </div>
      )}

      <CreateGroupModal 
        isOpen={isCreateGroupOpen} 
        onClose={() => setIsCreateGroupOpen(false)} 
        onGroupCreated={(group) => {
          setConversations(prev => [group, ...prev]);
          setActiveConversation(group);
        }}
      />

      {activeConversation?.type === 'group' && (
        <GroupDetailsModal
          isOpen={isGroupDetailsOpen}
          onClose={() => setIsGroupDetailsOpen(false)}
          conversation={activeConversation}
          onGroupUpdated={(updatedConv) => {
            if (!updatedConv) {
              setActiveConversation(null);
              setMessages([]);
            } else {
              setActiveConversation(updatedConv);
            }
          }}
        />
      )}
    </div>
  );
};

export default MessagesPage;
