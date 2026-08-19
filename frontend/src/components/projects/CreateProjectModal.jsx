import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createProject, fetchProjects } from '../../redux/slices/projectSlice';
import Modal from '../common/Modal';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const PROJECT_COLORS = [
  '#0ea5e9', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#6b7280', // Gray
];

const CreateProjectModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { currentWorkspace } = useSelector((state) => state.workspaces);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    console.log('[PROJECT] handleSubmit called');
    console.log('[PROJECT] trimmedName:', trimmedName);
    console.log('[PROJECT] currentWorkspace:', currentWorkspace);
    if (!trimmedName || !currentWorkspace) {
      console.log('[PROJECT] Exiting early because trimmedName or currentWorkspace is missing');
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        createProject({
          name: trimmedName,
          description,
          workspace: currentWorkspace._id,
          color,
          startDate: startDate || null,
          dueDate: dueDate || null,
        })
      ).unwrap();
      toast.success('Project created successfully!');
      
      // Refresh list
      dispatch(fetchProjects({ workspace: currentWorkspace._id }));

      setName('');
      setDescription('');
      setColor(PROJECT_COLORS[0]);
      setStartDate('');
      setDueDate('');
      onClose();
    } catch (err) {
      toast.error(err || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Project">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-surface-700">Project Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Website Redesign, Q3 Roadmap"
            className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-surface-700">Description (Optional)</label>
          <textarea
            placeholder="Describe this project..."
            className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Date pickers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-surface-700">Start Date</label>
            <input
              type="date"
              className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-surface-700">Due Date</label>
            <input
              type="date"
              className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {/* Color picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-surface-700">Project Color</label>
          <div className="flex space-x-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`h-6 w-6 rounded-full border-2 transition-all ${
                  color === c ? 'border-surface-900 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;
