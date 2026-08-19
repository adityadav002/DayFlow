import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';
import { cn } from '../../utils/helpers';

const Column = ({ id, title, tasks, onAddTask }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div className="flex h-full w-80 shrink-0 flex-col rounded-xl bg-surface-100 p-3">
      {/* Column Header */}
      <div className="mb-4 flex items-center justify-between px-1">
        <h3 className="font-semibold text-surface-900">{title}</h3>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-200 text-xs font-medium text-surface-600">
          {tasks.length}
        </span>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 overflow-y-auto custom-scrollbar space-y-3 p-1 transition-colors",
          isOver && "bg-surface-200/50 rounded-lg"
        )}
      >
        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-surface-300">
            <span className="text-sm text-surface-400">Drop tasks here</span>
          </div>
        )}
      </div>

      {/* Add Task Button */}
      <button
        onClick={onAddTask}
        className="mt-3 flex items-center justify-center rounded-lg py-2 text-sm font-medium text-surface-600 hover:bg-surface-200 hover:text-surface-900 transition-colors"
      >
        <Plus className="mr-1 h-4 w-4" />
        Add Task
      </button>
    </div>
  );
};

export default Column;
