import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import TaskDetailModal from '../components/boards/TaskDetailModal';
import { isToday, isThisWeek, isBefore, startOfDay } from 'date-fns';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { fetchBoardById } from '../redux/slices/boardSlice';
import { fetchTasks, bulkUpdatePositions, moveTaskOptimistically } from '../redux/slices/taskSlice';
import useSocket from '../hooks/useSocket';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import Column from '../components/boards/Column';
import TaskCard from '../components/boards/TaskCard';
import CreateTaskModal from '../components/boards/CreateTaskModal';
import ShareBoardModal from '../components/boards/ShareBoardModal';
import { Plus, Users, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const COLUMNS = ['Backlog', 'Todo', 'In Progress', 'Review', 'Blocked', 'Done'];

const COLUMN_COLORS = {
  'Backlog':     'border-surface-300 bg-surface-50',
  'Todo':        'border-blue-200   bg-blue-50/40',
  'In Progress': 'border-amber-200  bg-amber-50/40',
  'Review':      'border-purple-200 bg-purple-50/40',
  'Blocked':     'border-red-300    bg-red-50/40',
  'Done':        'border-green-200  bg-green-50/40',
};

const BoardPage = ({ boardId: propBoardId }) => {
  const { boardId: paramBoardId } = useParams();
  const boardId = propBoardId || paramBoardId;
  const dispatch = useDispatch();
  
  // Initialize Socket connection and listeners
  useSocket(boardId);

  const { currentBoard, currentBoardStatus } = useSelector((state) => state.boards);
  const { items: tasks, status: tasksStatus } = useSelector((state) => state.tasks);
  
  const [activeTask, setActiveTask] = useState(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState('Todo');

  const { search } = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(search), [search]);
  const activeTaskIdFromUrl = queryParams.get('taskId');
  
  const [activeTaskForModal, setActiveTaskForModal] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    if (activeTaskIdFromUrl && tasks.length > 0) {
      const matchedTask = tasks.find(t => t._id === activeTaskIdFromUrl);
      if (matchedTask) {
        setActiveTaskForModal(matchedTask);
        setIsTaskModalOpen(true);
      }
    }
  }, [activeTaskIdFromUrl, tasks]);

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setActiveTaskForModal(null);
    window.history.replaceState(null, '', window.location.pathname);
  };

  // Filter states
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterContext, setFilterContext] = useState('all');
  const [filterDueDate, setFilterDueDate] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');

  // Extract unique tags and assignees from task list dynamically
  const uniqueTags = useMemo(() => {
    const tagsSet = new Set();
    tasks.forEach(t => {
      if (t.tags) {
        t.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  }, [tasks]);

  const uniqueAssignees = useMemo(() => {
    const map = new Map();
    tasks.forEach(t => {
      if (t.assignedTo) {
        map.set(t.assignedTo._id || t.assignedTo, t.assignedTo);
      }
    });
    return Array.from(map.values());
  }, [tasks]);

  // Client-side memoized filter calculation
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      
      if (filterAssignee !== 'all') {
        if (filterAssignee === 'unassigned') {
          if (task.assignedTo) return false;
        } else {
          const assigneeId = task.assignedTo?._id || task.assignedTo;
          if (assigneeId !== filterAssignee) return false;
        }
      }
      
      if (filterContext !== 'all' && (task.context || 'work') !== filterContext) return false;
      
      if (filterDueDate !== 'all') {
        if (!task.dueDate) return false;
        const d = new Date(task.dueDate);
        
        if (filterDueDate === 'today' && !isToday(d)) return false;
        if (filterDueDate === 'this_week' && !isThisWeek(d)) return false;
        if (filterDueDate === 'overdue' && !(isBefore(d, startOfDay(new Date())) && task.status !== 'Done')) return false;
      }
      
      if (filterTag !== 'all') {
        if (!task.tags || !task.tags.includes(filterTag)) return false;
      }
      
      if (filterSearch.trim() !== '') {
        if (!task.title.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      }
      
      return true;
    });
  }, [tasks, filterPriority, filterAssignee, filterContext, filterDueDate, filterTag, filterSearch]);

  useEffect(() => {
    if (boardId) {
      dispatch(fetchBoardById(boardId));
      dispatch(fetchTasks(boardId));
    }
  }, [dispatch, boardId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Group tasks by status — include all 6 columns
  const tasksByColumn = useMemo(() => {
    const grouped = {};
    COLUMNS.forEach(col => { grouped[col] = []; });
    filteredTasks.forEach(task => {
      if (grouped[task.status] !== undefined) {
        grouped[task.status].push(task);
      } else {
        grouped['Todo'].push(task);
      }
    });
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => a.position - b.position);
    });
    return grouped;
  }, [filteredTasks]);

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t._id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    
    // Find active task
    const activeTask = tasks.find(t => t._id === activeId);
    if (!activeTask) return;

    // Determine target status
    let targetStatus = activeTask.status;
    let targetIndex = 0;

    // Is over a column?
    if (COLUMNS.includes(overId)) {
      targetStatus = overId;
      targetIndex = tasksByColumn[targetStatus].length; // Append to end
    } else {
      // Over another task
      const overTask = tasks.find(t => t._id === overId);
      if (overTask) {
        targetStatus = overTask.status;
        targetIndex = tasksByColumn[targetStatus].findIndex(t => t._id === overId);
        
        // If moving down, we might need to adjust index slightly but dnd-kit gives relative positions.
        // Actually, we'll calculate exact index.
        const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        targetIndex = targetIndex >= 0 ? targetIndex + modifier : tasksByColumn[targetStatus].length + 1;
      }
    }

    if (activeTask.status === targetStatus && targetIndex === tasksByColumn[targetStatus].findIndex(t => t._id === activeId)) {
      // Same spot, do nothing
      return;
    }

    // Prepare updated tasks array for bulk update
    const targetColumnTasks = [...tasksByColumn[targetStatus]];
    if (activeTask.status === targetStatus) {
      // Moving within same column
      const currentIndex = targetColumnTasks.findIndex(t => t._id === activeId);
      targetColumnTasks.splice(currentIndex, 1);
      targetColumnTasks.splice(targetIndex, 0, activeTask);
    } else {
      // Moving across columns
      targetColumnTasks.splice(targetIndex, 0, { ...activeTask, status: targetStatus });
    }

    // Recalculate positions based on fractional indexing logic (simplified here, backend handles exact spacing)
    // For payload, we'll send the ordered IDs and statuses to backend.
    const updates = targetColumnTasks.map((task, idx) => ({
      taskId: task._id,
      status: targetStatus,
      position: idx * 65536, // This will be overwritten by backend's actual fractional calc, but good for optimistic UI
      version: task.version
    }));
    
    // Let's just pass the moved task and its new surrounding context to the backend, 
    // or send the entire column's new order. Sending entire column order is robust.
    dispatch(bulkUpdatePositions({
      boardId,
      tasks: updates
    })).unwrap().catch((err) => {
      toast.error(err || 'Failed to update task positions. Reverting...');
      dispatch(fetchTasks(boardId));
    });

    // Optimistically update
    dispatch(moveTaskOptimistically({
      taskId: activeId,
      newStatus: targetStatus,
      newPosition: updates.find(u => u.taskId === activeId).position
    }));
  };

  const openCreateModal = (status) => {
    setInitialStatus(status);
    setIsCreateTaskModalOpen(true);
  };

  if (currentBoardStatus === 'loading' || !currentBoard) {
    return <Loader fullScreen />;
  }

  return (
    <div className="flex h-full flex-col bg-surface-50">
      {/* Board Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-surface-200 bg-white px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-surface-900">{currentBoard.title}</h1>
          <div className="flex -space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary-100 text-xs font-medium text-primary-700">
              {currentBoard.createdBy.name?.charAt(0) || 'U'}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-surface-500"
            onClick={() => setIsShareModalOpen(true)}
          >
            <Users className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
        <div>
          <Button variant="ghost" size="sm" className="text-surface-500">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-200 bg-surface-50 px-6 py-2 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by title..."
              className="rounded-lg border border-surface-300 bg-white px-3 py-1.5 pl-8 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 w-44"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2500/svg" className="absolute left-2.5 top-2 h-4 w-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          {/* Priority Filter */}
          <select
            className="rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 text-surface-700 cursor-pointer"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          {/* Assignee Filter */}
          <select
            className="rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 text-surface-700 cursor-pointer"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
          >
            <option value="all">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {uniqueAssignees.map(u => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>

          {/* Context Filter */}
          <select
            className="rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 text-surface-700 cursor-pointer"
            value={filterContext}
            onChange={(e) => setFilterContext(e.target.value)}
          >
            <option value="all">All Contexts</option>
            {['work', 'personal', 'study', 'health', 'finance', 'family', 'other'].map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>

          {/* Due Date Filter */}
          <select
            className="rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 text-surface-700 cursor-pointer"
            value={filterDueDate}
            onChange={(e) => setFilterDueDate(e.target.value)}
          >
            <option value="all">All Due Dates</option>
            <option value="today">Due Today</option>
            <option value="this_week">Due This Week</option>
            <option value="overdue">Overdue</option>
          </select>

          {/* Tag Filter */}
          <select
            className="rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 text-surface-700 cursor-pointer"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="all">All Tags</option>
            {uniqueTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {(filterSearch !== '' || filterPriority !== 'all' || filterAssignee !== 'all' || filterContext !== 'all' || filterDueDate !== 'all' || filterTag !== 'all') && (
          <button
            onClick={() => {
              setFilterSearch('');
              setFilterPriority('all');
              setFilterAssignee('all');
              setFilterContext('all');
              setFilterDueDate('all');
              setFilterTag('all');
            }}
            className="text-xs font-semibold text-primary-600 hover:text-primary-850 cursor-pointer transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Board Canvas */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full items-start space-x-6">
            <SortableContext items={COLUMNS} strategy={horizontalListSortingStrategy}>
              {COLUMNS.map((columnId) => (
                <Column
                  key={columnId}
                  id={columnId}
                  title={columnId}
                  tasks={tasksByColumn[columnId] || []}
                  onAddTask={() => openCreateModal(columnId)}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        boardId={boardId}
        initialStatus={initialStatus}
      />
      <ShareBoardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        boardId={boardId}
      />
      {activeTaskForModal && (
        <TaskDetailModal
          isOpen={isTaskModalOpen}
          onClose={handleCloseTaskModal}
          task={activeTaskForModal}
        />
      )}
    </div>
  );
};

export default BoardPage;
