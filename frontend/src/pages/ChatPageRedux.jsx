import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import EnhancedChatList from '../components/chat/ChatConversationList';
import ChatWindow from '../components/chat/ChatConversationWindow';
import CreateGroupModal from '../components/chat/CreateChatGroupModal';
import NewChatModal from '../components/chat/CreateNewChatModal';
import { useCall } from '../hook/useCall';
import { useChat } from '../hook/useChat';
import { useChatManager, useCreateGroupChat, useCreateOneToOneChat, useChatQuery } from '../hook/useChat';
import IncomingCallModal from '../components/call/IncomingCallModal';
import OutgoingCallModal from '../components/call/OutgoingCallModal';
import ActiveCallWindow from '../components/call/ActiveCallWindow';
import Button from '../components/ui/Button';
import Input from '../components/ui/CustomInput';
import { X } from 'lucide-react';

const ChatPage = () => {
  const { receiverId, groupId } = useParams();
  const navigate = useNavigate();
  const messageInputRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  
  // Redux-based chat management
  const {
    currentChat,
    selectedChatId,
    showCreateGroupModal,
    showNewChatModal,
    selectChat,
    openCreateGroupModal,
    closeCreateGroupModal,
    openNewChatModal,
    closeNewChatModal,
  } = useChatManager();

  // Mutations
  const createGroupMutation = useCreateGroupChat();
  const createOneToOneMutation = useCreateOneToOneChat();

  // Queries
  const { data: chatData, isLoading: chatLoading } = useChatQuery(groupId);

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
      handleStartChatWithUser(receiverId);
    } else if (groupId) {
      handleLoadGroupChat(groupId);
    }
  }, [receiverId, groupId]);

  // Handle chat data loading
  useEffect(() => {
    if (chatData && groupId) {
      selectChat(chatData);
    }
  }, [chatData, groupId, selectChat]);

  const handleStartChatWithUser = async (userId) => {
    try {
      const result = await createOneToOneMutation.mutateAsync(userId);
      const chat = result.data?.chat || result.data || result;
      
      if (chat && chat._id) {
        selectChat(chat);
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
      if (chatData && chatData._id) {
        selectChat(chatData);
        navigate(`/chats/group/${groupId}`, { replace: true });
      } else {
        toast.error('Failed to load group chat');
      }
    } catch (error) {
      toast.error('Failed to load group chat');
    }
  };

  const handleCreateGroup = (groupData) => {
    createGroupMutation.mutate(groupData, {
      onSuccess: (data) => {
        const chat = data.data?.chat || data.data || data;
        selectChat(chat);
        closeCreateGroupModal();

        // Navigate to the group chat URL
        if (chat && chat._id) {
          navigate(`/chats/group/${chat._id}`, { replace: true });
        }
      },
      onError: (error) => {
        toast.error(error || 'Failed to create group');
      }
    });
  };

  const handleVideoCall = (chat) => {
    if (chat.type === 'one-to-one') {
      const receiver = chat.participants?.find(p => p.user._id !== user?._id);
      if (receiver) {
        startCall(receiver.user._id, 'video');
      }
    }
  };

  const handleEndCall = () => {
    endActiveCall();
  };

  const handleToggleChat = () => {
    // Toggle chat visibility logic
  };

  const handleCallHistory = (chat) => {
    // Handle call history logic
  };

  const handleDelete = (chat) => {
    // Handle delete chat logic
    };

  const handleArchive = (chat) => {
    // Handle archive chat logic
    };

  const handleInfo = (chat) => {
    // Handle chat info logic
    };

  const handleBackToChatList = () => {
    navigate('/chat', { replace: true });
  };

  const handleNewChatCreated = (chat) => {
    selectChat(chat);
    closeNewChatModal();

    // Navigate based on chat type
    if (chat.type === 'one-to-one') {
      const receiver = chat.participants?.find(p => p.user._id !== user?._id);
      if (receiver) {
        navigate(`/chat/${receiver.user._id}`, { replace: true });
      }
    } else if (chat.type === 'group') {
      navigate(`/chats/group/${chat._id}`, { replace: true });
    }

    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }, 100);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Chat List Sidebar */}
      <div className="w-full md:w-1/3 lg:w-1/4 xl:w-1/3 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
            Chats
          </h1>
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              onClick={openNewChatModal}
              size="sm"
              variant="outline"
              className="text-xs md:text-sm px-2 md:px-3"
            >
              <span className="hidden sm:inline">New Chat</span>
              <span className="sm:hidden">+</span>
            </Button>
            <Button
              onClick={openCreateGroupModal}
              size="sm"
              className="text-xs md:text-sm px-2 md:px-3"
            >
              <span className="hidden sm:inline">Group</span>
              <span className="sm:hidden">👥</span>
            </Button>
          </div>
        </div>
        
        {/* Chat List */}
        <div className="flex-1 overflow-hidden min-h-0">
          <EnhancedChatList
            onSelectChat={selectChat}
            selectedChat={currentChat}
            onVideoCall={handleVideoCall}
            onNewChat={openNewChatModal}
            onCreateGroup={openCreateGroupModal}
          />
        </div>
      </div>

      {/* Chat Window - Desktop */}
      <div className="flex-1 hidden md:flex chat-window-container">
        {currentChat ? (
          <ChatWindow
            ref={messageInputRef}
            chat={currentChat}
            onVideoCall={handleVideoCall}
            onChatSelect={selectChat}
            onDelete={handleDelete}
            onArchive={handleArchive}
            onInfo={handleInfo}
            onBack={handleBackToChatList}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Welcome to Chat
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
                Select a chat from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Chat Window - Full Screen */}
      <div className="flex-1 md:hidden chat-window-container">
        {currentChat ? (
          <ChatWindow
            ref={messageInputRef}
            chat={currentChat}
            onVideoCall={handleVideoCall}
            onChatSelect={selectChat}
            onDelete={handleDelete}
            onArchive={handleArchive}
            onInfo={handleInfo}
            onBack={handleBackToChatList}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                Welcome to Chat
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Select a chat to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateGroupModal && (
        <CreateGroupModal
          isOpen={showCreateGroupModal}
          onClose={closeCreateGroupModal}
          onGroupCreated={handleCreateGroup}
        />
      )}

      {showNewChatModal && (
        <NewChatModal
          isOpen={showNewChatModal}
          onClose={closeNewChatModal}
          onChatCreated={handleNewChatCreated}
        />
      )}

      {/* Call Modals */}
      {showIncomingCall && incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={() => acceptCall(incomingCall.callId)}
          onReject={() => rejectCall(incomingCall.callId)}
          onDecline={() => declineCall(incomingCall.callId)}
        />
      )}

      {showOutgoingCall && outgoingCall && (
        <OutgoingCallModal
          call={outgoingCall}
          onCancel={() => cancelCall(outgoingCall.callId)}
        />
      )}

      {showActiveCall && activeCall && (
        <ActiveCallWindow
          call={activeCall}
          onEndCall={handleEndCall}
        />
      )}

      {/* Connection Status - Removed */}
    </div>
  );
};

export default ChatPage;
