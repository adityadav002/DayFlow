import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { addMemberToBoard, removeMemberFromBoard } from '../../redux/slices/boardSlice';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Avatar from '../common/Avatar';
import { Trash2, UserPlus, Crown } from 'lucide-react';

const ShareBoardModal = ({ isOpen, onClose, boardId }) => {
  const dispatch = useDispatch();
  const { currentBoard } = useSelector((state) => state.boards);
  const { user: currentUser } = useSelector((state) => state.auth);
  
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentBoard) return null;

  const isOwner = currentBoard.createdBy._id === currentUser?._id || currentBoard.createdBy === currentUser?._id;

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const resultAction = await dispatch(addMemberToBoard({ boardId, email }));
      if (addMemberToBoard.fulfilled.match(resultAction)) {
        toast.success('Member added successfully');
        setEmail('');
      } else {
        toast.error(resultAction.payload || 'Failed to add member');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      const resultAction = await dispatch(removeMemberFromBoard({ boardId, userId }));
      if (removeMemberFromBoard.fulfilled.match(resultAction)) {
        toast.success('Member removed');
      } else {
        toast.error(resultAction.payload || 'Failed to remove member');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Board">
      <div className="space-y-6">
        {isOwner && (
          <form onSubmit={handleAddMember} className="flex items-end space-x-2">
            <div className="flex-1">
              <Input
                label="Invite Member"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" isLoading={isSubmitting} className="mb-1">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite
            </Button>
          </form>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-surface-700">Board Members</h3>
          <ul className="divide-y divide-surface-200 rounded-md border border-surface-200">
            {currentBoard.members?.map((member) => {
              const memberId = member._id || member;
              const isMemberOwner = currentBoard.createdBy._id === memberId || currentBoard.createdBy === memberId;
              
              return (
                <li key={memberId} className="flex items-center justify-between p-3">
                  <div className="flex items-center space-x-3">
                    <Avatar user={member} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-surface-900">{member.name || 'Unknown User'}</p>
                      <p className="text-xs text-surface-500">{member.email || 'Email not available'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isMemberOwner && (
                      <span className="flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        <Crown className="mr-1 h-3 w-3 text-amber-600" />
                        Owner
                      </span>
                    )}
                    
                    {isOwner && !isMemberOwner && (
                      <button
                        onClick={() => handleRemoveMember(memberId)}
                        className="rounded p-1 text-surface-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default ShareBoardModal;
