import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { PhoneCall, Phone, PhoneOff } from 'lucide-react';
import { clearIncomingCall, joinMeeting } from '../../redux/slices/meetingSlice';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

const IncomingCallOverlay = () => {
  const dispatch = useDispatch();
  const { incomingCall, callStatus } = useSelector((state) => state.meeting);

  if (!incomingCall || callStatus !== 'ringing') return null;

  const handleAccept = async () => {
    try {
      const { data } = await api.post(`/meetings/${incomingCall.meetingId}/accept`);
      dispatch(joinMeeting({ meeting: { _id: incomingCall.meetingId, title: incomingCall.title, host: incomingCall.caller, type: incomingCall.type } }));
    } catch (error) {
      toast.error('Failed to accept call');
      dispatch(clearIncomingCall());
    }
  };

  const handleDecline = async () => {
    try {
      await api.post(`/meetings/${incomingCall.meetingId}/decline`);
    } catch (error) {
      console.error(error);
    } finally {
      dispatch(clearIncomingCall());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-80 p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mb-4 animate-bounce">
          <PhoneCall className="h-10 w-10" />
        </div>
        
        <h2 className="text-xl font-bold text-surface-900">Incoming {incomingCall.type === 'video' ? 'Video' : 'Audio'} Call</h2>
        <p className="text-surface-500 mt-1">{incomingCall.title || 'Meeting'}</p>
        
        <div className="mt-8 flex w-full justify-center space-x-6">
          <button
            onClick={handleDecline}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors shadow-sm"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
          
          <button
            onClick={handleAccept}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm animate-pulse"
          >
            <Phone className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallOverlay;
