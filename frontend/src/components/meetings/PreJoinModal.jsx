import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Mic, MicOff, Video, VideoOff, X } from 'lucide-react';
import { leaveMeeting, confirmJoinMeeting, toggleLocalAudio, toggleLocalVideo } from '../../redux/slices/meetingSlice';
import Button from '../common/Button';
import api from '../../api/axiosInstance';
import webrtcService from '../../services/webrtcService';

const PreJoinModal = () => {
  const dispatch = useDispatch();
  const { activeMeeting, callStatus, isLocalAudioMuted, isLocalVideoMuted } = useSelector(state => state.meeting);
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (callStatus === 'pre_join') {
      const getMedia = async () => {
        try {
          // Always request both so they can be toggled easily
          const stream = await webrtcService.startLocalMedia(true, true);
          if (isMounted) {
            setStream(stream);
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          }
        } catch (error) {
          console.error('Error accessing media in pre-join:', error);
        }
      };
      getMedia();
    }

    return () => {
      isMounted = false;
    };
  }, [callStatus]); // Removed mute dependencies so stream doesn't fully restart on toggle

  useEffect(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !isLocalVideoMuted;
      
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = !isLocalAudioMuted;
    }
  }, [isLocalAudioMuted, isLocalVideoMuted, stream]);

  if (callStatus !== 'pre_join') return null;

  const handleJoin = () => {
    dispatch(confirmJoinMeeting());
  };

  const handleCancel = async () => {
    try {
      await api.post(`/meetings/${activeMeeting._id}/leave`);
    } catch (e) {
      console.error(e);
    }
    webrtcService.stopLocalMedia();
    dispatch(leaveMeeting());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-surface-900 rounded-3xl overflow-hidden shadow-2xl max-w-3xl w-full mx-4 border border-surface-700 relative">
        <button 
          onClick={handleCancel}
          className="absolute top-6 right-6 p-2 rounded-full bg-surface-800 text-surface-400 hover:text-white transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8 md:p-12 flex flex-col items-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{activeMeeting?.title}</h2>
          <p className="text-surface-400 mb-8">Choose your audio and video settings before joining</p>

          <div className="relative w-full max-w-2xl aspect-video bg-black rounded-2xl overflow-hidden mb-8 shadow-inner border border-surface-800">
            {isLocalVideoMuted ? (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-800">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-surface-700 flex items-center justify-center mx-auto mb-4">
                    <VideoOff className="h-10 w-10 text-surface-400" />
                  </div>
                  <p className="text-surface-400 font-medium">Camera is off</p>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-4 bg-surface-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-surface-700">
              <button
                onClick={() => dispatch(toggleLocalAudio())}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                  isLocalAudioMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-surface-700 text-white hover:bg-surface-600'
                }`}
              >
                {isLocalAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <button
                onClick={() => dispatch(toggleLocalVideo())}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                  isLocalVideoMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-surface-700 text-white hover:bg-surface-600'
                }`}
              >
                {isLocalVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button 
            onClick={handleJoin} 
            className="w-full max-w-md h-14 text-lg font-semibold rounded-xl bg-primary-600 hover:bg-primary-500"
          >
            Join Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PreJoinModal;
