import React, { useState, useEffect } from 'react';
import { X, Search, Check, Users } from 'lucide-react';
import Button from '../common/Button';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [peers, setPeers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPeers();
      setGroupName('');
      setSearchQuery('');
      setSelectedUsers([]);
    }
  }, [isOpen]);

  const fetchPeers = async () => {
    try {
      const { data } = await api.get('/chat/peers');
      setPeers(data);
    } catch (err) {
      console.error('Failed to load peers', err);
    }
  };

  const handleToggleUser = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post('/chat/conversations', {
        isGroup: true,
        name: groupName.trim(),
        participants: selectedUsers.map(u => u._id)
      });
      toast.success('Group created successfully!');
      onGroupCreated(data);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredPeers = peers.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center bg-surface-50">
          <div className="flex items-center text-surface-900">
            <Users className="h-5 w-5 mr-2 text-primary-600" />
            <h2 className="text-lg font-semibold">Create New Group</h2>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600 transition-colors p-1 rounded-full hover:bg-surface-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="mb-5">
            <label className="block text-sm font-medium text-surface-700 mb-1">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Development Team"
              className="w-full rounded-lg border border-surface-300 px-4 py-2.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-surface-900 shadow-sm"
              maxLength={50}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-surface-700 mb-1">Add Members</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full rounded-lg border border-surface-300 pl-9 pr-4 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm"
              />
            </div>
          </div>

          {/* Selected Users Chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 p-3 bg-surface-50 rounded-lg border border-surface-200">
              {selectedUsers.map(u => (
                <div key={`selected-${u._id}`} className="flex items-center bg-white border border-surface-300 rounded-full pl-2 pr-1 py-1 shadow-sm">
                  <span className="text-xs font-medium text-surface-700 mr-1">{u.name}</span>
                  <button onClick={() => handleToggleUser(u)} className="text-surface-400 hover:text-red-500 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* User List */}
          <div className="space-y-1">
            {filteredPeers.length === 0 ? (
              <p className="text-sm text-surface-500 text-center py-4">No users found.</p>
            ) : (
              filteredPeers.map(peer => {
                const isSelected = selectedUsers.some(u => u._id === peer._id);
                return (
                  <div 
                    key={peer._id} 
                    onClick={() => handleToggleUser(peer)}
                    className="flex items-center p-3 rounded-lg hover:bg-surface-50 cursor-pointer transition-colors border border-transparent hover:border-surface-200"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium flex-shrink-0">
                      {peer.name?.charAt(0)}
                    </div>
                    <div className="ml-3 flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-surface-900 truncate">{peer.name}</p>
                      <p className="text-xs text-surface-500 truncate">{peer.email}</p>
                    </div>
                    <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'border-surface-300 text-transparent'}`}>
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-200 bg-surface-50 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateGroup} 
            disabled={isLoading || !groupName.trim() || selectedUsers.length === 0}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            {isLoading ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
