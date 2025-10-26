# Video Call System - Complete Refactor

## Overview

This is a **complete refactor** of the video call system with a clean, production-ready architecture.

### Key Improvements

1. ✅ **Simplified Architecture** - Two focused hooks instead of multiple scattered ones
2. ✅ **Proper WebRTC Management** - Single peer connection, proper cleanup
3. ✅ **Reliable Signaling** - Clear socket event flow
4. ✅ **Better Error Handling** - User-friendly feedback
5. ✅ **Clean State Management** - Redux for call state, local state for media
6. ✅ **Proper Async Handling** - No race conditions
7. ✅ **Production Ready** - Logging, error recovery, cleanup

---

## Architecture

### New Hook Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      useVideoCall                            │
│  (Call Management - High Level)                              │
│                                                               │
│  - Start/Accept/Reject/End calls                            │
│  - Socket event handling                                     │
│  - Redux state management                                    │
│  - Navigation                                                │
│                                                               │
│  Uses ↓                                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      useWebRTC                               │
│  (WebRTC Management - Low Level)                             │
│                                                               │
│  - Peer connection management                                │
│  - Media stream handling                                     │
│  - SDP offer/answer                                          │
│  - ICE candidate exchange                                    │
│  - Media controls (mute, video, screen share)               │
└─────────────────────────────────────────────────────────────┘
```

---

## New Files

### 1. `useWebRTCRefactored.js`

**Purpose:** Low-level WebRTC management

**Features:**
- Single peer connection (1-on-1 calls)
- Proper media initialization
- ICE candidate queuing
- Track management
- Media controls
- Clean cleanup

**Key Functions:**
```javascript
{
  // State
  localStream,
  remoteStream,
  connectionState,
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  
  // Actions
  initializeMedia,
  createOffer,
  toggleMute,
  toggleVideo,
  startScreenShare,
  stopScreenShare,
  cleanup
}
```

---

### 2. `useVideoCall.js`

**Purpose:** High-level call management

**Features:**
- Call lifecycle management
- Socket event handling
- Redux integration
- Navigation
- Error handling

**Key Functions:**
```javascript
{
  // State
  activeCall,
  incomingCall,
  outgoingCall,
  callStatus,
  localStream,
  remoteStream,
  
  // Controls
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  toggleMute,
  toggleVideo,
  startScreenShare,
  stopScreenShare,
  
  // Actions
  startCall,
  acceptCall,
  rejectCall,
  endCall
}
```

---

## Call Flow

### Starting a Call

```
User A clicks "Call" button
         ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. startCall({ participants: [UserB._id] })                 │
├─────────────────────────────────────────────────────────────┤
│    ├─ Call API: POST /api/v1/call/start                    │
│    ├─ Get call object with callId                          │
│    ├─ dispatch(setOutgoingCall(call))                      │
│    ├─ dispatch(setActiveCall(call))                        │
│    ├─ dispatch(setCallStatus('outgoing'))                  │
│    ├─ await initializeMedia()  ← Get camera/mic           │
│    │   └─ navigator.mediaDevices.getUserMedia()           │
│    └─ socket.emit('call:join', { callId, userId })        │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Backend emits to User B                                   │
├─────────────────────────────────────────────────────────────┤
│    socket.to(UserB).emit('call:incoming', {                 │
│      callId,                                                 │
│      fromUserId: UserA._id,                                 │
│      fromUserName: "Alice"                                  │
│    })                                                        │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. User B receives incoming call                             │
├─────────────────────────────────────────────────────────────┤
│    ├─ handleIncomingCall(data)                             │
│    ├─ dispatch(setIncomingCall(data))                      │
│    ├─ dispatch(setCallStatus('incoming'))                  │
│    └─ Show IncomingCallModal                               │
└─────────────────────────────────────────────────────────────┘
```

### Accepting a Call

```
User B clicks "Accept"
         ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. acceptCall(callId)                                        │
├─────────────────────────────────────────────────────────────┤
│    ├─ Call API: POST /api/v1/call/:callId/join            │
│    ├─ dispatch(setActiveCall(call))                        │
│    ├─ dispatch(setIncomingCall(null))                      │
│    ├─ dispatch(setCallStatus('connected'))                 │
│    ├─ await initializeMedia()  ← Get camera/mic           │
│    ├─ socket.emit('call:join', { callId, userId })        │
│    └─ navigate('/video-call')                              │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Backend notifies User A                                   │
├─────────────────────────────────────────────────────────────┤
│    socket.to(UserA).emit('call:accepted', { callId })       │
│    socket.to(UserA).emit('call:user-joined', { userId: UserB })│
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. User A receives call:accepted                             │
├─────────────────────────────────────────────────────────────┤
│    ├─ handleCallAccepted()                                  │
│    ├─ dispatch(setCallStatus('connected'))                  │
│    └─ createOffer()  ← Start WebRTC                        │
└─────────────────────────────────────────────────────────────┘
```

### WebRTC Connection

```
User A creates offer
         ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. createOffer()                                             │
├─────────────────────────────────────────────────────────────┤
│    ├─ createPeerConnection()                                │
│    │   ├─ new RTCPeerConnection()                          │
│    │   ├─ Add local tracks                                 │
│    │   └─ Setup event handlers                             │
│    ├─ pc.createOffer()                                      │
│    ├─ pc.setLocalDescription(offer)                         │
│    └─ socket.emit('webrtc:offer', { callId, offer })       │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. User B receives offer                                     │
├─────────────────────────────────────────────────────────────┤
│    ├─ handleOffer(offer)                                    │
│    ├─ createPeerConnection()                                │
│    ├─ pc.setRemoteDescription(offer)                        │
│    ├─ pc.createAnswer()                                     │
│    ├─ pc.setLocalDescription(answer)                        │
│    └─ socket.emit('webrtc:answer', { callId, answer })     │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. User A receives answer                                    │
├─────────────────────────────────────────────────────────────┤
│    ├─ handleAnswer(answer)                                  │
│    └─ pc.setRemoteDescription(answer)                       │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. ICE candidates exchanged                                  │
├─────────────────────────────────────────────────────────────┤
│    Both users:                                               │
│    ├─ pc.onicecandidate fires                              │
│    ├─ socket.emit('webrtc:ice-candidate', { candidate })   │
│    └─ Other user adds candidate                            │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Connection established                                    │
├─────────────────────────────────────────────────────────────┤
│    ├─ pc.ontrack fires                                      │
│    ├─ Receive remote stream                                │
│    ├─ setRemoteStream(stream)                              │
│    └─ Video displays! ✅                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Socket Events

### Call Events (Backend must implement)

```javascript
// Outgoing (Frontend → Backend)
socket.emit('call:join', { callId, userId })
socket.emit('call:leave', { callId, userId })
socket.emit('call:reject', { callId, userId })

// Incoming (Backend → Frontend)
socket.on('call:incoming', { callId, fromUserId, fromUserName, fromUserAvatar })
socket.on('call:accepted', { callId })
socket.on('call:rejected', { callId })
socket.on('call:ended', { callId })
socket.on('call:user-joined', { userId, user })
```

### WebRTC Events

```javascript
// Outgoing (Frontend → Backend)
socket.emit('webrtc:offer', { callId, offer })
socket.emit('webrtc:answer', { callId, answer })
socket.emit('webrtc:ice-candidate', { callId, candidate })

// Incoming (Backend → Frontend)
socket.on('webrtc:offer', { offer })
socket.on('webrtc:answer', { answer })
socket.on('webrtc:ice-candidate', { candidate })
```

---

## Usage Example

### In a Component

```javascript
import { useVideoCall } from '../hook/useVideoCall';

function ChatPage() {
  const {
    // State
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    callStatus,
    
    // Controls
    isMuted,
    isVideoEnabled,
    toggleMute,
    toggleVideo,
    
    // Actions
    startCall,
    acceptCall,
    rejectCall,
    endCall
  } = useVideoCall();
  
  const handleStartCall = async () => {
    try {
      await startCall({
        participants: [otherUserId],
        type: 'one-to-one',
        chatId: currentChatId
      });
      navigate('/video-call');
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };
  
  const handleAcceptCall = async () => {
    try {
      await acceptCall(incomingCall.callId);
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };
  
  return (
    <div>
      {/* Call button */}
      <button onClick={handleStartCall}>
        Start Call
      </button>
      
      {/* Incoming call modal */}
      {incomingCall && (
        <IncomingCallModal
          caller={incomingCall.fromUserName}
          onAccept={handleAcceptCall}
          onReject={() => rejectCall(incomingCall.callId)}
        />
      )}
      
      {/* Active call */}
      {activeCall && (
        <VideoCallInterface
          localStream={localStream}
          remoteStream={remoteStream}
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onEndCall={endCall}
        />
      )}
    </div>
  );
}
```

---

## Backend Requirements

### Socket Event Handlers Needed

```javascript
// backend/src/socket/callHandlers.js

// User joins call room
socket.on('call:join', async ({ callId, userId }) => {
  // Join socket room
  socket.join(`call:${callId}`);
  
  // Notify others
  socket.to(`call:${callId}`).emit('call:user-joined', {
    userId,
    user: socket.user
  });
});

// User leaves call
socket.on('call:leave', async ({ callId, userId }) => {
  socket.leave(`call:${callId}`);
  socket.to(`call:${callId}`).emit('call:ended', { callId });
});

// User rejects call
socket.on('call:reject', async ({ callId, userId }) => {
  socket.to(`call:${callId}`).emit('call:rejected', { callId });
});

// WebRTC signaling - relay to other peer
socket.on('webrtc:offer', ({ callId, offer }) => {
  socket.to(`call:${callId}`).emit('webrtc:offer', { offer });
});

socket.on('webrtc:answer', ({ callId, answer }) => {
  socket.to(`call:${callId}`).emit('webrtc:answer', { answer });
});

socket.on('webrtc:ice-candidate', ({ callId, candidate }) => {
  socket.to(`call:${callId}`).emit('webrtc:ice-candidate', { candidate });
});
```

---

## Migration Steps

### Step 1: Update Backend Socket Events

Update your backend to use the new event names:
- `call:join` instead of `join_call`
- `call:incoming` instead of `incoming_call`
- `webrtc:offer` instead of `sdp_offer`
- `webrtc:answer` instead of `sdp_answer`
- `webrtc:ice-candidate` instead of `ice_candidate`

### Step 2: Update Frontend Components

Replace old hooks with new one:

**Before:**
```javascript
import { useCall } from '../hook/useCallIntegration';
import { useWebRTC } from '../hook/useWebRTC';

const { startCall, acceptCall, endCall } = useCall();
const { localStream, remoteStream } = useWebRTC();
```

**After:**
```javascript
import { useVideoCall } from '../hook/useVideoCall';

const {
  startCall,
  acceptCall,
  endCall,
  localStream,
  remoteStream,
  toggleMute,
  toggleVideo
} = useVideoCall();
```

### Step 3: Update VideoCall Page

```javascript
// pages/VideoCall.jsx
import { useVideoCall } from '../hook/useVideoCall';

export default function VideoCall() {
  const {
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    toggleMute,
    toggleVideo,
    endCall
  } = useVideoCall();
  
  return (
    <VideoCallInterface
      localStream={localStream}
      remoteStream={remoteStream}
      isMuted={isMuted}
      isVideoEnabled={isVideoEnabled}
      onToggleMute={toggleMute}
      onToggleVideo={toggleVideo}
      onEndCall={endCall}
    />
  );
}
```

---

## Features Included

### ✅ Basic Features

1. **Start Call** - Initiate 1-on-1 video call
2. **Accept Call** - Answer incoming call
3. **Reject Call** - Decline incoming call
4. **End Call** - Terminate active call
5. **Mute/Unmute** - Toggle microphone
6. **Video On/Off** - Toggle camera
7. **Screen Share** - Share screen (optional)

### ✅ Technical Features

1. **Proper Cleanup** - No memory leaks
2. **Error Handling** - User-friendly messages
3. **State Management** - Redux + Local state
4. **Logging** - Comprehensive console logs
5. **ICE Candidate Queuing** - Handle race conditions
6. **Connection Recovery** - Handle network issues

---

## Testing Checklist

### Test 1: Basic Call
- [ ] User A starts call
- [ ] User B receives incoming call notification
- [ ] User B accepts call
- [ ] Both users see each other's video
- [ ] Both users hear each other's audio
- [ ] Call controls work (mute, video)
- [ ] End call works

### Test 2: Call Rejection
- [ ] User A starts call
- [ ] User B receives notification
- [ ] User B rejects call
- [ ] User A gets rejection notification
- [ ] Both users return to normal state

### Test 3: Media Controls
- [ ] Mute/unmute microphone
- [ ] Turn video on/off
- [ ] Start/stop screen share
- [ ] All changes reflect on remote side

### Test 4: Error Handling
- [ ] Deny camera/microphone permission
- [ ] Get appropriate error message
- [ ] Network disconnection during call
- [ ] Proper cleanup on errors

---

## Console Output

### Successful Call

```
📞 Starting call...
✅ Call created: call123
🎬 Requesting media access...
✅ Media access granted
📊 Tracks: video (camera), audio (microphone)
🔌 Joining call room...
👥 User joined call: userB
🤝 Creating peer connection...
➕ Adding video track to peer connection
➕ Adding audio track to peer connection
📤 Creating offer...
✅ Offer created, sending to peer
📥 Received answer
✅ Answer set successfully
🧊 Sending ICE candidate
🧊 Adding ICE candidate
🔗 Connection state: connected
✅ Peer connection established
📹 Received remote track: video
📹 Received remote track: audio
✅ Remote stream received
```

---

## Summary

### What's New

1. ✅ **Two focused hooks** instead of multiple scattered ones
2. ✅ **Clean WebRTC implementation** with proper peer connection management
3. ✅ **Simplified state management** - Redux for call state, local for media
4. ✅ **Better async handling** - No race conditions
5. ✅ **Comprehensive logging** - Easy debugging
6. ✅ **Proper cleanup** - No memory leaks
7. ✅ **Production ready** - Error handling, recovery, user feedback

### Benefits

- 🚀 **Faster development** - Simple API, easy to use
- 🐛 **Easier debugging** - Clear logs, predictable flow
- 💪 **More reliable** - Proper error handling, cleanup
- 📱 **Better UX** - User-friendly error messages
- 🔧 **Maintainable** - Clean code, good separation of concerns

**This refactor provides a solid foundation for your video call feature!** 🎯
