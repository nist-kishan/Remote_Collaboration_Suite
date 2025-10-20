import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ChatConversationList from '../components/chat/ChatConversationList';
import ChatConversationWindow from '../components/chat/ChatConversationWindow';
import CreateNewChatModal from '../components/chat/CreateNewChatModal';
import { createGroupChat } from '../api/chatApi';
import { useCall } from '../hook/useCall';
import IncomingVideoCallModal from '../components/call/IncomingVideoCallModal';
import OutgoingVideoCallModal from '../components/call/OutgoingVideoCallModal';
import VideoCallInterface from '../components/call/VideoCallInterface';
import CustomButton from '../components/ui/CustomButton';
import CustomInput from '../components/ui/CustomInput';
import NetworkConnectionStatus from '../components/ui/NetworkConnectionStatus';
import { X } from 'lucide-react';

const ChatPage = () => {
  const { receiverId, groupId } = useParams();
  const navigate = useNavigate();
  const messageInputRef = useRef(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showChat, setShowChat] = useState(false);

  // Call manager
  const {
    incomingCall,
    outgoingCall,
    activeCall,
    showIncomingCall,
    showOutgoingCall,
    showActiveCall,
    startCall,
    acceptCall,
    rejectCall,
    declineCall,
    cancelCall,
    endActiveCall
  } = useCall();

  // Handle URL parameters
  useEffect(() => {
    if (receiverId) {
      // If receiverId is provided, automatically start a chat with that user
      handleStartChatWithUser(receiverId);
    } else if (groupId) {
      // If groupId is provided, load the group chat
      handleLoadGroupChat(groupId);
    }
  }, [receiverId, groupId]);

  const handleStartChatWithUser = async (userId) => {
    try {
      // Import the getOrCreateOneToOneChat function
      const { getOrCreateOneToOneChat } = await import('../api/chatApi');
      const response = await getOrCreateOneToOneChat(userId);
      const chat = response.data?.data?.chat || response.data?.chat || response.data;
      
      if (chat && chat._id) {
        setSelectedChat(chat);
        // Update URL to show the receiver ID
        navigate(`/chat/${userId}`, { replace: true });
      } else {
        toast.error('Failed to start chat with user');
      }
    } catch (error) {
      toast.error('Failed to start chat with user');
    }
  };

  const handleLoadGroupChat = async (groupId) => {
    try {
      // Import the getChatById function
      const { getChatById } = await import('../api/chatApi');
      const response = await getChatById(groupId);
      const chat = response.data?.data?.chat || response.data?.chat || response.data;
      
      if (chat && chat._id) {
        setSelectedChat(chat);
        // Update URL to show the group ID
        navigate(`/chats/group/${groupId}`, { replace: true });
      } else {
        toast.error('Failed to load group chat');
      }
    } catch (error) {
      toast.error('Failed to load group chat');
    }
  };


  const createGroupMutation = useMutation({
    mutationFn: createGroupChat,
    onSuccess: (data) => {
      toast.success('Group created successfully!');
      const chat = data.data?.data?.chat || data.data?.chat || data.data;
      setSelectedChat(chat);
      setShowCreateGroup(false);
      setGroupName('');
      setSelectedMembers([]);
      
      // Navigate to the group chat URL
      if (chat && chat._id) {
        navigate(`/chats/group/${chat._id}`, { replace: true });
      }
    },
    onError: (error) => {
      toast.error(error?.data?.message || 'Failed to create group');
    }
  });

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedMembers.length < 2) {
      toast.error('Please provide a group name and select at least 2 members');
      return;
    }

    createGroupMutation.mutate({
      name: groupName,
      participantIds: selectedMembers
    });
  };

  const handleVideoCall = (chat) => {
    // Start video call using call manager
    startCall(chat._id);
  };

  const handleEndCall = () => {
    endActiveCall();
  };

  const handleToggleChat = () => {
    setShowChat(!showChat);
  };

  const handleCallHistory = (chat) => {
    // Navigate to call history page
    navigate('/call-history');
  };

  const handleNewChatCreated = (chat) => {
    setSelectedChat(chat);
    setShowNewChat(false);
    
    // Navigate based on chat type
    if (chat.type === 'one-to-one') {
      // Get the receiver ID from the chat participants
      const receiver = chat.participants?.find(p => p.user._id !== user?._id);
      if (receiver) {
        // Update URL to show the receiver ID
        navigate(`/chat/${receiver.user._id}`, { replace: true });
      }
    } else if (chat.type === 'group') {
      // Navigate to group chat URL
      navigate(`/chats/group/${chat._id}`, { replace: true });
    }
    
    // Focus on the message input for immediate typing
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }, 100);
  };

  return (
    <>
      {/* Call Modals */}
      <IncomingVideoCallModal
        incomingCall={incomingCall}
        onAccept={acceptCall}
        onReject={rejectCall}
        onDecline={declineCall}
        isVisible={showIncomingCall}
      />

      <OutgoingVideoCallModal
        outgoingCall={outgoingCall}
        onCancel={cancelCall}
        isVisible={showOutgoingCall}
      />

      {/* Active Call Window */}
      {showActiveCall && activeCall && (
        <VideoCallInterface
          call={activeCall}
          onEndCall={handleEndCall}
          onToggleChat={handleToggleChat}
        />
      )}

      {/* Connection Status */}
      <NetworkConnectionStatus className="fixed top-4 right-4 z-50 max-w-sm" />

      {/* Main Chat Interface */}
      {!showActiveCall && (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
          {/* Chat List - Hidden on mobile when chat is selected */}
          <div className={`${selectedChat ? 'hidden md:block' : 'block'} w-full md:w-96`}>
            <ChatConversationList
              onSelectChat={setSelectedChat}
              onVideoCall={handleVideoCall}
            />
          </div>

          {/* Chat Window */}
          {selectedChat ? (
            <div className="flex-1 h-screen">
              <ChatConversationWindow
                ref={messageInputRef}
                chat={selectedChat}
                onVideoCall={handleVideoCall}
                onCallHistory={handleCallHistory}
                onChatSelect={setSelectedChat}
                isMobile={true}
              />
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p className="text-xl font-semibold mb-2">Select a chat to start messaging</p>
                <p className="text-sm">Or create a new group chat</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Create Group Chat
              </h2>
              <button
                onClick={() => setShowCreateGroup(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group Name
                </label>
                <CustomInput
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Members (at least 2)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Selected: {selectedMembers.length} members
                </p>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-900 max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Member selection will be implemented with user search
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <CustomButton
                  onClick={() => setShowCreateGroup(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </CustomButton>
                <CustomButton
                  onClick={handleCreateGroup}
                  disabled={createGroupMutation.isPending || !groupName.trim() || selectedMembers.length < 2}
                  loading={createGroupMutation.isPending}
                  className="flex-1"
                >
                  Create Group
                </CustomButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      <CreateNewChatModal
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
        onChatCreated={handleNewChatCreated}
      />
    </>
  );
};

export default ChatPage;

