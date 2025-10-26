# Video Call Black Screen Fix

## Problem
Getting black screen instead of video in video call route.

## Root Cause
Socket event name mismatch between frontend and backend:
- **Frontend was sending:** `join-call` (with hyphen)
- **Backend was expecting:** `join_call` (with underscore)

This prevented the WebRTC signaling from working properly.

## Fix Applied

### File: `frontend/src/hook/useWebRTC.js` (Line 446)

**Before:**
```javascript
socketRef.current.emit('join-call', { callId, userId });
```

**After:**
```javascript
socketRef.current.emit('join_call', { callId, userId }); // Fixed: use join_call not join-call
```

## How Video Calling Works

### 1. Call Flow
```
User A                          Backend                         User B
   |                               |                               |
   |------ start_call ------------>|                               |
   |                               |------- incoming_call -------->|
   |<----- call_started -----------|                               |
   |                               |                               |
   |                               |<------ join_call -------------|
   |<----- user-joined ------------|------- user-joined ---------->|
   |                               |                               |
   |------ sdp_offer ------------->|------- sdp_offer ------------>|
   |<----- sdp_answer -------------|<------ sdp_answer ------------|
   |------ ice_candidate --------->|------- ice_candidate -------->|
   |<----- ice_candidate ----------|<------ ice_candidate ---------|
   |                               |                               |
   |<========= WebRTC Connection Established ===================>|
   |                               |                               |
   |<========= Video & Audio Streaming ==========================>|
```

### 2. Socket Events (Backend → Frontend)

| Event | Purpose | Data |
|-------|---------|------|
| `incoming_call` | Notify user of incoming call | `{ callId, fromUserId, fromUserName }` |
| `call_started` | Confirm call initiated | `{ call, ringing: true }` |
| `user-joined` | Someone joined the call | `{ userId, socketId }` |
| `user-left` | Someone left the call | `{ userId }` |
| `sdp_offer` | WebRTC offer from peer | `{ fromUserId, offer }` |
| `sdp_answer` | WebRTC answer from peer | `{ fromUserId, answer }` |
| `ice_candidate` | ICE candidate from peer | `{ fromUserId, candidate }` |
| `call_ended` | Call terminated | `{ callId, reason }` |

### 3. Socket Events (Frontend → Backend)

| Event | Purpose | Data |
|-------|---------|------|
| `start_call` | Initiate a call | `{ participants, type }` |
| `join_call` | Join an existing call | `{ callId }` |
| `leave-call` | Leave the call | `{ callId, userId }` |
| `sdp_offer` | Send WebRTC offer | `{ callId, offer, to }` |
| `sdp_answer` | Send WebRTC answer | `{ callId, answer, to }` |
| `ice_candidate` | Send ICE candidate | `{ callId, candidate, to }` |
| `reject_call` | Reject incoming call | `{ callId }` |
| `cancel_call` | Cancel outgoing call | `{ callId }` |
| `end_call` | End active call | `{ callId }` |

## Debugging Steps

### Step 1: Check Browser Console

Look for these logs:

**When joining call:**
```
🔌 Joining call room: <callId>
✅ Local stream attached successfully
```

**When peer joins:**
```
👥 User joined call: <userId>
🤝 Creating peer connection for: <userId>
📹 Adding 2 tracks to peer connection for <userId>
```

**When receiving video:**
```
📹 Received remote stream from: <userId>
📊 Remote stream tracks: ["video (true)", "audio (true)"]
✅ Remote video playing successfully
🎵 Remote stream audio tracks: 1
```

### Step 2: Check Network Tab

1. Open DevTools → Network → WS (WebSocket)
2. Click on the socket connection
3. Look for messages:
   - `join_call` (outgoing)
   - `user-joined` (incoming)
   - `sdp_offer` (bidirectional)
   - `sdp_answer` (bidirectional)
   - `ice_candidate` (bidirectional)

### Step 3: Check Permissions

```javascript
// In browser console
navigator.permissions.query({ name: 'camera' })
  .then(result => console.log('Camera:', result.state));

navigator.permissions.query({ name: 'microphone' })
  .then(result => console.log('Microphone:', result.state));
```

Both should show: `granted`

### Step 4: Check Media Devices

```javascript
// In browser console
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    console.log('Video inputs:', devices.filter(d => d.kind === 'videoinput'));
    console.log('Audio inputs:', devices.filter(d => d.kind === 'audioinput'));
  });
```

Should show at least 1 camera and 1 microphone.

### Step 5: Check Video Elements

```javascript
// In browser console
document.querySelectorAll('video').forEach((video, index) => {
  const stream = video.srcObject;
  console.log(`Video ${index}:`, {
    hasStream: !!stream,
    tracks: stream ? stream.getTracks().length : 0,
    videoTracks: stream ? stream.getVideoTracks().length : 0,
    audioTracks: stream ? stream.getAudioTracks().length : 0,
    paused: video.paused,
    muted: video.muted
  });
});
```

**Expected output:**
```javascript
Video 0: { // Local video
  hasStream: true,
  tracks: 2,
  videoTracks: 1,
  audioTracks: 1,
  paused: false,
  muted: true  // Local video should be muted
}

Video 1: { // Remote video
  hasStream: true,
  tracks: 2,
  videoTracks: 1,
  audioTracks: 1,
  paused: false,
  muted: false  // Remote video should NOT be muted
}
```

## Common Issues & Solutions

### Issue 1: Black Screen - No Video at All

**Cause:** Camera permission denied or camera not working

**Solution:**
1. Check browser permissions (click lock icon in address bar)
2. Grant camera and microphone permissions
3. Refresh the page
4. Try different browser

### Issue 2: Can See Local Video But Not Remote

**Cause:** WebRTC signaling not working

**Check:**
1. Socket connection is established
2. `join_call` event is sent (check Network tab)
3. `user-joined` event is received
4. `sdp_offer` and `sdp_answer` are exchanged

**Solution:**
- Ensure socket event names match (this fix addresses this)
- Check firewall settings
- May need TURN server for restrictive networks

### Issue 3: Video Works But Audio Doesn't

**Cause:** Browser auto-play policy or audio tracks not enabled

**Solution:**
1. Click anywhere on the page to enable audio
2. Check remote video element is not muted
3. Check audio tracks are enabled

### Issue 4: Video Freezes or Stutters

**Cause:** Network issues or bandwidth limitations

**Solution:**
1. Check internet connection
2. Close other bandwidth-heavy applications
3. Reduce video quality in settings

### Issue 5: "Waiting for video stream..." Message

**Cause:** Remote user hasn't enabled camera or WebRTC connection not established

**Check:**
1. Remote user granted camera permissions
2. WebRTC peer connection is established
3. ICE candidates are being exchanged

## Testing Checklist

After applying the fix, test these scenarios:

- [ ] User A calls User B
- [ ] User B accepts call
- [ ] Both users see "Initializing call..." briefly
- [ ] Both users navigate to /video-call page
- [ ] Camera permission requested (if first time)
- [ ] Microphone permission requested (if first time)
- [ ] Local video appears (mirrored)
- [ ] Remote video appears (not mirrored)
- [ ] Can hear remote audio
- [ ] Can toggle mute button
- [ ] Can toggle video button
- [ ] Can end call
- [ ] Both return to chat page

## Expected Behavior After Fix

### 1. Call Initiation
```
✅ User A clicks call button
✅ Outgoing modal appears
✅ Camera initializes
✅ Local video preview shows
✅ Outgoing ringtone plays
```

### 2. Call Acceptance
```
✅ User B sees incoming modal
✅ User B clicks Accept
✅ Both navigate to /video-call
✅ "Initializing call..." shows briefly
```

### 3. Video Connection
```
✅ Camera permission granted
✅ Microphone permission granted
✅ Local video appears on both sides
✅ WebRTC signaling completes
✅ Remote video appears on both sides
✅ Audio is transmitted and received
✅ "Video Connected" indicator shows
```

### 4. During Call
```
✅ Can see remote video clearly
✅ Can hear remote audio clearly
✅ Can toggle mute (audio icon shows)
✅ Can toggle video (video icon shows)
✅ Call timer shows elapsed time
✅ Connection quality indicator works
```

### 5. Call End
```
✅ Click end call button
✅ Video stops immediately
✅ Camera/mic released
✅ Both users return to chat
✅ Call saved in history
```

## Files Modified

1. ✅ `frontend/src/hook/useWebRTC.js` (Line 446)
   - Changed `join-call` to `join_call`

## Backend Socket Events (Reference)

All correctly implemented in `backend/src/socket/socketServer.js`:

```javascript
// Call management
socket.on("start_call", ...)      // Line 1242
socket.on("join_call", ...)       // Line 1347
socket.on("reject_call", ...)     // Line 1568
socket.on("cancel_call", ...)     // Line 1623
socket.on("end_call", ...)        // Line 1678

// WebRTC signaling
socket.on("leave-call", ...)      // Line 1882
socket.on("sdp_offer", ...)       // Line 1909
socket.on("sdp_answer", ...)      // Line 1929
socket.on("ice_candidate", ...)   // Line 1949
```

## Summary

**The fix is simple but critical:**
- Changed socket event from `join-call` to `join_call`
- This allows WebRTC signaling to work properly
- Video and audio streams can now be established

**Deploy this fix and test immediately!**

The black screen issue should be resolved. If you still see black screen after this fix, follow the debugging steps above to identify the specific issue.
