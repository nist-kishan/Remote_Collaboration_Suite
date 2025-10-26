// Audio testing utilities for debugging WebRTC audio issues
export const testAudioPlayback = async () => {
  try {
    console.log('🔊 Testing audio playback...');

    // Test 1: Check if audio context is available
    if (window.AudioContext || window.webkitAudioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioCtx();

      console.log('✅ AudioContext available:', audioContext.state);

      // Test 2: Check media devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');

      console.log('🎤 Audio inputs:', audioInputs.length, audioInputs.map(d => d.label));
      console.log('🔊 Audio outputs:', audioOutputs.length, audioOutputs.map(d => d.label));

      // Test 3: Try to create a test audio stream
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          }
        });

        const audioTrack = testStream.getAudioTracks()[0];
        console.log('✅ Test audio track:', audioTrack.label, audioTrack.enabled, audioTrack.readyState);

        // Clean up
        testStream.getTracks().forEach(track => track.stop());

        return {
          success: true,
          audioContext: audioContext.state,
          inputs: audioInputs.length,
          outputs: audioOutputs.length,
          testTrack: audioTrack ? audioTrack.label : 'none'
        };

      } catch (mediaError) {
        console.error('❌ Media test failed:', mediaError);
        return {
          success: false,
          error: mediaError.name,
          message: mediaError.message
        };
      }

    } else {
      console.error('❌ AudioContext not supported');
      return {
        success: false,
        error: 'AudioContext not supported'
      };
    }

  } catch (error) {
    console.error('❌ Audio test error:', error);
    return {
      success: false,
      error: error.name,
      message: error.message
    };
  }
};

export const checkWebRTCAudioSupport = () => {
  console.log('🌐 WebRTC Audio Support Check:');

  const support = {
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    RTCPeerConnection: !!window.RTCPeerConnection,
    audioContext: !!(window.AudioContext || window.webkitAudioContext),
    mediaStream: !!window.MediaStream,
    audioTracks: !!window.MediaStreamTrack
  };

  console.log('📋 WebRTC Support:', support);

  Object.entries(support).forEach(([feature, supported]) => {
    console.log(`${supported ? '✅' : '❌'} ${feature}: ${supported}`);
  });

  return support;
};
