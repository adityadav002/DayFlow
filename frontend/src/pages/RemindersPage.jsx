import React from 'react';
import { Bell, CheckCircle, Clock } from 'lucide-react';

const RemindersPage = () => {
  const dummyReminders = [
    { id: 1, title: 'Call Mom', time: '08:00 PM', completed: false, context: 'family' },
    { id: 2, title: 'Renew Domain name', time: 'Tomorrow, 09:00 AM', completed: true, context: 'finance' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Reminders</h1>
        <p className="text-sm text-surface-500">Lightweight, personal push notifications and alerts</p>
      </div>

      <div className="space-y-3">
        {dummyReminders.map(reminder => (
          <div key={reminder.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-surface-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <CheckCircle className={`h-5 w-5 ${reminder.completed ? 'text-green-500' : 'text-surface-300'}`} />
              <div>
                <h3 className={`font-medium ${reminder.completed ? 'line-through text-surface-400' : 'text-surface-900'}`}>{reminder.title}</h3>
                <div className="flex items-center space-x-1.5 text-xs text-surface-500 mt-0.5">
                  <Clock className="h-3 w-3" />
                  <span>{reminder.time}</span>
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-surface-100 text-surface-700 capitalize">{reminder.context}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RemindersPage;
