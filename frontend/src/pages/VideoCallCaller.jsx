import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCall } from "../hook/useCallIntegration";
import VideoCallInterface from "../components/call/VideoCallInterface";
import { toast } from "react-hot-toast";
import { getOrCreateOneToOneChat } from "../api/chatApi";

const VideoCallCaller = () => {
  const { senderId } = useParams();
  const navigate = useNavigate();
  const {
    socket,
    startCall,
    endCall,
    endCallWithCleanup,
    callStatus: useCallStatus,
    isCallLoading,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    timeElapsed,
  } = useCall();
  const [callData, setCallData] = useState(null);
  // Use call status from useCall hook
  const callStatus = useCallStatus || "calling";

  // Load call data from localStorage or Redux store
  useEffect(() => {
    const savedCallData = localStorage.getItem("activeCallData");
    if (savedCallData) {
      try {
        const parsedData = JSON.parse(savedCallData);

        // Check if call is stuck in connecting state (older than 30 seconds)
        if (parsedData.status === "connecting") {
          const callStartTime = new Date(parsedData.startTime);
          const now = new Date();
          const timeDiff = now.getTime() - callStartTime.getTime();

          if (timeDiff > 30000) {
            // 30 seconds
            localStorage.removeItem("activeCallData");
            return;
          }
        }

        if (
          parsedData.status === "connecting" ||
          parsedData.status === "calling"
        ) {
          setCallData(parsedData);
        }
      } catch (error) {
        localStorage.removeItem("activeCallData");
      }
    } else {
      // No saved call data found
    }
  }, []);

  // If senderId is undefined, show error
  useEffect(() => {
    if (!senderId || senderId === "undefined") {
      toast.error("Invalid call parameters");
      navigate("/chat");
    }
  }, [senderId, navigate]);

  // Initialize call using useCall hook
  useEffect(() => {
    const initializeCall = async () => {
      try {
        // Check if call is already in progress
        const savedCallData = localStorage.getItem("activeCallData");
        if (savedCallData) {
          const parsedData = JSON.parse(savedCallData);

          // Check if call is stuck in connecting state
          if (parsedData.status === "connecting") {
            const callStartTime = new Date(parsedData.startTime);
            const now = new Date();
            const timeDiff = now.getTime() - callStartTime.getTime();

            if (timeDiff > 30000) {
              // 30 seconds
              console.warn(
                "⚠️ Call stuck in connecting state, clearing and retrying..."
              );
              localStorage.removeItem("activeCallData");
            } else {
              return;
            }
          } else if (parsedData.status === "calling") {
            return;
          }
        }

        // Resolve or create chat before starting call
        const response = await getOrCreateOneToOneChat(senderId);
        const chat =
          response.data?.data?.chat || response.data?.chat || response.data;

        if (!chat?._id) {
          throw new Error("Unable to resolve chat for the call");
        }

        await startCall(chat._id);
      } catch (error) {
        console.error("❌ VideoCallCaller - Error starting call:", error);
        toast.error("Failed to start call");
        navigate("/chat");
      }
    };

    // Start initialization immediately
    initializeCall();
  }, [startCall, senderId, navigate]);

  // Handle cancel call
  const handleCancelCall = async () => {
    // Use the useCall hook's endCallWithCleanup function for proper media cleanup
    await endCallWithCleanup();

    // Clear persisted call data
    localStorage.removeItem("activeCallData");

    navigate("/chat");
  };

  // Handle end call
  const handleEndCall = async () => {
    // Use the useCall hook's endCallWithCleanup function for proper media cleanup
    await endCallWithCleanup();

    // Clear persisted call data
    localStorage.removeItem("activeCallData");

    navigate("/video-call/ended", {
      state: {
        message: "Call ended",
        receiver: callData?.receiver,
      },
    });
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleCallAccepted = (data) => {
      setCallData(data.call);
      // Don't show toast - call UI shows connection status
    };

    const handleCallRejected = (data) => {
      navigate("/video-call/ended", {
        state: {
          message: "Call rejected",
          receiver: data.receiver,
        },
      });
    };

    const handleCallEnded = (data) => {
      navigate("/video-call/ended", {
        state: {
          message: "Call ended by receiver",
          receiver: callData?.receiver,
        },
      });
    };

    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);

    return () => {
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);
    };
  }, [socket, callData, navigate]);

  return (
    <VideoCallInterface
      callData={callData}
      callStatus={callStatus}
      localStream={localStream}
      remoteStream={remoteStream}
      isMuted={isMuted}
      isVideoEnabled={isVideoEnabled}
      isScreenSharing={isScreenSharing}
      timeElapsed={timeElapsed}
      socket={socket}
      onToggleMute={toggleMute}
      onToggleVideo={toggleVideo}
      onToggleScreenShare={toggleScreenShare}
      onEndCall={callStatus === "calling" ? handleCancelCall : handleEndCall}
      isIncoming={false}
    />
  );
};

export default VideoCallCaller;
