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
import { Card, CardContent } from '../components/common/Card';

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
    <div className="flex flex-col h-full bg-surface-50 p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar relative">
      {/* Welcome Banner / Header */}
      <header className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-white p-6 md:p-8 rounded-[16px] border border-surface-200 shadow-sm shrink-0 overflow-hidden">
        {/* Subtle landscape background */}
        <svg className="absolute bottom-0 right-0 w-full h-full pointer-events-none opacity-[0.06] object-cover" viewBox="0 0 1000 200" preserveAspectRatio="xMaxYMax slice" xmlns="http://www.w3.org/2500/svg">
          <path d="M0,200 L1000,200 L1000,100 Q800,150 600,100 T200,120 Q100,130 0,150 Z" fill="#B8A58C"/>
          <path d="M0,200 L1000,200 L1000,140 Q900,120 750,150 T400,140 Q200,160 0,180 Z" fill="#397D68"/>
        </svg>

        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-2">
            <Sun className="h-4 w-4 text-primary-500" />
            <span className="text-[11px] font-bold text-primary-500 uppercase tracking-[0.08em]">My Day Command Center</span>
          </div>
          <h1 className="text-[28px] font-medium text-surface-900 leading-tight">
            {getGreeting()}, {user?.name || 'User'}
          </h1>
          <p className="text-[15px] text-surface-500 mt-1">Here's what's happening with your day.</p>
        </div>

        {/* Date navigators */}
        <div className="flex items-center space-x-2 relative z-10">
          <div className="flex border border-surface-200 rounded-[10px] overflow-hidden bg-white shadow-sm">
            <button 
              onClick={handlePrevDay}
              className="p-2 hover:bg-surface-50 border-r border-surface-200 text-surface-600 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-5 py-2 text-[13px] font-medium flex items-center justify-center text-surface-900 min-w-[150px]">
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
            <Button size="sm" variant="ghost" onClick={handleToday} className="h-9">
              Today
            </Button>
          )}
        </div>
      </header>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <Card className="rounded-[12px]">
          <CardContent className="p-5 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <span className="text-[28px] font-semibold text-surface-900 block leading-none">{summary.urgent}</span>
              </div>
            </div>
            <span className="text-[14px] font-medium text-surface-900 mb-1">Urgent</span>
            <p className="text-[12px] text-surface-500 leading-snug">Tasks need immediate attention</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-[12px]">
          <CardContent className="p-5 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Sun className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <span className="text-[28px] font-semibold text-surface-900 block leading-none">{summary.high}</span>
              </div>
            </div>
            <span className="text-[14px] font-medium text-surface-900 mb-1">High Priority</span>
            <p className="text-[12px] text-surface-500 leading-snug">Important tasks to focus on</p>
          </CardContent>
        </Card>

        <Card className="rounded-[12px]">
          <CardContent className="p-5 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <CheckCircle className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <span className="text-[28px] font-semibold text-surface-900 block leading-none">{summary.normal}</span>
              </div>
            </div>
            <span className="text-[14px] font-medium text-surface-900 mb-1">Normal</span>
            <p className="text-[12px] text-surface-500 leading-snug">Tasks on your list</p>
          </CardContent>
        </Card>

        <Card className="rounded-[12px]">
          <CardContent className="p-5 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <Calendar className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <span className="text-[28px] font-semibold text-surface-900 block leading-none">{summary.overdue}</span>
              </div>
            </div>
            <span className="text-[14px] font-medium text-surface-900 mb-1">Overdue</span>
            <p className="text-[12px] text-surface-500 leading-snug">Tasks past due date</p>
          </CardContent>
        </Card>
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
                    className={`flex items-center justify-between p-3.5 rounded-lg border transition-all hover:-translate-y-0.5 shadow-sm hover:shadow cursor-pointer ${
                      isCompleted 
                        ? 'bg-surface-50/50 border-surface-200 opacity-60' 
                        : isItemTask 
                          ? 'bg-white border-primary-200 hover:border-primary-300' 
                          : isItemEvent 
                            ? 'bg-accent-50/30 border-accent-200 hover:border-accent-300' 
                            : 'bg-primary-50/30 border-primary-200 hover:border-primary-300'
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
                          <Calendar className="h-4 w-4 text-accent-500" />
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
                          entry.item.priority === 'Medium' ? 'bg-primary-100 text-primary-800' :
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
          <Card>
            <CardContent className="p-5 space-y-4">
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
            </CardContent>
          </Card>

          {/* Tomorrow Preview Section */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-surface-800 border-b border-surface-100 pb-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-primary-500" />
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
                      entry.type === 'task' ? 'bg-primary-500' : 'bg-accent-500'
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
            </CardContent>
          </Card>

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
