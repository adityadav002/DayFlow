import React from 'react';
import { Calendar, Clock, MapPin, User } from 'lucide-react';

const EventsPage = () => {
  const dummyEvents = [
    { id: 1, title: 'Milestone 1 Kickoff Meeting', time: '10:00 AM - 11:00 AM', location: 'Zoom', context: 'work' },
    { id: 2, title: 'Gym Workout Session', time: '06:00 PM - 07:30 PM', location: 'Fitness First', context: 'health' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Events</h1>
          <p className="text-sm text-surface-500">Scheduled calendar events and meetings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dummyEvents.map(event => (
          <div key={event.id} className="p-4 bg-white rounded-lg border border-surface-200 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-surface-900">{event.title}</h3>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-primary-50 text-primary-700 capitalize">{event.context}</span>
            </div>
            <div className="space-y-1.5 text-sm text-surface-600">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-surface-400" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-surface-400" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventsPage;
