class WebRTCService {
  constructor() {
    this.peers = new Map(); // userId -> RTCPeerConnection
    this.localStream = null;
    this.screenStream = null;
    this.remoteStreams = new Map(); // userId -> MediaStream
    this.socket = null;
    this.dispatch = null;
    this.userId = null;
    this.meetingId = null;
    
    // Store callbacks for UI to subscribe to stream events
    this.onRemoteStreamAdded = null;
    this.onRemoteStreamRemoved = null;
    this.onLocalStreamReady = null;

    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
    ];
  }

  // Inject dependencies
  setup(socket, dispatch, userId) {
    this.socket = socket;
    this.dispatch = dispatch;
    this.userId = userId;

    // Listen for WebRTC signals from server
    this.socket.on('webrtc:signal', this.handleSignal.bind(this));
  }

  setIceServers(servers) {
    if (servers && servers.length > 0) {
      this.iceServers = servers;
    }
  }

  async startLocalMedia(video = true, audio = true) {
    if (this.localStream) {
      if (this.onLocalStreamReady) {
        this.onLocalStreamReady(this.localStream);
      }
      return this.localStream;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video, audio });
      if (this.onLocalStreamReady) {
        this.onLocalStreamReady(this.localStream);
      }
      return this.localStream;
    } catch (error) {
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.error('HTTPS is required to access media devices in production environments.');
        throw new Error('Camera and Microphone access requires a secure HTTPS connection.');
      }
      console.warn('Error accessing media devices:', error);
      
      // Fallback strategy for "Device in use" or permission denied
      if (video && audio) {
        try {
          console.log('Attempting fallback to audio only...');
          this.localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        } catch (audioErr) {
          console.warn('Audio-only fallback also failed, proceeding with no media', audioErr);
          this.localStream = new MediaStream();
        }
      } else {
        console.warn('Proceeding with no media');
        this.localStream = new MediaStream();
      }
      
      if (this.onLocalStreamReady) {
        this.onLocalStreamReady(this.localStream);
      }
      return this.localStream;
    }
  }

  stopLocalMedia() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    this.stopScreenShare();
  }

  async startScreenShare(onEndedCallback) {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = this.screenStream.getVideoTracks()[0];
      
      screenTrack.onended = () => {
        this.stopScreenShare();
        if (onEndedCallback) onEndedCallback();
      };

      // Replace video track for all peers
      this.peers.forEach((peerConnection) => {
        const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });

      if (this.onLocalStreamReady) {
        // Create a mixed stream for local preview if needed, or just emit screen stream
        this.onLocalStreamReady(this.screenStream);
      }
      return this.screenStream;
    } catch (err) {
      console.error('Error starting screen share:', err);
      throw err;
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
      
      // Revert to local camera track
      const localVideoTrack = this.localStream?.getVideoTracks()[0];
      if (localVideoTrack) {
        this.peers.forEach((peerConnection) => {
          const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(localVideoTrack);
          }
        });
      }

      if (this.onLocalStreamReady && this.localStream) {
        this.onLocalStreamReady(this.localStream);
      }
    }
  }

  toggleLocalVideo(muted) {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !muted;
      }
    }
  }

  toggleLocalAudio(muted) {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !muted;
      }
    }
  }

  // Called when we are joining a meeting and want to establish connection with a specific peer
  async connectToPeer(peerId, isInitiator) {
    if (this.peers.has(peerId)) {
      console.warn('Peer connection already exists for:', peerId);
      return;
    }

    const peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });
    this.peers.set(peerId, peerConnection);

    // Add local tracks to the peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle incoming ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('webrtc:signal', {
          targetUserId: peerId,
          meetingId: this.meetingId,
          signal: { type: 'ice_candidate', candidate: event.candidate }
        });
      }
    };

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.remoteStreams.set(peerId, remoteStream);
      if (this.onRemoteStreamAdded) {
        this.onRemoteStreamAdded(peerId, remoteStream);
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, peerConnection.connectionState);
      if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
        this.removePeer(peerId);
      }
    };

    peerConnection.oniceconnectionstatechange = async () => {
      console.log(`ICE Connection state with ${peerId}:`, peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'disconnected' || peerConnection.iceConnectionState === 'failed') {
        console.log(`Attempting ICE restart for ${peerId}`);
        try {
          const offer = await peerConnection.createOffer({ iceRestart: true });
          await peerConnection.setLocalDescription(offer);
          this.socket.emit('webrtc:signal', {
            targetUserId: peerId,
            meetingId: this.meetingId,
            signal: { type: 'offer', offer: peerConnection.localDescription }
          });
        } catch (err) {
          console.error('ICE restart failed:', err);
        }
      }
    };

    // If we are the initiator, create an offer
    if (isInitiator) {
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        this.socket.emit('webrtc:signal', {
          targetUserId: peerId,
          meetingId: this.meetingId,
          signal: { type: 'offer', offer: peerConnection.localDescription }
        });
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    }

    return peerConnection;
  }

  async handleSignal({ senderId, signal }) {
    if (signal.type === 'offer') {
      const peerConnection = await this.connectToPeer(senderId, false);
      if (!peerConnection) return;
      
      await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      this.socket.emit('webrtc:signal', {
        targetUserId: senderId,
        meetingId: this.meetingId,
        signal: { type: 'answer', answer: peerConnection.localDescription }
      });
    } else if (signal.type === 'answer') {
      const peerConnection = this.peers.get(senderId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.answer));
      }
    } else if (signal.type === 'ice_candidate') {
      const peerConnection = this.peers.get(senderId);
      if (peerConnection && signal.candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (err) {
          console.error('Error adding received ice candidate', err);
        }
      }
    }
  }

  removePeer(peerId) {
    const peerConnection = this.peers.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      this.peers.delete(peerId);
    }
    this.remoteStreams.delete(peerId);
    if (this.onRemoteStreamRemoved) {
      this.onRemoteStreamRemoved(peerId);
    }
  }

  leaveMeeting() {
    this.peers.forEach((pc, peerId) => {
      pc.close();
    });
    this.peers.clear();
    this.remoteStreams.clear();
    this.stopLocalMedia();
    this.meetingId = null;
    
    // Clear callbacks
    this.onRemoteStreamAdded = null;
    this.onRemoteStreamRemoved = null;
    this.onLocalStreamReady = null;
  }
}

export default new WebRTCService();
