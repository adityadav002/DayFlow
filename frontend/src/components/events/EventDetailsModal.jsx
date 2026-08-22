import React from 'react';
import { useDispatch } from 'react-redux';
import { deleteEvent } from '../../redux/slices/eventSlice';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { format, parseISO } from 'date-fns';
import { Clock, MapPin, Video, AlignLeft, Users, Calendar, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const EventDetailsModal = ({ isOpen, onClose, event }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!event) return null;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await dispatch(deleteEvent(event._id)).unwrap();
        toast.success('Event deleted');
        onClose();
      } catch (err) {
        toast.error(err || 'Failed to delete event');
      }
    }
  };

  const handleJoinMeeting = () => {
    if (event.meetingId) {
      navigate(`/meetings/${event.meetingId._id || event.meetingId}`);
      onClose();
    }
  };

  const startDate = parseISO(event.startDateTime);
  const endDate = parseISO(event.endDateTime);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Event Details">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-surface-900">{event.title}</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize mt-2">
            {event.context}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-start text-sm text-surface-600">
            <Calendar className="h-5 w-5 mr-3 text-surface-400 shrink-0" />
            <div>
              <p className="font-medium text-surface-900">{format(startDate, 'EEEE, MMMM d, yyyy')}</p>
              <p>{format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}</p>
            </div>
          </div>

          {(event.location || event.meetingId) && (
            <div className="flex items-center text-sm text-surface-600">
              {event.meetingId ? (
                <>
                  <Video className="h-5 w-5 mr-3 text-primary-500 shrink-0" />
                  <div>
                    <p className="font-medium text-surface-900">Video Meeting</p>
                    <button onClick={handleJoinMeeting} className="text-primary-600 hover:underline font-medium mt-0.5">
                      Join Meeting Now
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <MapPin className="h-5 w-5 mr-3 text-surface-400 shrink-0" />
                  <span className="font-medium text-surface-900">{event.location}</span>
                </>
              )}
            </div>
          )}

          {event.description && (
            <div className="flex items-start text-sm text-surface-600">
              <AlignLeft className="h-5 w-5 mr-3 text-surface-400 shrink-0 mt-0.5" />
              <p className="whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {event.participants && event.participants.length > 0 && (
            <div className="flex items-start text-sm text-surface-600">
              <Users className="h-5 w-5 mr-3 text-surface-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-surface-900 mb-1">Participants</p>
                <div className="flex flex-wrap gap-2">
                  {event.participants.map(p => (
                    <div key={p._id} className="flex items-center bg-surface-100 rounded-full pr-3 pl-1 py-1">
                      {p.avatar ? (
                        <img src={p.avatar} alt={p.name} className="h-6 w-6 rounded-full mr-2 object-cover" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs mr-2">
                          {p.name?.charAt(0)}
                        </div>
                      )}
                      <span className="text-xs font-medium">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-surface-200 mt-6">
          <button
            onClick={handleDelete}
            className="flex items-center text-sm font-medium text-red-600 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Delete
          </button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default EventDetailsModal;
