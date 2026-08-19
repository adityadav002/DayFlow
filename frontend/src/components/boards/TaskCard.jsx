import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn, smartDueDate } from '../../utils/helpers';
import { MessageSquare, Paperclip, Clock, Trash2, Lock, CheckSquare, Repeat } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteTask } from '../../redux/slices/taskSlice';
import TaskDetailModal from './TaskDetailModal';

const priorityConfig = {
  Urgent: { label: 'Urgent', badge: 'bg-red-100 text-red-700',    border: 'border-l-red-500' },
  High:   { label: 'High',   badge: 'bg-orange-100 text-orange-700', border: 'border-l-orange-400' },
  Medium: { label: 'Medium', badge: 'bg-blue-100 text-blue-700',   border: 'border-l-blue-400' },
  Low:    { label: 'Low',    badge: 'bg-green-100 text-green-700', border: 'border-l-green-400' },
};

const TaskCard = ({ task, isOverlay }) => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { onlineUsers } = useSelector((state) => state.ui);

  const [shouldFlash, setShouldFlash] = useState(false);
  const prevVersionRef = useRef(task.version);

  useEffect(() => {
    if (task.version !== prevVersionRef.current) {
      setShouldFlash(true);
      prevVersionRef.current = task.version;
      const timer = setTimeout(() => setShouldFlash(false), 2000); // Flash for 2 seconds
      return () => clearTimeout(timer);
    }
  }, [task.version]);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: { type: 'Task', task },
  });

  const style = { transition, transform: CSS.Transform.toString(transform) };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteTask(task._id));
    }
  };

  const priority = priorityConfig[task.priority] || priorityConfig.Medium;
  const { text: dueDateText, isOverdue, isUrgent } = smartDueDate(task.dueDate);
  const isBlocked = task.status === 'Blocked';

  // Subtask progress
  const total = task.subtaskProgress?.total || 0;
  const completed = task.subtaskProgress?.completed || 0;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-28 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 opacity-50"
      />
    );
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "group relative flex cursor-grab flex-col gap-2.5 rounded-lg border border-l-4 border-surface-200 bg-white p-3 shadow-sm hover:border-primary-300 hover:shadow-md active:cursor-grabbing transition-all duration-500",
          priority.border,
          shouldFlash && "border-amber-400 bg-amber-50/30 shadow-md ring-2 ring-amber-400/20",
          isOverlay && "cursor-grabbing rotate-2 scale-105 shadow-xl",
          isBlocked && "opacity-70 grayscale-[30%]"
        )}
      >
        {/* Header: Priority badge + Blocked indicator + Delete */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            {task.priority && (
              <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", priority.badge)}>
                {priority.label}
              </span>
            )}
            {isBlocked && (
              <span className="flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 uppercase">
                <Lock className="h-2.5 w-2.5" /> Blocked
              </span>
            )}
            {task.hasBlockers && (
              <span className="flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase" title={`Has ${task.blockersCount || 1} unresolved blocker(s)`}>
                <Lock className="h-2.5 w-2.5" /> Blocked {task.blockersCount > 0 && `(${task.blockersCount})`}
              </span>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 p-1 text-surface-400 hover:text-red-600 transition-opacity shrink-0"
            title="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-surface-900 line-clamp-2 leading-snug">
          {task.title}
        </p>

        {/* Subtask Progress */}
        {total > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-surface-500">
              <span className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                {completed}/{total} subtasks
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-surface-200 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  progressPct === 100 ? "bg-green-500" : "bg-primary-500"
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer: Due date + comments + attachments + assignee */}
        <div className="flex items-center justify-between text-xs text-surface-500 mt-0.5">
          <div className="flex items-center space-x-2.5">
            {task.dueDate && (
              <div className={cn(
                "flex items-center font-medium",
                isOverdue ? "text-red-600" : isUrgent ? "text-amber-600" : "text-surface-500"
              )}>
                <Clock className="mr-1 h-3 w-3" />
                <span>{dueDateText}</span>
              </div>
            )}
            <div className="flex items-center">
              <MessageSquare className="mr-1 h-3 w-3" />
              <span>{task.commentsCount || 0}</span>
            </div>
            {task.attachments?.length > 0 && (
              <div className="flex items-center">
                <Paperclip className="mr-1 h-3 w-3" />
                <span>{task.attachments.length}</span>
              </div>
            )}
            {task.parentRecurringTask && (
              <div className="flex items-center text-primary-500 font-semibold" title="Recurring task occurrence">
                <Repeat className="mr-1 h-3 w-3" />
              </div>
            )}
            {task.actualDuration > 0 && (
              <div className="flex items-center text-primary-600 font-semibold" title={`Time spent: ${task.actualDuration}m`}>
                <Clock className="mr-1 h-3 w-3" />
                <span>{task.actualDuration}m</span>
              </div>
            )}
          </div>
          {task.assignedTo && (
            <div className="relative shrink-0">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[9px] font-bold text-primary-700">
                {task.assignedTo.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className={`absolute bottom-0 right-0 block h-1.5 w-1.5 rounded-full ring-0.5 ring-white ${
                onlineUsers.includes(task.assignedTo._id || task.assignedTo) ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
          )}
        </div>

        {/* Context badge */}
        {task.context && task.context !== 'work' && (
          <span className="self-start rounded-full bg-surface-100 px-2 py-0.5 text-[9px] font-semibold text-surface-500 uppercase tracking-wider">
            {task.context}
          </span>
        )}
      </div>

      {task && (
        <TaskDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          task={task}
        />
      )}
    </>
  );
};

export default TaskCard;
