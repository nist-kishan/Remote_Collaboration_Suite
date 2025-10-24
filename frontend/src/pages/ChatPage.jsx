import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
// import '../components/chat/chat-styles.css';
import ChatConversationList from '../components/chat/ChatConversationList';
import ChatConversationWindow from '../components/chat/ChatConversationWindow';
import CreateNewChatModal from '../components/chat/CreateNewChatModal';
import CreateChatGroupModal from '../components/chat/CreateChatGroupModal';
import { useChatPage } from '../hook/useChat';
import { useChatCallIntegration } from '../hook/useChatCallIntegration';
import IncomingVideoCallModal from '../components/call/IncomingVideoCallModal';
import OutgoingVideoCallModal from '../components/call/OutgoingVideoCallModal';
import VideoCallInterface from '../components/call/VideoCallInterface';
import CustomButton from '../components/ui/CustomButton';

const ChatPage = () => {
  const messageInputRef = useRef(null);

  // Chat page business logic
  const {
    showCreateGroup,
    showNewChat,
    selectedChat,
    showChatList,
    searchQuery,
    isChatLoading,
    chatError,
    handleStartChat,
    handleLoadGroupChat,
    handleNewChatCreated,
    handleBackToChatList,
    handleSelectChat,
    handleVideoCall,
    handleCallHistory,
    handleCreateGroup,
    handleCloseModal,
    handleOpenModal,
    handleUrlParams,
    handleDelete,
    handleInfo,
    setSelectedChat,
  } = useChatPage();

  // Enhanced chat-call integration
  const {
    incomingCall,
    outgoingCall,
    activeCall,
    showIncomingCall,
    showOutgoingCall,
    showActiveCall,
    integrationState,
    callStatus,
    initiateVideoCall,
    handleCallAccept,
    handleCallReject,
    handleCallEnd,
    cancelCall,
    declineCall,
    isVideoCallAvailable,
    callHistory
  } = useChatCallIntegration(selectedChat);

  // Handle URL parameters on mount
  useEffect(() => {
    handleUrlParams();
  }, [handleUrlParams]);

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden relative z-10">
      {/* Incoming Call Modal */}
      {showIncomingCall && incomingCall && (
        <IncomingVideoCallModal
          call={incomingCall}
          onAccept={handleCallAccept}
          onReject={handleCallReject}
          chatContext={selectedChat}
        />
      )}

      {/* Outgoing Call Modal */}
      {showOutgoingCall && outgoingCall && (
        <OutgoingVideoCallModal
          call={outgoingCall}
          onCancel={cancelCall}
          chatContext={selectedChat}
        />
      )}

      {/* Active Call Interface */}
      {showActiveCall && activeCall && (
        <div className="absolute inset-0 z-40 bg-black overflow-hidden">
          <VideoCallInterface
            call={activeCall}
            onEndCall={handleCallEnd}
            onDeclineCall={declineCall}
            chatContext={selectedChat}
            callDuration={callStatus.duration * 1000}
          />
        </div>
      )}

      {/* Enhanced Call Status Indicator */}
      {callStatus.status === 'active' && (
        <div className="bg-indigo-600 text-white px-4 py-2 text-center text-sm flex items-center justify-center flex-shrink-0">
          <span className="animate-pulse mr-2">📞</span>
          Video call with {callStatus.chatName}
          <span className="ml-2 bg-indigo-500 px-2 py-1 rounded text-xs">
            {callStatus.duration}s
          </span>
        </div>
      )}
      
      {callStatus.status === 'connecting' && (
        <div className="bg-yellow-600 text-white px-4 py-2 text-center text-sm flex items-center justify-center flex-shrink-0">
          <span className="animate-spin mr-2">⏳</span>
          Connecting to {callStatus.chatName}...
        </div>
      )}

      {/* Main Chat Interface */}
      {!showActiveCall && (
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Chat List - Responsive visibility */}
          <div className={`${showChatList ? 'flex' : 'hidden lg:flex'} w-full sm:w-80 md:w-96 lg:w-80 xl:w-96 flex-col min-h-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 relative z-10`}>
            <div className="flex-1 overflow-hidden min-h-0">
              <ChatConversationList
                onSelectChat={handleSelectChat}
                onVideoCall={initiateVideoCall}
                onNewChat={() => handleOpenModal('newChat')}
                onCreateGroup={() => handleOpenModal('createGroup')}
                selectedChat={selectedChat}
                callStatus={callStatus}
                isVideoCallAvailable={isVideoCallAvailable}
              />
            </div>
          </div>

          {/* Chat Window - Always visible on larger screens */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-white dark:bg-gray-900 relative z-10">
            {selectedChat ? (
              <ChatConversationWindow
                ref={messageInputRef}
                chat={selectedChat}
                onVideoCall={initiateVideoCall}
                onChatSelect={setSelectedChat}
                onDelete={handleDelete}
                onInfo={handleInfo}
                onBack={handleBackToChatList}
                isMobile={true}
                callStatus={callStatus}
                isVideoCallAvailable={isVideoCallAvailable}
                integrationState={integrationState}
              />
            ) : (
              <>
                {/* Chat Header - Always visible on larger screens */}
                <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                          Select a Chat
                        </h2>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
                          Choose a conversation to start messaging
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Chat Content Area */}
                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800 min-h-0 overflow-hidden">
                  <div className="text-center text-gray-500 dark:text-gray-400 p-8 max-w-md">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Select a chat to start messaging</h3>
                    <p className="text-sm mb-6">Choose from your existing conversations or start a new one</p>
                    <CustomButton
                      onClick={() => handleOpenModal('newChat')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Start New Chat
                    </CustomButton>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create New Chat Modal */}
      {showNewChat && (
        <CreateNewChatModal
          isOpen={showNewChat}
          onClose={() => handleCloseModal('newChat')}
          onChatCreated={handleNewChatCreated}
          onCreateGroup={() => handleOpenModal('createGroup')}
        />
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateChatGroupModal
          isOpen={showCreateGroup}
          onClose={() => handleCloseModal('createGroup')}
          onGroupCreated={handleNewChatCreated}
        />
      )}
    </div>
  );
};

export default ChatPage;