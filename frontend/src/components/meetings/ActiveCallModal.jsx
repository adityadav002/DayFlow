import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp, MessageSquare } from 'lucide-react';
import { leaveMeeting, setMeetingConnected, toggleLocalAudio, toggleLocalVideo, setScreenSharing } from '../../redux/slices/meetingSlice';
import webrtcService from '../../services/webrtcService';
import api from '../../api/axiosInstance';
import useSocket from '../../hooks/useSocket';
import MeetingChatPanel from './MeetingChatPanel';

const ActiveCallModal = () => {
  const dispatch = useDispatch();
  const { activeMeeting, callStatus, isLocalAudioMuted, isLocalVideoMuted, isScreenSharing, participants } = useSelector(state => state.meeting);
  const { socket } = useSocket();
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (activeMeeting && (callStatus === 'connecting' || callStatus === 'connected')) {
      const initCall = async () => {
        try {
          // Fetch ICE Config
          const { data } = await api.get('/meetings/ice-config');
          webrtcService.setIceServers(data.iceServers);

          // Setup Service
          webrtcService.setup(socket, dispatch, null);
          webrtcService.meetingId = activeMeeting._id;

          // Start Local Media
          const isVideoCall = activeMeeting.type === 'video';
          const stream = await webrtcService.startLocalMedia(isVideoCall, true);
          setLocalStream(stream);

          // Register callbacks
          webrtcService.onRemoteStreamAdded = (peerId, remoteStream) => {
            setRemoteStreams(prev => new Map(prev).set(peerId, remoteStream));
          };
          
          webrtcService.onRemoteStreamRemoved = (peerId) => {
            setRemoteStreams(prev => {
              const next = new Map(prev);
              next.delete(peerId);
              return next;
            });
          };

          // Join Socket Room
          socket.emit('meeting:join', { meetingId: activeMeeting._id });
          dispatch(setMeetingConnected());

        } catch (error) {
          console.error('Failed to initialize call:', error);
          handleEndCall();
        }
      };

      initCall();
    }
  }, [activeMeeting, callStatus]);

  useEffect(() => {
    webrtcService.toggleLocalAudio(isLocalAudioMuted);
    socket?.emit('meeting:media_state', {
      meetingId: activeMeeting?._id,
      state: { audio: !isLocalAudioMuted, video: !isLocalVideoMuted, screen: isScreenSharing }
    });
  }, [isLocalAudioMuted, isScreenSharing]);

  useEffect(() => {
    webrtcService.toggleLocalVideo(isLocalVideoMuted);
    socket?.emit('meeting:media_state', {
      meetingId: activeMeeting?._id,
      state: { audio: !isLocalAudioMuted, video: !isLocalVideoMuted, screen: isScreenSharing }
    });
  }, [isLocalVideoMuted, isScreenSharing]);

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      webrtcService.stopScreenShare();
      dispatch(setScreenSharing(false));
    } else {
      try {
        await webrtcService.startScreenShare(() => {
          // Callback fired on 'ended' event from browser
          dispatch(setScreenSharing(false));
        });
        dispatch(setScreenSharing(true));
      } catch (error) {
        console.error('Failed to start screen share', error);
      }
    }
  };

  const handleEndCall = async () => {
    if (activeMeeting) {
      try {
        await api.post(`/meetings/${activeMeeting._id}/leave`);
      } catch (err) {
        console.error(err);
      }
    }
    webrtcService.leaveMeeting();
    dispatch(leaveMeeting());
  };

  if (!activeMeeting || (callStatus !== 'connecting' && callStatus !== 'connected')) {
    return null;
  }

  // Calculate grid layout classes based on total streams (remote + 1 local)
  const totalStreams = remoteStreams.size + 1;
  const gridClass = 
    totalStreams === 1 ? 'grid-cols-1 grid-rows-1' :
    totalStreams === 2 ? 'grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1' :
    totalStreams <= 4 ? 'grid-cols-2 grid-rows-2' :
    totalStreams <= 6 ? 'grid-cols-3 grid-rows-2' :
    'grid-cols-3 grid-rows-3';

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-900 overflow-hidden">
      
      {/* Video Grid Area */}
      <div className={`flex-1 relative transition-all duration-300 ${isChatOpen ? 'mr-0' : ''}`}>
        
        <div className={`w-full h-full p-4 grid gap-4 ${gridClass}`}>
          {/* Local Video */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-800 shadow-xl border border-gray-700/50">
            <video
              ref={(node) => { if (node && localStream) node.srcObject = localStream; }}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-white text-sm font-medium flex items-center">
              You
              {isLocalAudioMuted && <MicOff className="h-4 w-4 ml-2 text-red-500" />}
            </div>
          </div>

          {/* Remote Videos */}
          {Array.from(remoteStreams.entries()).map(([peerId, stream]) => {
            const peer = participants.find(p => p.userId === peerId);
            return (
              <div key={peerId} className="relative rounded-2xl overflow-hidden bg-gray-800 shadow-xl border border-gray-700/50">
                <video
                  ref={(node) => { if (node) node.srcObject = stream; }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-white text-sm font-medium flex items-center">
                  {peer ? 'Participant' : 'Joining...'}
                  {peer?.audio === false && <MicOff className="h-4 w-4 ml-2 text-red-500" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {remoteStreams.size === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-gray-800/80 backdrop-blur-md px-6 py-4 rounded-2xl text-center shadow-2xl border border-gray-700">
              <div className="w-12 h-12 border-4 border-t-primary-500 border-gray-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-white font-medium">Waiting for others to join...</p>
            </div>
          </div>
        )}

        {/* Call Controls Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-4 bg-gray-800/90 backdrop-blur-md px-8 py-4 rounded-2xl shadow-2xl border border-gray-700 z-20">
        
        <button 
          onClick={() => dispatch(toggleLocalAudio())}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${isLocalAudioMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
        >
          {isLocalAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        <button 
          onClick={() => dispatch(toggleLocalVideo())}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${isLocalVideoMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
        >
          {isLocalVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </button>

        {/* Screen Share */}
        <button 
          onClick={handleToggleScreenShare}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${isScreenSharing ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
          title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
        >
          <MonitorUp className="h-5 w-5" />
        </button>

        <div className="w-px h-8 bg-gray-700 mx-2" />

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${isChatOpen ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
          title="Toggle Chat"
        >
          <MessageSquare className="h-5 w-5" />
        </button>

        <button 
          onClick={handleEndCall}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 ml-2"
        >
          <PhoneOff className="h-6 w-6" />
        </button>

      </div>
      </div>

      {/* Chat Sidebar */}
      {isChatOpen && (
        <MeetingChatPanel meetingId={activeMeeting._id} onClose={() => setIsChatOpen(false)} />
      )}
    </div>
  );
};

export default ActiveCallModal;
