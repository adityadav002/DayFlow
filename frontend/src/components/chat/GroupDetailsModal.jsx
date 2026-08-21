import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserMinus, LogOut, Check, Search } from 'lucide-react';
import Button from '../common/Button';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const GroupDetailsModal = ({ isOpen, onClose, conversation, onGroupUpdated }) => {
  const { user } = useSelector(state => state.auth);
  const { onlineUsers } = useSelector(state => state.ui);
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'add'
  const [searchQuery, setSearchQuery] = useState('');
  const [peers, setPeers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'add') {
      fetchPeers();
      setSearchQuery('');
      setSelectedUsers([]);
    }
  }, [isOpen, activeTab]);

  const fetchPeers = async () => {
    try {
      const { data } = await api.get('/chat/peers');
      // Filter out existing members
      const existingIds = conversation?.participants?.map(p => p._id) || [];
      setPeers(data.filter(p => !existingIds.includes(p._id)));
    } catch (err) {
      console.error('Failed to load peers', err);
    }
  };

  const isAdmin = conversation?.createdBy === user?._id;

  const handleToggleUser = (u) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(user => user._id === u._id);
      if (isSelected) {
        return prev.filter(user => user._id !== u._id);
      } else {
        return [...prev, u];
      }
    });
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;
    setIsLoading(true);
    try {
      const { data } = await api.post(`/chat/conversations/${conversation._id}/members`, {
        newMembers: selectedUsers.map(u => u._id)
      });
      toast.success('Members added successfully');
      onGroupUpdated(data);
      setActiveTab('members');
    } catch (error) {
      console.error(error);
      toast.error('Failed to add members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        const { data } = await api.delete(`/chat/conversations/${conversation._id}/members/${memberId}`);
        toast.success('Member removed');
        onGroupUpdated(data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to remove member');
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        await api.delete(`/chat/conversations/${conversation._id}/leave`);
        toast.success('Left group');
        onGroupUpdated(null); // Signal that we left so MessagesPage can clear active convo
        onClose();
      } catch (error) {
        console.error(error);
        toast.error('Failed to leave group');
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (window.confirm('Are you sure you want to permanently delete this group?')) {
      try {
        await api.delete(`/chat/conversations/${conversation._id}`);
        toast.success('Group deleted');
        onGroupUpdated(null);
        onClose();
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete group');
      }
    }
  };

  if (!isOpen || !conversation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-200 bg-surface-50 flex flex-col items-center relative">
          <button onClick={onClose} className="absolute right-4 top-4 text-surface-400 hover:text-surface-600 p-1 rounded-full hover:bg-surface-200">
            <X className="h-5 w-5" />
          </button>
          
          <div className="h-16 w-16 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl shadow-sm mb-3">
            {conversation.name?.charAt(0)?.toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-surface-900">{conversation.name}</h2>
          <p className="text-sm text-surface-500 mt-1">{conversation.participants?.length || 0} members</p>
          
          {isAdmin && (
            <div className="flex w-full mt-5 rounded-lg bg-surface-200 p-1">
              <button 
                onClick={() => setActiveTab('members')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'members' ? 'bg-white shadow text-surface-900' : 'text-surface-500 hover:text-surface-700'}`}
              >
                Members
              </button>
              <button 
                onClick={() => setActiveTab('add')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'add' ? 'bg-white shadow text-surface-900' : 'text-surface-500 hover:text-surface-700'}`}
              >
                Add Users
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {activeTab === 'members' ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-surface-900 mb-2">Group Members</h3>
              {conversation.participants?.map(participant => {
                const isOnline = onlineUsers?.includes(participant._id);
                const isParticipantAdmin = conversation.createdBy === participant._id;
                
                return (
                  <div key={participant._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-50 transition-colors group border border-transparent hover:border-surface-100">
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-surface-200 flex items-center justify-center text-surface-700 font-medium text-sm">
                          {participant.name?.charAt(0)}
                        </div>
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-surface-900 flex items-center">
                          {participant.name}
                          {isParticipantAdmin && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-700">ADMIN</span>}
                          {participant._id === user._id && <span className="ml-2 text-xs text-surface-400">(You)</span>}
                        </p>
                        <p className="text-xs text-surface-500">{participant.email}</p>
                      </div>
                    </div>
                    
                    {isAdmin && participant._id !== user._id && (
                      <button 
                        onClick={() => handleRemoveMember(participant._id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-all"
                        title="Remove member"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users to add..."
                  className="w-full rounded-lg border border-surface-300 pl-9 pr-4 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-surface-50 rounded-lg border border-surface-200">
                  {selectedUsers.map(u => (
                    <div key={`sel-${u._id}`} className="flex items-center bg-white border border-surface-300 rounded-full pl-2 pr-1 py-1 shadow-sm">
                      <span className="text-xs font-medium text-surface-700 mr-1">{u.name}</span>
                      <button onClick={() => handleToggleUser(u)} className="text-surface-400 hover:text-red-500 rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1 mt-2">
                {peers.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(peer => {
                  const isSelected = selectedUsers.some(u => u._id === peer._id);
                  return (
                    <div 
                      key={peer._id} 
                      onClick={() => handleToggleUser(peer)}
                      className="flex items-center p-2 rounded-lg hover:bg-surface-50 cursor-pointer transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-surface-200 flex items-center justify-center text-surface-700 text-xs">
                        {peer.name?.charAt(0)}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-surface-900">{peer.name}</p>
                      </div>
                      <div className={`h-4 w-4 rounded-sm border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'border-surface-300 text-transparent'}`}>
                        <Check className="h-3 w-3" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-200 bg-surface-50 flex justify-between items-center">
          {activeTab === 'members' ? (
            <div className="flex space-x-2 w-full justify-between">
              <button 
                onClick={handleLeaveGroup}
                className="flex items-center text-red-600 hover:text-red-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave Group
              </button>
              {isAdmin && (
                <button 
                  onClick={handleDeleteGroup}
                  className="flex items-center text-red-600 hover:text-red-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors border border-red-200"
                >
                  Delete Group
                </button>
              )}
            </div>
          ) : (
            <div className="w-full flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setActiveTab('members')}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddMembers} 
                disabled={isLoading || selectedUsers.length === 0}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                {isLoading ? 'Adding...' : 'Add Selected'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsModal;
