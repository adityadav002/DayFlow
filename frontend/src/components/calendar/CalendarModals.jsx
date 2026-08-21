import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Trash2, Clock, Calendar, Check, Save, Video } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { createTask } from '../../redux/slices/taskSlice';
import { joinMeeting } from '../../redux/slices/meetingSlice';
import * as eventApi from '../../api/eventApi';
import * as reminderApi from '../../api/reminderApi';

export const CreateItemModal = ({ isOpen, onClose, prefilledDate, onSaveSuccess }) => {
  const dispatch = useDispatch();
  const { items: boards } = useSelector((state) => state.boards);
  
  const [type, setType] = useState('task'); // 'task' | 'event' | 'reminder'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [context, setContext] = useState('work');
  
  // Tasks specific fields
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  
  // Events specific fields
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [isMeeting, setIsMeeting] = useState(false);
  const [meetingType, setMeetingType] = useState('video');

  // Reminders specific fields
  const [reminderDateTime, setReminderDateTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setContext('work');
      setLocation('');
      setPriority('Medium');
      setIsMeeting(false);
      setMeetingType('video');
      
      const formattedDate = prefilledDate ? new Date(prefilledDate).toISOString().split('T')[0] : '';
      setDueDate(formattedDate);
      
      // Default times to starting hour
      const formattedDateTime = prefilledDate ? `${formattedDate}T12:00` : '';
      setStartDateTime(formattedDateTime);
      setEndDateTime(prefilledDate ? `${formattedDate}T13:00` : '');
      setReminderDateTime(formattedDateTime);

      if (boards.length > 0) {
        setSelectedBoardId(boards[0]._id);
      }
    }
  }, [isOpen, prefilledDate, boards]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      if (type === 'task') {
        if (!selectedBoardId) {
          toast.error('Please select a board or create one first');
          return;
        }
        const taskData = {
          title,
          description,
          priority,
          context,
          dueDate: dueDate || null
        };
        const res = await dispatch(createTask({ boardId: selectedBoardId, data: taskData }));
        if (createTask.fulfilled.match(res)) {
          toast.success('Task created successfully');
          onSaveSuccess();
          onClose();
        } else {
          toast.error(res.payload || 'Failed to create task');
        }
      } else if (type === 'event') {
        if (!startDateTime || !endDateTime) {
          toast.error('Start and End date times are required');
          return;
        }
        if (new Date(endDateTime) < new Date(startDateTime)) {
          toast.error('End date time cannot be before start date time');
          return;
        }
        const eventData = {
          title,
          description,
          startDateTime,
          endDateTime,
          context,
          location,
          isMeeting,
          meetingType
        };
        await eventApi.createEvent(eventData);
        toast.success('Event created successfully');
        onSaveSuccess();
        onClose();
      } else if (type === 'reminder') {
        if (!reminderDateTime) {
          toast.error('Reminder date and time is required');
          return;
        }
        const reminderData = {
          title,
          description,
          reminderDateTime,
          context
        };
        await reminderApi.createReminder(reminderData);
        toast.success('Reminder created successfully');
        onSaveSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating item');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Scheduled Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selector */}
        <div className="flex space-x-2 border-b border-surface-200 pb-4">
          {['task', 'event', 'reminder'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-all ${
                type === t 
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Universal Fields */}
        <Input
          label="Title"
          placeholder="Enter title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <div className="space-y-1">
          <label className="text-sm font-medium text-surface-700">Description</label>
          <textarea
            className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 custom-scrollbar"
            rows={2}
            placeholder="Add details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-surface-700">Context</label>
            <select
              className="w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            >
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="study">Study</option>
              <option value="health">Health</option>
              <option value="finance">Finance</option>
              <option value="family">Family</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Conditional Fields depending on Type */}
          {type === 'task' && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-surface-700">Priority</label>
              <select
                className="w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          )}
        </div>

        {type === 'task' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-surface-700">Assign to Board</label>
              <select
                className="w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
              >
                {boards.map((b) => (
                  <option key={b._id} value={b._id}>{b.title}</option>
                ))}
              </select>
            </div>
            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        )}

        {type === 'event' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date Time"
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
              />
              <Input
                label="End Date Time"
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
              />
            </div>
            <Input
              label="Location"
              placeholder="e.g. Zoom, Conference Room"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <div className="flex items-center justify-between p-4 bg-surface-50 border border-surface-200 rounded-lg">
              <div>
                <h4 className="text-sm font-semibold text-surface-800">Add Video Meeting</h4>
                <p className="text-xs text-surface-500">Automatically creates a joinable WebRTC meeting.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isMeeting} onChange={(e) => setIsMeeting(e.target.checked)} />
                <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            {isMeeting && (
              <div className="space-y-1 mt-4">
                <label className="text-sm font-medium text-surface-700">Meeting Type</label>
                <select
                  className="w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                >
                  <option value="video">Video Call</option>
                  <option value="audio">Audio Call</option>
                </select>
              </div>
            )}
          </>
        )}

        {type === 'reminder' && (
          <Input
            label="Reminder Date Time"
            type="datetime-local"
            value={reminderDateTime}
            onChange={(e) => setReminderDateTime(e.target.value)}
          />
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Create scheduled item
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const EventDetailModal = ({ isOpen, onClose, event, onSaveSuccess }) => {
  const dispatch = useDispatch();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [context, setContext] = useState('work');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (isOpen && event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setContext(event.context || 'work');
      setLocation(event.location || '');
      
      const formatDT = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';
      setStartDateTime(formatDT(event.startDateTime));
      setEndDateTime(formatDT(event.endDateTime));
    }
  }, [isOpen, event]);

  const handleUpdate = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      const payload = {
        title,
        description,
        context,
        startDateTime,
        endDateTime,
        location
      };
      await eventApi.updateEvent(event._id, payload);
      toast.success('Event updated successfully');
      onSaveSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update event');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventApi.deleteEvent(event._id);
        toast.success('Event deleted successfully');
        onSaveSuccess();
        onClose();
      } catch (err) {
        toast.error('Failed to delete event');
      }
    }
  };

  if (!event) return null;

  const handleJoinMeeting = () => {
    if (event.meetingId) {
      dispatch(joinMeeting({ meeting: event.meetingId }));
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={event.title}>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="space-y-1">
            <label className="text-sm font-medium text-surface-700">Description</label>
            <textarea
              className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 custom-scrollbar"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date Time"
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
            />
            <Input
              label="End Date Time"
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
            />
          </div>

          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="w-full md:w-48 space-y-4 shrink-0">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Context</label>
            <select
              className="w-full rounded bg-surface-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            >
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="study">Study</option>
              <option value="health">Health</option>
              <option value="finance">Finance</option>
              <option value="family">Family</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="pt-4 border-t border-surface-200 space-y-2">
            {event.meetingId && (
              <Button className="w-full justify-center bg-primary-600 hover:bg-primary-500" onClick={handleJoinMeeting}>
                <Video className="mr-2 h-4 w-4" />
                Join Meeting
              </Button>
            )}
            <Button className="w-full justify-start" size="sm" onClick={handleUpdate}>
              <Save className="mr-2 h-4 w-4" />
              Save Event
            </Button>
            <Button variant="danger" className="w-full justify-start" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Event
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const ReminderDetailModal = ({ isOpen, onClose, reminder, onSaveSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [context, setContext] = useState('personal');
  const [reminderDateTime, setReminderDateTime] = useState('');

  useEffect(() => {
    if (isOpen && reminder) {
      setTitle(reminder.title || '');
      setDescription(reminder.description || '');
      setContext(reminder.context || 'personal');
      
      const formatDT = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';
      setReminderDateTime(formatDT(reminder.reminderDateTime));
    }
  }, [isOpen, reminder]);

  const handleUpdate = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      const payload = {
        title,
        description,
        context,
        reminderDateTime
      };
      await reminderApi.updateReminder(reminder._id, payload);
      toast.success('Reminder updated successfully');
      onSaveSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update reminder');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        await reminderApi.deleteReminder(reminder._id);
        toast.success('Reminder deleted successfully');
        onSaveSuccess();
        onClose();
      } catch (err) {
        toast.error('Failed to delete reminder');
      }
    }
  };

  const handleToggleComplete = async () => {
    try {
      await reminderApi.toggleReminderComplete(reminder._id);
      toast.success('Reminder status updated');
      onSaveSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (!reminder) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={reminder.title}>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="space-y-1">
            <label className="text-sm font-medium text-surface-700">Description</label>
            <textarea
              className="w-full rounded-md border border-surface-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 custom-scrollbar"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Input
            label="Reminder Date Time"
            type="datetime-local"
            value={reminderDateTime}
            onChange={(e) => setReminderDateTime(e.target.value)}
          />
        </div>

        <div className="w-full md:w-48 space-y-4 shrink-0">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Context</label>
            <select
              className="w-full rounded bg-surface-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            >
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="study">Study</option>
              <option value="health">Health</option>
              <option value="finance">Finance</option>
              <option value="family">Family</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="pt-4 border-t border-surface-200 space-y-2">
            <Button className="w-full justify-start" size="sm" onClick={handleToggleComplete}>
              <Check className="mr-2 h-4 w-4" />
              {reminder.isCompleted ? 'Mark Active' : 'Mark Completed'}
            </Button>
            <Button className="w-full justify-start" size="sm" onClick={handleUpdate}>
              <Save className="mr-2 h-4 w-4" />
              Save Reminder
            </Button>
            <Button variant="danger" className="w-full justify-start" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Reminder
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
