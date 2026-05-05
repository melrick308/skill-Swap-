import React, { useEffect, useRef, useState } from 'react';
import { MdCallEnd } from 'react-icons/md';
import { BsMicFill, BsMicMuteFill, BsCameraVideoFill, BsCameraVideoOffFill } from 'react-icons/bs';
import { toast } from 'react-toastify';

const VideoCallModal = ({ 
  socket, 
  sessionId, 
  currentUser, 
  otherUser, 
  incomingCall, 
  onClose 
}) => {
  const [callActive, setCallActive] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callerName, setCallerName] = useState('');
  
  // Media controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);

  const pendingCandidates = useRef([]);
  
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  // STUN servers configuration
  const configuration = { 
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ] 
  };

  useEffect(() => {
    // Helper to get media with fallback
    const getMedia = async () => {
      try {
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err) {
        if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          toast.warning('Camera in use by another app/tab. Falling back to audio only!', { toastId: 'camera-use' });
          return await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        }
        throw err;
      }
    };

    getMedia()
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        // If we opened this modal actively to call someone (not receiving)
        if (!incomingCall && !callActive) {
          initiateCall(currentStream);
        } else if (incomingCall && !callAccepted) {
          setCallerName(incomingCall.name);
        }
      })
      .catch((err) => {
        console.error('Failed to get local stream', err);
        toast.error('Could not access camera/microphone: ' + err.message);
        onClose();
      });

    // Event listeners
    socket.on('callAccepted', handleCallAccepted);
    socket.on('iceCandidate', handleReceiveIceCandidate);
    socket.on('callEnded', handleCallEnded);
    socket.on('callRejected', handleCallRejected);

    return () => {
      socket.off('callAccepted', handleCallAccepted);
      socket.off('iceCandidate', handleReceiveIceCandidate);
      socket.off('callEnded', handleCallEnded);
      socket.off('callRejected', handleCallRejected);
      
      // Stop media tracks
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (connectionRef.current) {
        connectionRef.current.close();
      }
    };
  // eslint-disable-next-line
  }, []); // Run once on mount

  useEffect(() => {
    if (myVideo.current && stream) {
      myVideo.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (userVideo.current && remoteStream) {
      userVideo.current.srcObject = remoteStream;
      // Force play safely, catching generic AbortErrors
      userVideo.current.play().catch(() => {});
    }
  }, [remoteStream, callAccepted]);

  const setupPeerConnection = (currentStream) => {
    const peer = new RTCPeerConnection(configuration);
    
    // Add our stream to connection
    currentStream.getTracks().forEach((track) => {
      peer.addTrack(track, currentStream);
    });

    // Handle remote stream
    peer.ontrack = (event) => {
      // Create a fresh MediaStream instance to break React Object identity and guarantee re-rendering
      // when sequential tracks (first Audio, then Video) arrive individually.
      if (event.streams && event.streams[0]) {
        const streamClone = new MediaStream(event.streams[0].getTracks());
        setRemoteStream(streamClone);
      } else {
        const inboundStream = new MediaStream([event.track]);
        setRemoteStream(inboundStream);
      }
    };

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('iceCandidate', {
          candidate: event.candidate,
          sessionId: sessionId
        });
      }
    };

    connectionRef.current = peer;
    return peer;
  };

  const initiateCall = async (currentStream) => {
    const peer = setupPeerConnection(currentStream);
    setCallActive(true);

    try {
      const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await peer.setLocalDescription(offer);

      socket.emit('callUser', {
        userToCall: otherUser._id,
        signalData: offer,
        from: currentUser._id,
        name: currentUser.name,
        sessionId: sessionId
      });
    } catch (err) {
      console.error('Error creating offer', err);
    }
  };

  const answerCall = async () => {
    setCallAccepted(true);
    const peer = setupPeerConnection(stream);
    
    try {
      await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
      
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      // Process pending candidates
      pendingCandidates.current.forEach(c => peer.addIceCandidate(new RTCIceCandidate(c)));
      pendingCandidates.current = [];

      socket.emit('answerCall', { 
        signal: answer, 
        to: incomingCall.from,
        sessionId: sessionId 
      });
    } catch (err) {
      console.error('Error answering call', err);
    }
  };

  const handleCallAccepted = async (signal) => {
    setCallAccepted(true);
    if (connectionRef.current) {
      try {
        await connectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        
        // Process pending candidates
        pendingCandidates.current.forEach(c => connectionRef.current.addIceCandidate(new RTCIceCandidate(c)));
        pendingCandidates.current = [];
      } catch (err) {
        console.error('Error setting remote description', err);
      }
    }
  };

  const handleReceiveIceCandidate = async (candidate) => {
    if (connectionRef.current) {
      try {
        if (connectionRef.current.remoteDescription) {
          await connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingCandidates.current.push(candidate);
        }
      } catch (err) {
        console.error('Error adding received ice candidate', err);
      }
    }
  };

  const handleCallRejected = () => {
    toast.error('The user declined your video call.', { theme: 'dark' });
    handleCallEnded();
  };

  const leaveCall = () => {
    if (incomingCall && !callAccepted) {
      socket.emit('rejectCall', { 
        to: incomingCall.from, 
        sessionId 
      });
    } else {
      socket.emit('endCall', { sessionId });
    }
    handleCallEnded();
  };

  const handleCallEnded = () => {
    setCallAccepted(false);
    setCallActive(false);
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose(); // close modal
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const hasLocalVideo = stream && stream.getVideoTracks().length > 0;
  const hasRemoteVideo = remoteStream && remoteStream.getVideoTracks().length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
      <div className="w-[95%] max-w-4xl bg-gray-900 rounded-2xl shadow-2xl p-6 relative">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          {incomingCall && !callAccepted ? `Incoming call from ${callerName}...` : `Video Call with ${otherUser.name || 'User'}`}
        </h2>

        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          {/* Local Video */}
          <div className="relative w-full max-w-sm aspect-video bg-gray-800 rounded-lg border-2 border-blue-500 flex items-center justify-center overflow-hidden">
            <video 
              playsInline 
              muted 
              ref={myVideo} 
              autoPlay 
              className={`w-full h-full object-cover transform scale-x-[-1] ${(hasLocalVideo && isVideoOn) ? 'block' : 'hidden'}`} 
            />
            {(!hasLocalVideo || !isVideoOn) && (
              <span className="text-gray-400 font-semibold text-center px-4">Camera Disabled / In Use</span>
            )}
            <span className="absolute bottom-2 left-2 bg-black bg-opacity-70 px-2 py-1 text-white text-xs rounded z-10 flex items-center gap-2">
              You {!isMicOn && <BsMicMuteFill className="text-red-500" />}
            </span>
          </div>
          
          {/* Remote Video */}
          {callAccepted && (
            <div className="relative w-full max-w-sm aspect-video bg-gray-800 rounded-lg border-2 border-green-500 flex items-center justify-center overflow-hidden">
               <video 
                playsInline 
                ref={userVideo} 
                autoPlay 
                className={`w-full h-full object-cover transform scale-x-[-1] ${hasRemoteVideo ? 'block' : 'hidden'}`} 
              />
              {!hasRemoteVideo && (
                <span className="text-gray-400 font-semibold text-center px-4">Waiting for remote camera...</span>
              )}
              <span className="absolute bottom-2 left-2 bg-black bg-opacity-70 px-2 py-1 text-white text-xs rounded z-10">{otherUser.name || 'Remote'}</span>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-6">
          {incomingCall && !callAccepted ? (
            <button 
              onClick={answerCall}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full shadow-lg transition-all"
            >
              Answer Call
            </button>
          ) : (
            <>
              {/* Media Controls for active calls */}
              <button 
                onClick={toggleMic}
                className={`p-4 rounded-full shadow-lg transition-all text-white ${isMicOn ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}
                title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
              >
                {isMicOn ? <BsMicFill size={24} /> : <BsMicMuteFill size={24} />}
              </button>
              
              <button 
                onClick={toggleVideo}
                className={`p-4 rounded-full shadow-lg transition-all text-white ${isVideoOn ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}
                title={isVideoOn ? "Turn Off Camera" : "Turn On Camera"}
              >
                {isVideoOn ? <BsCameraVideoFill size={24} /> : <BsCameraVideoOffFill size={24} />}
              </button>
            </>
          )}
          
          <button 
            onClick={leaveCall}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-lg transition-all"
          >
            <MdCallEnd size={24} />
            {incomingCall && !callAccepted ? 'Decline' : 'End Call'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
