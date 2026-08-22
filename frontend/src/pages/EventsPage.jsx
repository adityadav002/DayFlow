import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvents } from '../redux/slices/eventSlice';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Video, Users } from 'lucide-react';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  parseISO, isToday
} from 'date-fns';
import CreateEventModal from '../components/events/CreateEventModal';
import EventDetailsModal from '../components/events/EventDetailsModal';

const EventsPage = () => {
  const dispatch = useDispatch();
  const { items: events, status } = useSelector((state) => state.events);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch events for the current month
  useEffect(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    dispatch(fetchEvents({ 
      startDate: start.toISOString(), 
      endDate: end.toISOString() 
    }));
  }, [dispatch, currentDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const onDateClick = (day) => {
    setSelectedDate(day);
  };

  const handleEventClick = (e, event) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  // Generate calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = 'd';
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        // Find events for this day
        const dayEvents = events.filter(e => isSameDay(parseISO(e.startDateTime), cloneDay));
        
        days.push(
          <div
            className={`min-h-[100px] sm:min-h-[120px] p-2 border-r border-b border-surface-200 transition-colors cursor-pointer ${
              !isSameMonth(day, monthStart)
                ? 'bg-surface-50 text-surface-400'
                : isSameDay(day, selectedDate)
                ? 'bg-primary-50'
                : 'bg-white hover:bg-surface-50'
            }`}
            key={day.toString()}
            onClick={() => onDateClick(cloneDay)}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full ${
                isToday(day) ? 'bg-primary-600 text-white' : ''
              }`}>
                {formattedDate}
              </span>
            </div>
            
            <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px] no-scrollbar">
              {dayEvents.map((event) => (
                <div
                  key={event._id}
                  onClick={(e) => handleEventClick(e, event)}
                  className={`text-xs px-1.5 py-1 rounded truncate font-medium cursor-pointer transition-opacity hover:opacity-80 ${
                    event.color || 'bg-blue-100 text-blue-700'
                  }`}
                  title={event.title}
                >
                  {format(parseISO(event.startDateTime), 'HH:mm')} {event.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  }, [currentDate, selectedDate, events]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <header className="shrink-0 border-b border-surface-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-surface-100 rounded-lg p-1">
            <button onClick={prevMonth} className="p-1.5 hover:bg-white rounded shadow-sm text-surface-600">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={goToToday} className="px-3 py-1.5 text-sm font-semibold text-surface-700 hover:bg-white rounded shadow-sm mx-1">
              Today
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white rounded shadow-sm text-surface-600">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-surface-900 w-48">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>
        <div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Event
          </Button>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col overflow-hidden bg-surface-200">
        <div className="grid grid-cols-7 bg-white border-b border-surface-200 shrink-0">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-surface-500 uppercase tracking-wider border-r border-surface-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          {status === 'loading' && events.length === 0 ? (
            <Loader fullScreen />
          ) : (
            <div className="border-l border-t border-surface-200">
              {calendarDays}
            </div>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateEventModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          initialDate={selectedDate}
        />
      )}

      {isDetailsModalOpen && selectedEvent && (
        <EventDetailsModal 
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
        />
      )}
    </div>
  );
};

export default EventsPage;
