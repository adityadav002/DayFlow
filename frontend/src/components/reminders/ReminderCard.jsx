import React from 'react';
import { CheckCircle, Clock, Trash2, Edit2, RotateCcw } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { toggleReminderComplete, deleteReminder } from '../../redux/slices/reminderSlice';
import { format } from 'date-fns';

const ReminderCard = ({ reminder, onEdit }) => {
  const dispatch = useDispatch();

  const handleToggle = () => {
    dispatch(toggleReminderComplete(reminder._id));
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      dispatch(deleteReminder(reminder._id));
    }
  };

  const isOverdue = !reminder.isCompleted && new Date(reminder.reminderDateTime) < new Date();

  return (
    <div className={`flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm transition-all ${
      reminder.isCompleted ? 'border-surface-200 opacity-75' : isOverdue ? 'border-red-300 bg-red-50/30' : 'border-surface-200 hover:border-primary-300'
    }`}>
      <div className="flex items-center space-x-4 flex-1">
        <button 
          onClick={handleToggle}
          className={`shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors ${
            reminder.isCompleted ? 'text-green-500 hover:text-green-600' : 'text-surface-300 hover:text-primary-500'
          }`}
        >
          {reminder.isCompleted ? <CheckCircle className="h-6 w-6" /> : <div className="h-6 w-6 rounded-full border-2 border-current" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate ${
            reminder.isCompleted ? 'line-through text-surface-500' : 'text-surface-900'
          }`}>
            {reminder.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs">
            <span className={`flex items-center ${isOverdue && !reminder.isCompleted ? 'text-red-600 font-semibold' : 'text-surface-500'}`}>
              <Clock className="h-3 w-3 mr-1" />
              {format(new Date(reminder.reminderDateTime), 'PPp')}
            </span>
            <span className="px-2 py-0.5 font-semibold rounded bg-surface-100 text-surface-700 capitalize">
              {reminder.context}
            </span>
            {reminder.isRecurring && (
              <span className="flex items-center text-surface-500">
                <RotateCcw className="h-3 w-3 mr-1" /> Recurring
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 shrink-0 ml-4">
        {!reminder.isCompleted && (
          <button 
            onClick={() => onEdit(reminder)}
            className="p-1.5 text-surface-400 hover:text-primary-600 rounded transition-colors"
            title="Edit reminder"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        )}
        <button 
          onClick={handleDelete}
          className="p-1.5 text-surface-400 hover:text-red-600 rounded transition-colors"
          title="Delete reminder"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ReminderCard;
