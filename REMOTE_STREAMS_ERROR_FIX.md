# ReferenceError: remoteStreams is not defined - Fix

## Error
```
Uncaught ReferenceError: remoteStreams is not defined
```

## Root Cause
In `useCallIntegration.js`, we added console logging that references `remoteStreams`, but we weren't destructuring it from the `useWebRTC` hook.

Additionally, we were trying to destructure `isMuted` and `isVideoEnabled` from both Redux selectors AND useWebRTC, causing a variable redeclaration error.

## Fix Applied

### File: `frontend/src/hook/useCallIntegration.js`

**Step 1: Import Redux Selectors**
```javascript
import {
  // ... other imports
  selectIsMuted,
  selectIsVideoEnabled,
} from "../store/slice/callSlice";
```

**Step 2: Get Values from Redux**
```javascript
const isMuted = useSelector(selectIsMuted);
const isVideoEnabled = useSelector(selectIsVideoEnabled);
```

**Step 3: Destructure remoteStreams from useWebRTC**
```javascript
const {
  localStream,
  remoteStreams,  // ✅ Added this
  initializeLocalStream,
  toggleAudio: toggleAudioTrack,
  toggleVideo: toggleVideoTrack,
  startScreenShare,
  stopScreenShare,
  joinCallRoom,
  leaveCallRoom,
  cleanup: cleanupWebRTC,
} = useWebRTC(activeCall?.callId || activeCall?._id, user?._id || user?.id);
```

**Note:** We do NOT destructure `isMuted` and `isVideoEnabled` from useWebRTC because:
1. useWebRTC doesn't return them
2. They come from Redux state
3. Destructuring them twice would cause "Cannot redeclare" error

## What Changed

### Before (❌ Error):
```javascript
// isMuted and isVideoEnabled not defined
// remoteStreams not destructured
const {
  localStream,
  initializeLocalStream,
  // ... other properties
} = useWebRTC(...);

// Console log tries to use remoteStreams
console.log('🎥 Remote Streams:', Object.keys(remoteStreams).length); // ❌ Error!
```

### After (✅ Fixed):
```javascript
// Get from Redux
const isMuted = useSelector(selectIsMuted);
const isVideoEnabled = useSelector(selectIsVideoEnabled);

// Get from useWebRTC
const {
  localStream,
  remoteStreams,  // ✅ Now available
  initializeLocalStream,
  // ... other properties
} = useWebRTC(...);

// Console log works
console.log('🎥 Remote Streams:', Object.keys(remoteStreams).length); // ✅ Works!
```

## Source of Values

| Variable | Source | Type |
|----------|--------|------|
| `isMuted` | Redux (`selectIsMuted`) | boolean |
| `isVideoEnabled` | Redux (`selectIsVideoEnabled`) | boolean |
| `localStream` | useWebRTC | MediaStream |
| `remoteStreams` | useWebRTC | Object |
| `activeCall` | Redux (`selectActiveCall`) | Object |
| `callStatus` | Redux (`selectCallStatus`) | string |

## Files Modified

1. ✅ `frontend/src/hook/useCallIntegration.js`
   - Added `selectIsMuted` and `selectIsVideoEnabled` imports
   - Added Redux selectors for `isMuted` and `isVideoEnabled`
   - Added `remoteStreams` to useWebRTC destructuring

## Summary

**Problem:** Console logging tried to use `remoteStreams` which wasn't destructured from useWebRTC

**Solution:** 
1. Import Redux selectors for `isMuted` and `isVideoEnabled`
2. Get them from Redux state
3. Destructure `remoteStreams` from useWebRTC
4. Don't duplicate variable declarations

**Result:** Error fixed, console logging works! ✅
