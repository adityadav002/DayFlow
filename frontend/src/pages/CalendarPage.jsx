import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfDay, 
  endOfDay, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  addDays, 
  subDays 
} from 'date-fns';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, ListFilter, Users } from 'lucide-react';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { cn } from '../utils/helpers';
import { fetchCalendarData, setCurrentView, setCurrentDate } from '../redux/slices/calendarSlice';
import { 
  CalendarMonthView, 
  CalendarWeekView, 
  CalendarDayView, 
  CalendarAgendaView 
} from '../components/calendar/CalendarViews';
import { 
  CreateItemModal, 
  EventDetailModal, 
  ReminderDetailModal 
} from '../components/calendar/CalendarModals';
import TaskDetailModal from '../components/boards/TaskDetailModal';
import { fetchBoards } from '../redux/slices/boardSlice';

const CalendarPage = () => {
  const dispatch = useDispatch();
  
  // State from Redux Store
  const { items, currentView, currentDate: currentDateStr, status } = useSelector((state) => state.calendar);
  
  // Convert date string back to Date object
  const currentDate = useMemo(() => new Date(currentDateStr), [currentDateStr]);

  // Context filters
  const [selectedContext, setSelectedContext] = useState('');

  const { currentWorkspace } = useSelector((state) => state.workspaces);
  const { items: teams } = useSelector((state) => state.teams);
  
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [checkedMembers, setCheckedMembers] = useState({});

  useEffect(() => {
    if (!selectedTeamId) {
      setTeamMembers([]);
      setCheckedMembers({});
      return;
    }
    const loadTeamMembers = async () => {
      try {
        const teamApi = await import('../api/teamApi');
        const res = await teamApi.getTeamById(currentWorkspace._id, selectedTeamId);
        const members = res.data.data.members || [];
        setTeamMembers(members);
        
        const initialChecked = {};
        members.forEach(m => {
          if (m.user) {
            initialChecked[m.user._id] = true;
          }
        });
        setCheckedMembers(initialChecked);
      } catch (err) {
        console.error('Failed to load team members', err);
      }
    };
    loadTeamMembers();
  }, [selectedTeamId, currentWorkspace]);

  // Member color mapper
  const memberColors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899'];
  const getMemberColor = (memberId) => {
    if (!memberId) return '#3b82f6';
    const idx = teamMembers.findIndex(m => m.user?._id === memberId);
    return memberColors[idx % memberColors.length] || '#3b82f6';
  };

  const filteredItems = useMemo(() => {
    if (!items) return { tasks: [], events: [], reminders: [] };
    
    let tasks = items.tasks || [];
    let events = items.events || [];
    let reminders = items.reminders || [];

    if (selectedTeamId) {
      tasks = tasks.filter(t => {
        const assigneeId = t.assignedTo?._id || t.assignedTo;
        if (!assigneeId) return true;
        return !!checkedMembers[assigneeId];
      }).map(t => {
        const assigneeId = t.assignedTo?._id || t.assignedTo;
        return {
          ...t,
          color: getMemberColor(assigneeId)
        };
      });

      events = events.filter(e => {
        const creatorId = e.creator?._id || e.creator;
        if (checkedMembers[creatorId]) return true;
        if (e.participants) {
          return e.participants.some(p => checkedMembers[p._id || p]);
        }
        return false;
      }).map(e => {
        const creatorId = e.creator?._id || e.creator;
        return {
          ...e,
          color: getMemberColor(creatorId)
        };
      });
    }

    return { tasks, events, reminders };
  }, [items, selectedTeamId, checkedMembers, teamMembers]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState(null);
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null); // 'task' | 'event' | 'reminder'
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // Visible Range based on View
  const dateRange = useMemo(() => {
    let start, end;
    if (currentView === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      start = startOfWeek(monthStart);
      end = endOfWeek(monthEnd);
    } else if (currentView === 'week') {
      start = startOfWeek(currentDate);
      end = endOfWeek(currentDate);
    } else if (currentView === 'day') {
      start = startOfDay(currentDate);
      end = endOfDay(currentDate);
    } else { // agenda
      start = startOfDay(currentDate);
      end = addDays(start, 30); // fetch next 30 days
    }
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [currentDate, currentView]);

  // Load calendar range data
  const loadData = () => {
    dispatch(fetchCalendarData({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      context: selectedContext || undefined,
      teamId: selectedTeamId || undefined
    }));
  };

  useEffect(() => {
    loadData();
  }, [dispatch, dateRange.startDate, dateRange.endDate, selectedContext, selectedTeamId]);

  // Load boards for task assigning
  useEffect(() => {
    dispatch(fetchBoards());
  }, [dispatch]);

  // Navigation handlers
  const handlePrev = () => {
    let nextDate;
    if (currentView === 'month') {
      nextDate = subMonths(currentDate, 1);
    } else if (currentView === 'week') {
      nextDate = subWeeks(currentDate, 1);
    } else {
      nextDate = subDays(currentDate, 1);
    }
    dispatch(setCurrentDate(nextDate.toISOString()));
  };

  const handleNext = () => {
    let nextDate;
    if (currentView === 'month') {
      nextDate = addMonths(currentDate, 1);
    } else if (currentView === 'week') {
      nextDate = addWeeks(currentDate, 1);
    } else {
      nextDate = addDays(currentDate, 1);
    }
    dispatch(setCurrentDate(nextDate.toISOString()));
  };

  const handleToday = () => {
    dispatch(setCurrentDate(new Date().toISOString()));
  };

  const handleViewChange = (view) => {
    dispatch(setCurrentView(view));
  };

  // Click handlers
  const handleDateClick = (date) => {
    setPrefilledDate(date);
    setIsCreateModalOpen(true);
  };

  const handleTimeSlotClick = (date) => {
    setPrefilledDate(date);
    setIsCreateModalOpen(true);
  };

  const handleItemClick = (item, type) => {
    setSelectedItem(item);
    setSelectedItemType(type);
    if (type === 'task') setIsTaskModalOpen(true);
    if (type === 'event') setIsEventModalOpen(true);
    if (type === 'reminder') setIsReminderModalOpen(true);
  };

  const getHeaderDateLabel = () => {
    if (currentView === 'month') {
      return format(currentDate, 'MMMM yyyy');
    }
    if (currentView === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM d, yyyy');
  };

  return (
    <div className="flex h-full flex-col bg-surface-50 custom-scrollbar overflow-hidden">
      {/* Calendar Header */}
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 md:p-6 shrink-0 border-b border-surface-200 bg-white z-10">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 w-full xl:w-auto">
          <h1 className="text-[24px] md:text-[28px] font-medium text-surface-900 tracking-tight">Calendar</h1>
          
          {/* Navigation Controls */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center border border-surface-200 rounded-[10px] overflow-hidden shadow-sm bg-white">
              <button 
                onClick={handlePrev}
                className="p-1.5 md:p-2 hover:bg-surface-50 border-r border-surface-200 text-surface-600 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 md:px-5 py-1.5 md:py-2 text-[12px] md:text-[14px] font-medium text-surface-900 min-w-[120px] md:min-w-[160px] text-center">
                {getHeaderDateLabel()}
              </span>
              <button 
                onClick={handleNext}
                className="p-1.5 md:p-2 hover:bg-surface-50 border-l border-surface-200 text-surface-600 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <Button size="sm" variant="secondary" onClick={handleToday} className="h-8 md:h-9 px-3 text-[12px] md:text-[13px]">
              Today
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto overflow-x-auto pb-1 hide-scrollbar">
          {/* Filters */}
          <div className="flex items-center space-x-2 border border-surface-200 rounded-[10px] bg-white px-2 py-1 shadow-sm h-9">
            <Users className="h-4 w-4 text-surface-400 ml-1" />
            <select
              className="text-[13px] font-medium bg-transparent border-none text-surface-600 focus:outline-none focus:ring-0 cursor-pointer"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              <option value="">Personal</option>
              {teams.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 border border-surface-200 rounded-[10px] bg-white px-2 py-1 shadow-sm h-9">
            <ListFilter className="h-4 w-4 text-surface-400 ml-1" />
            <select
              className="text-[13px] font-medium bg-transparent border-none text-surface-600 focus:outline-none focus:ring-0 cursor-pointer"
              value={selectedContext}
              onChange={(e) => setSelectedContext(e.target.value)}
            >
              <option value="">All Contexts</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="study">Study</option>
            </select>
          </div>

          {/* Segmented Control for Views */}
          <div className="flex p-1 bg-surface-100 rounded-[10px] border border-surface-200 shadow-sm h-10">
            {['month', 'week', 'day', 'agenda'].map((v) => (
              <button
                key={v}
                onClick={() => dispatch(setCurrentView(v))}
                className={cn(
                  'px-4 py-1 text-[13px] font-medium rounded-md capitalize transition-all duration-200',
                  currentView === v 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-surface-600 hover:text-surface-900 hover:bg-surface-200/50'
                )}
              >
                {v}
              </button>
            ))}
          </div>

          <Button onClick={() => handleDateClick(new Date())} className="h-10">
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
      </header>

      {/* Team Member Filter checkboxes */}
      {selectedTeamId && teamMembers.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-xl border border-surface-200 shadow-sm shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Filter Members:</span>
          <div className="flex flex-wrap items-center gap-3">
            {teamMembers.map((m) => {
              if (!m.user) return null;
              const isChecked = !!checkedMembers[m.user._id];
              return (
                <label 
                  key={m.user._id} 
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all",
                    isChecked 
                      ? "bg-slate-50 border-slate-350 text-slate-700 shadow-xs" 
                      : "border-slate-100 text-slate-400 opacity-60 hover:opacity-100"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setCheckedMembers(prev => ({
                        ...prev,
                        [m.user._id]: !prev[m.user._id]
                      }));
                    }}
                    className="rounded text-primary-500 accent-primary-500 cursor-pointer"
                  />
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getMemberColor(m.user._id) }} />
                  <span>{m.user.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Main View Display Container */}
      <div className="flex-1 min-h-0 relative">
        {status === 'loading' && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-xl">
            <Loader />
          </div>
        )}
        
        {currentView === 'month' && (
          <CalendarMonthView
            currentDate={currentDate}
            items={filteredItems}
            onDateClick={handleDateClick}
            onItemClick={handleItemClick}
          />
        )}
        
        {currentView === 'week' && (
          <CalendarWeekView
            currentDate={currentDate}
            items={filteredItems}
            onTimeSlotClick={handleTimeSlotClick}
            onItemClick={handleItemClick}
          />
        )}
        
        {currentView === 'day' && (
          <CalendarDayView
            currentDate={currentDate}
            items={filteredItems}
            onTimeSlotClick={handleTimeSlotClick}
            onItemClick={handleItemClick}
          />
        )}
        
        {currentView === 'agenda' && (
          <CalendarAgendaView
            currentDate={currentDate}
            items={filteredItems}
            onItemClick={handleItemClick}
          />
        )}
      </div>

      {/* Scheduled Items Management Modals */}
      <CreateItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        prefilledDate={prefilledDate}
        onSaveSuccess={loadData}
      />

      {selectedItem && selectedItemType === 'task' && (
        <TaskDetailModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedItem(null);
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
          }}
          reminder={selectedItem}
          onSaveSuccess={loadData}
        />
      )}
    </div>
  );
};

export default CalendarPage;
