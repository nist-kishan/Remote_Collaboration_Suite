import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCall } from "../hook/useCallIntegration";
import VideoCallInterface from "../components/call/VideoCallInterface";
import { toast } from "react-hot-toast";

const VideoCallReceiver = () => {
  const { receiverId } = useParams();
  const navigate = useNavigate();
  const {
    socket,
    acceptCall,
    rejectCall,
    endCallWithCleanup,
    callStatus: useCallStatus,
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
  const callStatus = useCallStatus || "incoming";

  // Load call data from localStorage or Redux store
  useEffect(() => {
    const savedCallData = localStorage.getItem("activeCallData");
    if (savedCallData) {
      try {
        const parsedData = JSON.parse(savedCallData);
        if (parsedData.status === "incoming") {
          setCallData(parsedData);
        }
      } catch (error) {
        // Error parsing saved call data
      }
    } else {
      // No saved call data found
    }
  }, []);

  // If receiverId is undefined, show error
  useEffect(() => {
    if (!receiverId || receiverId === "undefined") {
      toast.error("Invalid call parameters");
      navigate("/chat");
    }
  }, [receiverId, navigate]);

  // Handle accept call
  const handleAcceptCall = async () => {
    try {
      // Use the useCall hook's acceptCall function
      await acceptCall();

      // Update call data with connected status
      const updatedCallData = {
        ...callData,
        status: "connected",
        startTime: new Date().toISOString(),
      };
      localStorage.setItem("activeCallData", JSON.stringify(updatedCallData));

      // Call status is managed by useCall hook
      toast.success("Call accepted");
    } catch (error) {
      toast.error("Failed to accept call");
    }
  };

  // Handle reject call
  const handleRejectCall = () => {
    // Use the useCall hook's rejectCall function
    rejectCall();

    // Clear persisted call data
    localStorage.removeItem("activeCallData");

    navigate("/video-call/ended", {
      state: {
        message: "Call rejected",
        caller: callData?.caller,
      },
    });
  };

  // Handle end call
  const handleEndCall = async () => {
    // Use the useCall hook's endCallWithCleanup function for proper media cleanup
    await endCallWithCleanup(callData.callId);

    // Clear persisted call data
    localStorage.removeItem("activeCallData");

    navigate("/video-call/ended", {
      state: {
        message: "Call ended",
        caller: callData?.caller,
      },
    });
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleCallEnded = (data) => {
      navigate("/video-call/ended", {
        state: {
          message: "Call ended by caller",
          caller: callData?.caller,
        },
      });
    };

    socket.on("call_ended", handleCallEnded);

    return () => {
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
      onEndCall={handleEndCall}
      onAcceptCall={handleAcceptCall}
      onRejectCall={handleRejectCall}
      isIncoming={true}
    />
  );
};

export default VideoCallReceiver;
