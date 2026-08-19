import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  addDays, 
  parseISO 
} from 'date-fns';
import { Clock, MapPin, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';

const TYPE_COLORS = {
  task: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100',
  event: 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100',
  reminder: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
};

const TYPE_COLORS_DARK = {
  task: 'border-l-4 border-amber-500',
  event: 'border-l-4 border-sky-500',
  reminder: 'border-l-4 border-emerald-500'
};

const getItemTimeLabel = (item, type) => {
  if (type === 'event' && item.startDateTime) {
    return format(new Date(item.startDateTime), 'h:mm a');
  }
  if (type === 'reminder' && item.reminderDateTime) {
    return format(new Date(item.reminderDateTime), 'h:mm a');
  }
  if (type === 'task' && item.dueDate) {
    return 'Due ' + format(new Date(item.dueDate), 'h:mm a');
  }
  return 'All Day';
};

// ---------------- MONTH VIEW ----------------
export const CalendarMonthView = ({ currentDate, items, onDateClick, onItemClick }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayItems = (day) => {
    const dayTasks = items.tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));
    const dayEvents = items.events.filter(e => isSameDay(new Date(e.startDateTime), day) || isSameDay(new Date(e.endDateTime), day));
    const dayReminders = items.reminders.filter(r => isSameDay(new Date(r.reminderDateTime), day));
    
    return [
      ...dayTasks.map(t => ({ ...t, _itemType: 'task' })),
      ...dayEvents.map(e => ({ ...e, _itemType: 'event' })),
      ...dayReminders.map(r => ({ ...r, _itemType: 'reminder' }))
    ];
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-surface-200 overflow-hidden shadow-sm">
      {/* Week Headers */}
      <div className="grid grid-cols-7 border-b border-surface-200 bg-surface-50 text-center text-xs font-semibold uppercase tracking-wider text-surface-500 py-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 flex-1 divide-x divide-y divide-surface-200">
        {days.map((day, idx) => {
          const dayItems = getDayItems(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);

          return (
            <div 
              key={idx} 
              className={`min-h-[100px] p-2 flex flex-col justify-between transition-colors hover:bg-surface-50 cursor-pointer ${
                !isCurrentMonth ? 'bg-surface-50/50 text-surface-400' : 'text-surface-800'
              }`}
              onClick={() => onDateClick(day)}
            >
              {/* Header Cell */}
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm font-semibold rounded-full h-6 w-6 flex items-center justify-center ${
                  isDayToday ? 'bg-primary-600 text-white shadow-sm' : ''
                }`}>
                  {format(day, 'd')}
                </span>
                {dayItems.length > 0 && (
                  <span className="text-xs text-surface-400 font-medium">{dayItems.length} items</span>
                )}
              </div>

              {/* Items Badges */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                {dayItems.slice(0, 3).map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick(item, item._itemType);
                    }}
                    className={`px-2 py-0.5 text-xs font-medium border rounded truncate ${TYPE_COLORS[item._itemType]}`}
                    title={item.title}
                  >
                    {item.title}
                  </div>
                ))}
                {dayItems.length > 3 && (
                  <div className="text-[10px] text-primary-600 font-bold px-1 py-0.5">
                    + {dayItems.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------- WEEK VIEW ----------------
export const CalendarWeekView = ({ currentDate, items, onTimeSlotClick, onItemClick }) => {
  const start = startOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 AM to 10:00 PM

  const getDayItems = (day) => {
    const dayTasks = items.tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));
    const dayEvents = items.events.filter(e => isSameDay(new Date(e.startDateTime), day) || isSameDay(new Date(e.endDateTime), day));
    const dayReminders = items.reminders.filter(r => isSameDay(new Date(r.reminderDateTime), day));
    
    return [
      ...dayTasks.map(t => ({ ...t, _itemType: 'task' })),
      ...dayEvents.map(e => ({ ...e, _itemType: 'event' })),
      ...dayReminders.map(r => ({ ...r, _itemType: 'reminder' }))
    ];
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-surface-200 overflow-hidden shadow-sm overflow-x-auto">
      <div className="min-w-[700px] flex flex-col flex-1">
        {/* Header Dates */}
        <div className="grid grid-cols-8 border-b border-surface-200 bg-surface-50 text-center py-3 font-semibold text-xs text-surface-500">
          <div>Time</div>
          {days.map((day, idx) => (
            <div key={idx} className={isToday(day) ? 'text-primary-600 font-bold' : ''}>
              <div>{format(day, 'EEE')}</div>
              <div className="text-sm">{format(day, 'd')}</div>
            </div>
          ))}
        </div>

        {/* Time Grid Scroll Container */}
        <div className="flex-1 overflow-y-auto divide-y divide-surface-200 custom-scrollbar max-h-[60vh]">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 divide-x divide-surface-100 min-h-[60px] relative">
              {/* Hour Label */}
              <div className="p-2 text-right text-xs text-surface-400 font-medium">
                {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
              </div>

              {/* Day cells for this hour */}
              {days.map((day, dayIdx) => {
                const dayItems = getDayItems(day);
                
                // Match items occurring in this specific hour slot
                const hourItems = dayItems.filter(item => {
                  const date = new Date(item.startDateTime || item.reminderDateTime || item.dueDate);
                  return date.getHours() === hour;
                });

                return (
                  <div 
                    key={dayIdx} 
                    className="p-1 relative min-h-[60px] group transition-colors hover:bg-surface-50 cursor-pointer"
                    onClick={() => {
                      const newDate = new Date(day);
                      newDate.setHours(hour);
                      onTimeSlotClick(newDate);
                    }}
                  >
                    <div className="space-y-1">
                      {hourItems.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onItemClick(item, item._itemType);
                          }}
                          className={`p-1.5 text-[10px] font-semibold border rounded leading-tight truncate shadow-sm transition-all hover:scale-[1.02] ${TYPE_COLORS[item._itemType]}`}
                          title={`${item.title} (${getItemTimeLabel(item, item._itemType)})`}
                        >
                          <div className="font-bold truncate">{item.title}</div>
                          <div className="opacity-80 font-normal">{getItemTimeLabel(item, item._itemType)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------- DAY VIEW ----------------
export const CalendarDayView = ({ currentDate, items, onTimeSlotClick, onItemClick }) => {
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 AM to 10:00 PM

  const dayTasks = items.tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), currentDate));
  const dayEvents = items.events.filter(e => isSameDay(new Date(e.startDateTime), currentDate) || isSameDay(new Date(e.endDateTime), currentDate));
  const dayReminders = items.reminders.filter(r => isSameDay(new Date(r.reminderDateTime), currentDate));
  
  const allDayTasks = items.tasks.filter(t => !t.dueDate && t.startDate && isSameDay(new Date(t.startDate), currentDate));

  const allItems = [
    ...dayTasks.map(t => ({ ...t, _itemType: 'task' })),
    ...dayEvents.map(e => ({ ...e, _itemType: 'event' })),
    ...dayReminders.map(r => ({ ...r, _itemType: 'reminder' }))
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      {/* Time-based Grid Column (3/4 width) */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-surface-200 overflow-hidden shadow-sm flex flex-col">
        <div className="bg-surface-50 border-b border-surface-200 p-4 flex justify-between items-center">
          <h3 className="font-bold text-surface-900">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h3>
          {isToday(currentDate) && (
            <span className="px-2 py-0.5 text-xs font-bold bg-primary-100 text-primary-700 rounded-full">Today</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-surface-100 custom-scrollbar max-h-[60vh]">
          {hours.map((hour) => {
            const hourItems = allItems.filter(item => {
              const date = new Date(item.startDateTime || item.reminderDateTime || item.dueDate);
              return date.getHours() === hour;
            });

            return (
              <div key={hour} className="flex min-h-[64px] divide-x divide-surface-100 hover:bg-surface-50 transition-colors">
                {/* Time Indicator */}
                <div className="w-20 p-3 text-right text-xs text-surface-400 font-semibold shrink-0">
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                </div>
                {/* Clickable slot */}
                <div 
                  className="flex-1 p-2 cursor-pointer relative"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setHours(hour);
                    onTimeSlotClick(newDate);
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {hourItems.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemClick(item, item._itemType);
                        }}
                        className={`p-2 border rounded-lg shadow-sm cursor-pointer transition-all hover:scale-[1.01] ${TYPE_COLORS[item._itemType]}`}
                      >
                        <span className="font-bold text-xs capitalize opacity-70 block mb-0.5">{item._itemType}</span>
                        <h4 className="font-semibold text-sm leading-snug">{item.title}</h4>
                        {item.location && (
                          <div className="flex items-center text-xs opacity-80 mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side Panel for Untimed Tasks & Stats */}
      <div className="space-y-6">
        {/* Untimed / All-Day tasks */}
        <div className="bg-white p-4 rounded-xl border border-surface-200 shadow-sm space-y-4">
          <h3 className="font-bold text-surface-800 border-b border-surface-100 pb-2">Untimed Tasks</h3>
          <div className="space-y-2">
            {allDayTasks.map(task => (
              <div 
                key={task._id} 
                className="flex items-start justify-between p-3 bg-surface-50 border border-surface-200 rounded-lg hover:bg-surface-100 cursor-pointer transition-colors"
                onClick={() => onItemClick(task, 'task')}
              >
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-surface-400 mt-0.5 shrink-0" />
                  <span className="text-sm font-medium text-surface-800">{task.title}</span>
                </div>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">{task.priority}</span>
              </div>
            ))}
            {allDayTasks.length === 0 && (
              <p className="text-sm text-surface-400 italic py-2">No untimed tasks for today.</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white p-4 rounded-xl border border-surface-200 shadow-sm space-y-3">
          <h3 className="font-bold text-surface-800 border-b border-surface-100 pb-2">Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-sky-50/50 rounded-lg border border-sky-100">
              <span className="text-xl font-black text-sky-700">{dayEvents.length}</span>
              <span className="block text-[10px] text-surface-500 font-bold uppercase tracking-wider mt-1">Events</span>
            </div>
            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
              <span className="text-xl font-black text-amber-700">{dayTasks.length + allDayTasks.length}</span>
              <span className="block text-[10px] text-surface-500 font-bold uppercase tracking-wider mt-1">Tasks</span>
            </div>
            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 col-span-2">
              <span className="text-xl font-black text-emerald-700">{dayReminders.length}</span>
              <span className="block text-[10px] text-surface-500 font-bold uppercase tracking-wider mt-1">Reminders</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------- AGENDA VIEW ----------------
export const CalendarAgendaView = ({ currentDate, items, onItemClick }) => {
  const getAgendasByDate = () => {
    const datesMap = {};

    const addRecord = (date, item, type) => {
      const key = format(date, 'yyyy-MM-dd');
      if (!datesMap[key]) {
        datesMap[key] = { dateObject: date, records: [] };
      }
      datesMap[key].records.push({ ...item, _itemType: type });
    };

    items.tasks.forEach(task => {
      if (task.dueDate) {
        addRecord(new Date(task.dueDate), task, 'task');
      } else if (task.startDate) {
        addRecord(new Date(task.startDate), task, 'task');
      }
    });

    items.events.forEach(event => {
      if (event.startDateTime) {
        addRecord(new Date(event.startDateTime), event, 'event');
      }
    });

    items.reminders.forEach(reminder => {
      if (reminder.reminderDateTime) {
        addRecord(new Date(reminder.reminderDateTime), reminder, 'reminder');
      }
    });

    // Sort the dates chronologically
    return Object.values(datesMap).sort((a, b) => a.dateObject - b.dateObject);
  };

  const agendas = getAgendasByDate();

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
      <div className="space-y-6">
        {agendas.map((agenda, dayIdx) => (
          <div key={dayIdx} className="space-y-3">
            {/* Header Date Row */}
            <div className="flex items-center space-x-4 sticky top-0 bg-white z-10 py-1.5 border-b border-surface-100">
              <div className="text-xl font-black text-primary-600">{format(agenda.dateObject, 'dd')}</div>
              <div>
                <div className="text-sm font-bold text-surface-800 leading-none">{format(agenda.dateObject, 'EEEE')}</div>
                <div className="text-xs text-surface-400 mt-0.5">{format(agenda.dateObject, 'MMMM yyyy')}</div>
              </div>
            </div>

            {/* Records */}
            <div className="divide-y divide-surface-100">
              {agenda.records.map((rec, recIdx) => (
                <div 
                  key={recIdx} 
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 px-3 hover:bg-surface-50 cursor-pointer rounded-lg transition-colors ${TYPE_COLORS_DARK[rec._itemType]}`}
                  onClick={() => onItemClick(rec, rec._itemType)}
                >
                  <div className="flex items-center space-x-3 mb-1.5 sm:mb-0">
                    <div className="text-xs font-semibold text-surface-400 flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      <span>{getItemTimeLabel(rec, rec._itemType)}</span>
                    </div>
                    <span className="font-semibold text-sm text-surface-900">{rec.title}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-surface-100 text-surface-600 tracking-wider">
                      {rec.context || 'work'}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded capitalize ${
                      rec._itemType === 'task' ? 'bg-amber-100 text-amber-800' :
                      rec._itemType === 'event' ? 'bg-sky-100 text-sky-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {rec._itemType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {agendas.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <Calendar className="h-12 w-12 text-surface-300 mx-auto" />
            <h3 className="font-bold text-surface-700">Nothing Scheduled</h3>
            <p className="text-sm text-surface-400">There are no items matching this date range filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
