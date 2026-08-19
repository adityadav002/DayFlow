import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  format, 
  addDays, 
  subDays, 
  isToday, 
  parseISO 
} from 'date-fns';
import { 
  Sun, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  Clock, 
  MapPin, 
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import { fetchMyDay, setMyDayDate } from '../redux/slices/mydaySlice';
import { updateTask } from '../redux/slices/taskSlice';
import * as reminderApi from '../api/reminderApi';
import TaskDetailModal from '../components/boards/TaskDetailModal';
import { EventDetailModal, ReminderDetailModal } from '../components/calendar/CalendarModals';

const MyDayPage = () => {
  const dispatch = useDispatch();
  
  // State from Store
  const { user } = useSelector((state) => state.auth);
  const { date: activeDateStr, timeline, overdue, tomorrow, summary, status } = useSelector((state) => state.myday);
  
  const activeDate = useMemo(() => new Date(activeDateStr), [activeDateStr]);

  // Selected item modal states
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const loadData = () => {
    dispatch(fetchMyDay(activeDateStr));
  };

  useEffect(() => {
    loadData();
  }, [dispatch, activeDateStr]);

  // Navigation Handlers
  const handlePrevDay = () => {
    const prev = subDays(activeDate, 1);
    dispatch(setMyDayDate(prev.toISOString().split('T')[0]));
  };

  const handleNextDay = () => {
    const next = addDays(activeDate, 1);
    dispatch(setMyDayDate(next.toISOString().split('T')[0]));
  };

  const handleToday = () => {
    dispatch(setMyDayDate(new Date().toISOString().split('T')[0]));
  };

  // Inline action triggers
  const handleToggleTask = async (task, e) => {
    e.stopPropagation();
    const newStatus = task.status === 'Done' ? 'Todo' : 'Done';
    const res = await dispatch(updateTask({ 
      taskId: task._id, 
      data: { status: newStatus, version: task.version } 
    }));
    if (updateTask.fulfilled.match(res)) {
      toast.success(`Task marked as ${newStatus}`);
      loadData();
    } else {
      toast.error(res.payload || 'Failed to update task');
    }
  };

  const handleToggleReminder = async (reminder, e) => {
    e.stopPropagation();
    try {
      await reminderApi.toggleReminderComplete(reminder._id);
      toast.success(reminder.isCompleted ? 'Reminder marked active' : 'Reminder marked completed');
      loadData();
    } catch (err) {
      toast.error('Failed to update reminder');
    }
  };

  const handleItemClick = (item, type) => {
    setSelectedItem(item);
    setSelectedItemType(type);
    if (type === 'task') setIsTaskModalOpen(true);
    if (type === 'event') setIsEventModalOpen(true);
    if (type === 'reminder') setIsReminderModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-surface-50 p-6 space-y-6 overflow-y-auto custom-scrollbar">
      {/* Welcome Banner / Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-surface-200 shadow-sm shrink-0">
        <div>
          <div className="flex items-center space-x-2">
            <Sun className="h-5 w-5 text-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">My Day Command Center</span>
          </div>
          <h1 className="text-xl font-bold text-surface-900 mt-1">
            {getGreeting()}, {user?.name || 'User'}
          </h1>
        </div>

        {/* Date navigators */}
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <div className="flex border border-surface-200 rounded-lg overflow-hidden bg-white">
            <button 
              onClick={handlePrevDay}
              className="p-2 hover:bg-surface-50 border-r border-surface-200 text-surface-600 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-4 py-1.5 text-xs font-semibold flex items-center justify-center text-surface-700 min-w-[150px]">
              {format(activeDate, 'EEEE, MMM d')}
            </span>
            <button 
              onClick={handleNextDay}
              className="p-2 hover:bg-surface-50 border-l border-surface-200 text-surface-600 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {!isToday(activeDate) && (
            <Button size="sm" variant="ghost" onClick={handleToday}>
              Today
            </Button>
          )}
        </div>
      </header>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-3 rounded-xl border border-surface-200 shadow-sm flex items-center space-x-3">
          <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
          <div>
            <span className="text-xl font-black text-surface-900 block leading-tight">{summary.urgent}</span>
            <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Urgent</span>
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-surface-200 shadow-sm flex items-center space-x-3">
          <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
          <div>
            <span className="text-xl font-black text-surface-900 block leading-tight">{summary.high}</span>
            <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">High</span>
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-surface-200 shadow-sm flex items-center space-x-3">
          <div className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />
          <div>
            <span className="text-xl font-black text-surface-900 block leading-tight">{summary.normal}</span>
            <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Normal</span>
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-surface-200 shadow-sm flex items-center space-x-3">
          <div className="h-2 w-2 rounded-full bg-red-600 shrink-0 animate-pulse" />
          <div>
            <span className="text-xl font-black text-red-600 block leading-tight">{summary.overdue}</span>
            <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Overdue</span>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start flex-1 min-h-0">
        
        {/* Left / Middle: Timeline list (2 columns on desktop) */}
        <div className="lg:col-span-2 space-y-4 h-full relative">
          {status === 'loading' && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
              <Loader />
            </div>
          )}

          <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-surface-800 border-b border-surface-100 pb-2">Today's Timeline</h2>

            <div className="space-y-3">
              {timeline.map((entry, idx) => {
                const isItemTask = entry.type === 'task';
                const isItemEvent = entry.type === 'event';
                const isItemReminder = entry.type === 'reminder';

                const isCompleted = isItemTask 
                  ? entry.item.status === 'Done' 
                  : isItemReminder 
                    ? entry.item.isCompleted 
                    : false;

                return (
                  <div 
                    key={idx}
                    onClick={() => handleItemClick(entry.item, entry.type)}
                    className={`flex items-center justify-between p-3.5 rounded-lg border transition-all hover:scale-[1.005] cursor-pointer ${
                      isCompleted 
                        ? 'bg-surface-50/50 border-surface-200 opacity-60' 
                        : isItemTask 
                          ? 'bg-amber-50/30 border-amber-100 hover:bg-amber-50/50' 
                          : isItemEvent 
                            ? 'bg-sky-50/30 border-sky-100 hover:bg-sky-50/50' 
                            : 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Completion check toggle */}
                      {(isItemTask || isItemReminder) ? (
                        <button 
                          onClick={(e) => isItemTask ? handleToggleTask(entry.item, e) : handleToggleReminder(entry.item, e)}
                          className="text-surface-400 hover:text-primary-600 transition-colors"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                      ) : (
                        <div className="h-5 w-5 flex items-center justify-center shrink-0">
                          <Calendar className="h-4 w-4 text-sky-500" />
                        </div>
                      )}

                      <div>
                        <h3 className={`font-semibold text-sm ${isCompleted ? 'line-through text-surface-400' : 'text-surface-900'}`}>
                          {entry.item.title}
                        </h3>
                        <div className="flex items-center space-x-2 text-xs text-surface-500 mt-1">
                          {entry.time && (
                            <div className="flex items-center shrink-0">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{entry.time}</span>
                            </div>
                          )}
                          {entry.item.location && (
                            <div className="flex items-center truncate">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{entry.item.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Meta information tags */}
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded uppercase bg-surface-100 text-surface-600">
                        {entry.item.context || 'work'}
                      </span>
                      {isItemTask && entry.item.priority && (
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                          entry.item.priority === 'Urgent' ? 'bg-red-100 text-red-800 animate-pulse' :
                          entry.item.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                          entry.item.priority === 'Medium' ? 'bg-blue-100 text-blue-800' :
                          'bg-surface-200 text-surface-700'
                        }`}>
                          {entry.item.priority}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {timeline.length === 0 && (
                <div className="text-center py-12 space-y-2">
                  <Calendar className="h-10 w-10 text-surface-300 mx-auto" />
                  <h3 className="font-bold text-surface-700">Clear Horizon</h3>
                  <p className="text-sm text-surface-400">Nothing scheduled for today. Take a breather!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Column: Overdue and Tomorrow Sections */}
        <div className="space-y-6">
          
          {/* Overdue Section */}
          <div className="bg-white p-4 rounded-xl border border-surface-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-surface-100 pb-2">
              <h2 className="text-sm font-bold text-surface-800 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                Overdue Tasks
              </h2>
              {overdue.length > 5 && (
                <span className="text-[10px] text-primary-600 font-bold">Show All</span>
              )}
            </div>
            
            <div className="space-y-2">
              {overdue.slice(0, 5).map(task => (
                <div 
                  key={task._id}
                  onClick={() => handleItemClick(task, 'task')}
                  className="p-3 bg-red-50/20 border border-red-100 rounded-lg hover:bg-red-50/40 transition-colors cursor-pointer flex justify-between items-start"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-surface-900 leading-snug">{task.title}</h4>
                    <span className="text-[10px] text-red-500 font-bold block mt-1">
                      Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => handleToggleTask(task, e)}
                    className="text-surface-400 hover:text-green-500 transition-colors p-0.5"
                  >
                    <Circle className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {overdue.length === 0 && (
                <p className="text-xs text-surface-400 italic py-2">No overdue tasks.</p>
              )}
            </div>
          </div>

          {/* Tomorrow Preview Section */}
          <div className="bg-white p-4 rounded-xl border border-surface-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-surface-800 border-b border-surface-100 pb-2 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-sky-500" />
              Tomorrow's Preview
            </h2>
            
            <div className="space-y-2">
              {tomorrow.map((entry, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleItemClick(entry.item, entry.type)}
                  className="flex items-center justify-between p-2.5 bg-surface-50/50 hover:bg-surface-50 border border-surface-100 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      entry.type === 'task' ? 'bg-amber-500' : 'bg-sky-500'
                    }`} />
                    <span className="text-xs font-medium text-surface-800 truncate">{entry.title}</span>
                  </div>
                  {entry.time && (
                    <span className="text-[10px] text-surface-400 font-semibold shrink-0">{entry.time}</span>
                  )}
                </div>
              ))}
              {tomorrow.length === 0 && (
                <p className="text-xs text-surface-400 italic py-2">No entries scheduled for tomorrow.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Item Detail Modals */}
      {selectedItem && selectedItemType === 'task' && (
        <TaskDetailModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedItem(null);
            loadData();
          }}
          task={selectedItem}
        />
      )}

      {selectedItem && selectedItemType === 'event' && (
        <EventDetailModal
          isOpen={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false);
            setSelectedItem(null);
            loadData();
          }}
          event={selectedItem}
          onSaveSuccess={loadData}
        />
      )}

      {selectedItem && selectedItemType === 'reminder' && (
        <ReminderDetailModal
          isOpen={isReminderModalOpen}
          onClose={() => {
            setIsReminderModalOpen(false);
            setSelectedItem(null);
            loadData();
          }}
          reminder={selectedItem}
          onSaveSuccess={loadData}
        />
      )}
    </div>
  );
};

export default MyDayPage;
