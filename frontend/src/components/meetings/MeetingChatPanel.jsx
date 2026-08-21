import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Send, X, MessageSquare } from 'lucide-react';
import api from '../../api/axiosInstance';

const MeetingChatPanel = ({ meetingId, onClose }) => {
  const { user } = useSelector(state => state.auth);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // 1. Get or create a group conversation for this meeting
    const initChat = async () => {
      try {
        const { data } = await api.post('/chat/conversations', {
          isGroup: true,
          name: `Meeting Chat: ${meetingId}`,
          participants: [user._id] // backend will add others or we just use meetingId
        });
        setConversationId(data._id);
        fetchMessages(data._id);
      } catch (err) {
        console.error('Failed to init meeting chat', err);
      }
    };
    initChat();
  }, [meetingId, user._id]);

  const fetchMessages = async (convId) => {
    try {
      const { data } = await api.get(`/chat/conversations/${convId}/messages`);
      setMessages(data);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Listen for new messages
    const handleNewMessage = (e) => {
      // In a real app we'd filter by conversationId. This is a stub listener
      // We would use useSocket inside here or pass down messages from parent
    };
    window.addEventListener('chat:message', handleNewMessage);
    return () => window.removeEventListener('chat:message', handleNewMessage);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    try {
      const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, {
        content: newMessage
      });
      setMessages(prev => [...prev, data]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message');
    }
  };

  return (
    <div className="w-80 h-full bg-white border-l border-surface-200 flex flex-col z-30 animate-in slide-in-from-right duration-200">
      <div className="h-14 flex items-center justify-between px-4 border-b border-surface-200 bg-surface-50">
        <div className="flex items-center text-surface-900 font-medium">
          <MessageSquare className="h-4 w-4 mr-2" />
          In-Call Messages
        </div>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-surface-200 text-surface-500">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-surface-50 space-y-4 custom-scrollbar">
        {messages.map((msg) => {
          const isMine = msg.sender._id === user._id || msg.sender === user._id;
          return (
            <div key={msg._id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              {!isMine && <span className="text-[10px] text-surface-500 ml-1 mb-1">{msg.sender.name}</span>}
              <div className={`max-w-[85%] rounded-lg px-3 py-2 ${isMine ? 'bg-primary-600 text-white' : 'bg-white border border-surface-200 text-surface-900 shadow-sm'}`}>
                <p className="text-sm break-words">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-surface-200">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type message..."
            className="flex-1 rounded-full border border-surface-300 bg-surface-50 px-3 py-1.5 text-sm focus:border-primary-500 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            <Send className="h-3.5 w-3.5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default MeetingChatPanel;
