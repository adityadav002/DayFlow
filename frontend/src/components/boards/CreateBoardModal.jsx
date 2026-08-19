import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { boardSchema } from '../../utils/validationSchemas';
import { createBoard } from '../../redux/slices/boardSlice';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

const CreateBoardModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(boardSchema),
  });

  const onSubmit = async (data) => {
    try {
      const resultAction = await dispatch(createBoard(data));
      if (createBoard.fulfilled.match(resultAction)) {
        toast.success('Board created successfully');
        reset();
        onClose();
        // Navigate to the newly created board
        navigate(`/b/${resultAction.payload._id}`);
      } else {
        toast.error(resultAction.payload || 'Failed to create board');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Board">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Board Title"
          placeholder="e.g. Q3 Roadmap, Marketing Campaign"
          {...register('title')}
          error={errors.title?.message}
          autoFocus
        />
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Board
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateBoardModal;
