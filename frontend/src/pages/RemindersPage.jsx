import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReminders, createReminder } from '../redux/slices/reminderSlice';
import ReminderCard from '../components/reminders/ReminderCard';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { Plus, Search, Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { startOfToday, isToday, isPast, isFuture, parseISO } from 'date-fns';

const RemindersPage = () => {
  const dispatch = useDispatch();
  const { items: reminders, status } = useSelector((state) => state.reminders);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Reminder State
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newContext, setNewContext] = useState('personal');

  useEffect(() => {
    dispatch(fetchReminders());
  }, [dispatch]);

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate || !newTime) {
      return toast.error('Please fill in all required fields');
    }

    try {
      const dateTime = new Date(`${newDate}T${newTime}`);
      await dispatch(createReminder({
        title: newTitle,
        reminderDateTime: dateTime.toISOString(),
        context: newContext
      })).unwrap();
      
      toast.success('Reminder added');
      setNewTitle('');
      setNewDate('');
      setNewTime('');
      setShowAddForm(false);
    } catch (err) {
      toast.error(err || 'Failed to add reminder');
    }
  };

  const filteredReminders = useMemo(() => {
    return reminders.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [reminders, searchQuery]);

  const { today, upcoming, overdue, completed } = useMemo(() => {
    const today = [];
    const upcoming = [];
    const overdue = [];
    const completed = [];

    filteredReminders.forEach(reminder => {
      if (reminder.isCompleted) {
        completed.push(reminder);
        return;
      }
      const dt = parseISO(reminder.reminderDateTime);
      if (isToday(dt)) {
        today.push(reminder);
      } else if (isPast(dt)) {
        overdue.push(reminder);
      } else if (isFuture(dt)) {
        upcoming.push(reminder);
      }
    });

    return { today, upcoming, overdue, completed };
  }, [filteredReminders]);

  return (
    <div className="flex h-full flex-col bg-surface-50">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-surface-200 px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 flex items-center">
              <CheckCircle2 className="mr-2 h-6 w-6 text-primary-500" />
              Reminders
            </h1>
            <p className="text-sm text-surface-500 mt-1">Lightweight alerts and personal tasks</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search reminders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 rounded-full border border-surface-300 pl-9 pr-4 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Quick Add Form */}
          {showAddForm && (
            <form onSubmit={handleAddReminder} className="bg-white rounded-xl shadow-sm border border-surface-200 p-5 animate-in slide-in-from-top-4 fade-in duration-200">
              <h3 className="text-sm font-semibold text-surface-800 mb-4">Quick Add Reminder</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="What do you need to do?"
                    className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div>
                  <input
                    type="date"
                    required
                    className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <div>
                  <input
                    type="time"
                    required
                    className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>
                <div className="md:col-span-4 flex justify-between items-center mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-surface-500 font-medium">Context:</span>
                    <select
                      value={newContext}
                      onChange={(e) => setNewContext(e.target.value)}
                      className="text-xs rounded border border-surface-300 px-2 py-1 focus:outline-none"
                    >
                      <option value="work">Work</option>
                      <option value="personal">Personal</option>
                      <option value="health">Health</option>
                      <option value="finance">Finance</option>
                      <option value="family">Family</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                    <Button type="submit">Save Reminder</Button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {status === 'loading' && reminders.length === 0 ? (
            <Loader />
          ) : reminders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-surface-300">
              <CheckCircle2 className="h-12 w-12 text-surface-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-surface-900">No Reminders Yet</h3>
              <p className="text-sm text-surface-500 mt-1 mb-4">You're all caught up! Create a reminder to stay on top of things.</p>
              <Button onClick={() => setShowAddForm(true)}>Add your first reminder</Button>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Overdue Section */}
              {overdue.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" /> Overdue
                  </h3>
                  <div className="space-y-3">
                    {overdue.map(r => <ReminderCard key={r._id} reminder={r} onEdit={() => {}} />)}
                  </div>
                </section>
              )}

              {/* Today Section */}
              {today.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2" /> Today
                  </h3>
                  <div className="space-y-3">
                    {today.map(r => <ReminderCard key={r._id} reminder={r} onEdit={() => {}} />)}
                  </div>
                </section>
              )}

              {/* Upcoming Section */}
              {upcoming.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-surface-600 uppercase tracking-wider mb-3 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" /> Upcoming
                  </h3>
                  <div className="space-y-3">
                    {upcoming.map(r => <ReminderCard key={r._id} reminder={r} onEdit={() => {}} />)}
                  </div>
                </section>
              )}

              {/* Completed Section */}
              {completed.length > 0 && (
                <section className="opacity-70">
                  <h3 className="text-sm font-bold text-surface-500 uppercase tracking-wider mb-3 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Completed
                  </h3>
                  <div className="space-y-3">
                    {completed.map(r => <ReminderCard key={r._id} reminder={r} onEdit={() => {}} />)}
                  </div>
                </section>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemindersPage;
