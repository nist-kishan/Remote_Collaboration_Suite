import { useState, useRef, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSocket } from "./useSocket";
import { useCall } from "./useCallIntegration";
import {
  // API functions
  getUserChats,
  getUserGroupChats,
  getOneToOneChats,
  getChattedUsers,
  getChatById,
  getOrCreateOneToOneChat,
  createGroupChat,
  updateGroupChat,
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
  archiveChat,
  unarchiveChat,
  deleteChat,
  archiveChatForUser,
  unarchiveChatForUser,
  deleteChatForUser,
  restoreChatForUser,
  getArchivedChatsForUser,
  getDeletedChatsForUser,
  updateMemberRole,
  getGroupMembers,
  markAsRead,
  markAsDelivered,
  getReadReceipts,
  getUnreadCount,
  getTotalUnreadCount,
  sendMessage,
  getChatMessages,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
} from "../api/chatApi";
import {
  // Redux actions
  setCurrentChat,
  setSelectedChat,
  setShowCreateGroupModal,
  setShowNewChatModal,
  setShowGroupMembers,
  addMessage,
  updateMessage,
  removeMessage,
  addError,
  clearError,
  clearAllErrors,
  selectChat,
  openCreateGroupModal,
  closeCreateGroupModal,
  openNewChatModal,
  closeNewChatModal,
  // Redux selectors
  selectCurrentChat,
  selectSelectedChat,
  selectChatList,
  selectFilteredChatList,
  selectMessages,
  selectTypingUsers,
  selectIsTyping,
  selectMessageInput,
  selectReplyToMessage,
  selectSearchQuery,
  selectChatType,
  selectGroupMembers,
  selectShowCreateGroupModal,
  selectShowNewChatModal,
  selectShowGroupMembers,
  selectChatErrors,
  selectIsLoading,
} from "../store/slice/chatSlice";

export const useChat = (chatId = null, params = {}) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const { socket } = useSocket();

  // Redux state selectors
  const chats = useSelector(selectChatList);
  const filteredChats = useSelector(selectFilteredChatList);
  const currentChat = useSelector(selectCurrentChat);
  const selectedChat = useSelector(selectSelectedChat);
  const messages = useSelector(selectMessages);
  const typingUsers = useSelector(selectTypingUsers);
  const isTyping = useSelector(selectIsTyping);
  const messageInput = useSelector(selectMessageInput);
  const replyToMessage = useSelector(selectReplyToMessage);
  const searchQuery = useSelector(selectSearchQuery);
  const chatType = useSelector(selectChatType);
  const groupMembers = useSelector(selectGroupMembers);
  const showCreateGroupModal = useSelector(selectShowCreateGroupModal);
  const showNewChatModal = useSelector(selectShowNewChatModal);
  const showGroupMembersModal = useSelector(selectShowGroupMembers);
  const loading = useSelector(selectIsLoading);
  const errors = useSelector(selectChatErrors);

  // Local state for typing and read status
  const [localIsTyping, setLocalIsTyping] = useState(false);
  const [localTypingUsers, setLocalTypingUsers] = useState([]);
  const [lastReadMessageRef, setLastReadMessageRef] = useState(null);
  const [deliveredMessagesRef, setDeliveredMessagesRef] = useState(new Set());
  const typingTimeoutRef = useRef(null);

  // Fetch chats with React Query
  const {
    data: chatsData,
    isLoading: isLoadingChats,
    error: chatsError,
    refetch: refetchChats,
  } = useQuery({
    queryKey: ["chats", params],
    queryFn: () => getUserChats(params),
    enabled: !!user,
    staleTime: 60000, // 1 minute - more reasonable for chat data
    refetchOnWindowFocus: false,
  });

  const {
    data: groupChatsData,
    isLoading: isLoadingGroupChats,
    error: groupChatsError,
  } = useQuery({
    queryKey: ["groupChats", params],
    queryFn: () => getUserGroupChats(params),
    enabled: !!user,
    staleTime: 60000, // 1 minute - more reasonable for group chat data
    refetchOnWindowFocus: false,
  });

  const chattedUsersData = null;
  const isLoadingChattedUsers = false;
  const chattedUsersError = null;

  const {
    data: currentChatData,
    isLoading: isLoadingCurrentChat,
    error: currentChatError,
  } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => getChatById(chatId),
    enabled: !!user && !!chatId,
    staleTime: 60000,
  });

  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery({
    queryKey: ["messages", chatId, params],
    queryFn: () => getChatMessages(chatId, params),
    enabled: !!user && !!chatId,
    staleTime: 30000, // 30 seconds - messages need more frequent updates
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const {
    data: groupMembersData,
    isLoading: isLoadingGroupMembers,
    error: groupMembersError,
  } = useQuery({
    queryKey: ["groupMembers", chatId],
    queryFn: () => getGroupMembers(chatId),
    enabled: !!user && !!chatId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: unreadCountData, isLoading: isLoadingUnreadCount } = useQuery({
    queryKey: ["unreadCount", chatId],
    queryFn: () => getUnreadCount(chatId),
    enabled: !!user && !!chatId,
    staleTime: 10000,
    refetchInterval: 30000,
  });

  const { data: totalUnreadCountData, isLoading: isLoadingTotalUnreadCount } =
    useQuery({
      queryKey: ["totalUnreadCount"],
      queryFn: () => getTotalUnreadCount(),
      enabled: !!user,
      staleTime: 10000,
      refetchInterval: 30000,
    });

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, data }) => sendMessage(chatId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["messages", variables.chatId]);
      queryClient.invalidateQueries(["chats"]);
      queryClient.invalidateQueries(["recentChats"]);
      queryClient.invalidateQueries(["groupChats"]);
    },
    onError: (error) => {
      toast.error("Failed to send message");
    },
  });

  const editMessageMutation = useMutation({
    mutationFn: ({ chatId, messageId, content }) =>
      editMessage(chatId, messageId, content),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["messages", variables.chatId]);
      toast.success("Message edited successfully");
    },
    onError: (error) => {
      toast.error("Failed to edit message");
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: ({ chatId, messageId }) => deleteMessage(chatId, messageId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["messages", variables.chatId]);
      toast.success("Message deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete message");
    },
  });

  const addReactionMutation = useMutation({
    mutationFn: ({ chatId, messageId, emoji }) =>
      addReaction(chatId, messageId, emoji),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["messages", variables.chatId]);
    },
    onError: (error) => {
      toast.error("Failed to add reaction");
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: ({ chatId, messageId, emoji }) =>
      removeReaction(chatId, messageId, emoji),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["messages", variables.chatId]);
    },
    onError: (error) => {
      toast.error("Failed to remove reaction");
    },
  });

  const createGroupChatMutation = useMutation({
    mutationFn: (data) => createGroupChat(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["chats"]);
      queryClient.invalidateQueries(["groupChats"]);
      toast.success("Group chat created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create group chat");
    },
  });

  const updateGroupChatMutation = useMutation({
    mutationFn: ({ chatId, data }) => updateGroupChat(chatId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["chats"]);
      queryClient.invalidateQueries(["chat", variables.chatId]);
      queryClient.invalidateQueries(["groupChats"]);
      toast.success("Group chat updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update group chat");
    },
  });

  const addGroupMembersMutation = useMutation({
    mutationFn: ({ chatId, memberIds }) => addGroupMembers(chatId, memberIds),
    onSuccess: (data, variables) => {
      toast.success(
        `Added ${data.data?.data?.addedCount || 0} members to group`
      );
      queryClient.invalidateQueries(["groupMembers", variables.chatId]);
      queryClient.invalidateQueries(["chats"]);
      queryClient.invalidateQueries(["groupChats"]);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to add members");
    },
  });

  const removeGroupMemberMutation = useMutation({
    mutationFn: ({ chatId, memberId }) => removeGroupMember(chatId, memberId),
    onSuccess: (data, variables) => {
      toast.success("Member removed from group");
      queryClient.invalidateQueries(["groupMembers", variables.chatId]);
      queryClient.invalidateQueries(["chats"]);
      queryClient.invalidateQueries(["groupChats"]);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to remove member");
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ chatId, memberId, role }) =>
      updateMemberRole(chatId, memberId, role),
    onSuccess: (data, variables) => {
      toast.success(`Member role updated to ${variables.role}`);
      queryClient.invalidateQueries(["groupMembers", variables.chatId]);
      queryClient.invalidateQueries(["chats"]);
      queryClient.invalidateQueries(["groupChats"]);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to update member role"
      );
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: (chatId) => leaveGroup(chatId),
    onSuccess: () => {
      toast.success("Left group successfully");
      queryClient.invalidateQueries(["chats"]);
      queryClient.invalidateQueries(["groupChats"]);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to leave group");
    },
  });

  const archiveChatMutation = useMutation({
    mutationFn: (chatId) => archiveChat(chatId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["chats"]);
      queryClient.invalidateQueries(["chat", variables]);
      queryClient.invalidateQueries(["groupChats"]);
      toast.success("Chat archived successfully");
    },
    onError: (error) => {
      toast.error("Failed to archive chat");
    },
  });

  const unarchiveChatMutation = useMutation({
    mutationFn: (chatId) => unarchiveChat(chatId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["chats"]);
      queryClient.invalidateQueries(["chat", variables]);
      queryClient.invalidateQueries(["groupChats"]);
      toast.success("Chat unarchived successfully");
    },
    onError: (error) => {
      toast.error("Failed to unarchive chat");
    },
  });

  const createOneToOneChatMutation = useMutation({
    mutationFn: (userId) => getOrCreateOneToOneChat(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["chats"]);
      queryClient.invalidateQueries(["oneToOneChats"]);
      toast.success("Chat created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create chat");
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: ({ chatId, messageId }) => markAsRead(chatId, messageId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["chats"]);
      queryClient.invalidateQueries(["chat", variables.chatId]);
      queryClient.invalidateQueries(["messages", variables.chatId]);
    },
    onError: (error) => {},
  });

  const markAsDeliveredMutation = useMutation({
    mutationFn: ({ chatId, messageId }) => markAsDelivered(chatId, messageId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["messages", variables.chatId]);
    },
    onError: (error) => {},
  });

  // Typing functions
  const startTyping = useCallback(() => {
    if (!socket || !chatId) return;

    if (!localIsTyping) {
      socket.emit("typing", { chatId });
      setLocalIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  }, [socket, chatId, localIsTyping]);

  const stopTyping = useCallback(() => {
    if (!socket || !chatId) return;

    if (localIsTyping) {
      socket.emit("stop_typing", { chatId });
      setLocalIsTyping(false);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [socket, chatId, localIsTyping]);

  const handleTypingEvent = useCallback(
    (data) => {
      if (data.chatId === chatId) {
        setLocalTypingUsers((prev) => {
          const filtered = prev.filter((user) => user.userId !== data.userId);
          return [...filtered, { userId: data.userId, name: data.userName }];
        });

        setTimeout(() => {
          setLocalTypingUsers((prev) =>
            prev.filter((user) => user.userId !== data.userId)
          );
        }, 3000);
      }
    },
    [chatId]
  );

  const handleStopTypingEvent = useCallback(
    (data) => {
      if (data.chatId === chatId) {
        setLocalTypingUsers((prev) =>
          prev.filter((user) => user.userId !== data.userId)
        );
      }
    },
    [chatId]
  );

  // Read status functions
  const markMessagesAsRead = useCallback(
    (messageId = null) => {
      if (!chatId || !user) return;

      markAsReadMutation.mutate({ chatId, messageId });

      if (socket) {
        socket.emit("mark_as_read", { chatId, messageId });
      }
    },
    [chatId, user, socket, markAsReadMutation]
  );

  const markMessageAsDelivered = useCallback(
    (messageId) => {
      if (!chatId || !messageId || !user) return;

      if (deliveredMessagesRef.has(messageId)) return;

      deliveredMessagesRef.add(messageId);

      markAsDeliveredMutation.mutate({ chatId, messageId });

      if (socket) {
        socket.emit("mark_as_delivered", { chatId, messageId });
      }
    },
    [chatId, user, socket, markAsDeliveredMutation]
  );

  const handleMessageReceived = useCallback(
    (message) => {
      if (message.sender._id !== user?._id) {
        markMessageAsDelivered(message._id);
      }
    },
    [user, markMessageAsDelivered]
  );

  const handleChatOpened = useCallback(() => {
    markMessagesAsRead();
  }, [markMessagesAsRead]);

  const markMessageAsRead = useCallback(
    (messageId) => {
      markMessagesAsRead(messageId);
    },
    [markMessagesAsRead]
  );

  // Chat management functions
  const selectChat = useCallback(
    (chat) => {
      dispatch(setCurrentChat(chat));
      dispatch(setSelectedChatId(chat?._id || null));
    },
    [dispatch]
  );

  const openCreateGroupModal = useCallback(() => {
    dispatch(setShowCreateGroupModal(true));
  }, [dispatch]);

  const closeCreateGroupModal = useCallback(() => {
    dispatch(setShowCreateGroupModal(false));
  }, [dispatch]);

  const openNewChatModal = useCallback(() => {
    dispatch(setShowNewChatModal(true));
  }, [dispatch]);

  const closeNewChatModal = useCallback(() => {
    dispatch(setShowNewChatModal(false));
  }, [dispatch]);

  const openGroupMembersModal = useCallback(() => {
    dispatch(setShowGroupMembersModal(true));
  }, [dispatch]);

  const closeGroupMembersModal = useCallback(() => {
    dispatch(setShowGroupMembersModal(false));
  }, [dispatch]);

  const addMessage = useCallback(
    (message) => {
      dispatch(addMessageToCurrentChat(message));
    },
    [dispatch]
  );

  const updateMessage = useCallback(
    (messageId, updates) => {
      dispatch(updateMessageInCurrentChat({ messageId, updates }));
    },
    [dispatch]
  );

  const removeMessage = useCallback(
    (messageId) => {
      dispatch(removeMessageFromCurrentChat(messageId));
    },
    [dispatch]
  );

  const clearChatError = useCallback(
    (errorType) => {
      dispatch(clearError(errorType));
    },
    [dispatch]
  );

  // Socket event listeners
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleMessagesRead = (data) => {
      if (data.chatId === chatId && data.userId !== user?._id) {
        // Messages read by another user
      }
    };

    const handleMessageDelivered = (data) => {
      if (data.chatId === chatId && data.userId !== user?._id) {
        // Message delivered to another user
      }
    };

    socket.on("typing", handleTypingEvent);
    socket.on("stop_typing", handleStopTypingEvent);
    socket.on("messages_read", handleMessagesRead);
    socket.on("message_delivered", handleMessageDelivered);

    return () => {
      socket.off("typing", handleTypingEvent);
      socket.off("stop_typing", handleStopTypingEvent);
      socket.off("messages_read", handleMessagesRead);
      socket.off("message_delivered", handleMessageDelivered);
    };
  }, [socket, chatId, user, handleTypingEvent, handleStopTypingEvent]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Extract data from API responses
  const apiChatsData = chatsData?.data;
  const apiGroupChatsData = groupChatsData?.data;
  const apiChattedUsersData = chattedUsersData?.data;
  const apiCurrentChatData = currentChatData?.data;
  const apiMessagesData = messagesData?.data;
  const apiGroupMembersData = groupMembersData?.data;

  const chatsList = apiChatsData?.data?.chats || [];
  const groupChatsList = apiGroupChatsData?.data?.chats || [];
  const chattedUsersList = apiChattedUsersData?.data?.users || []; // Will be empty since chattedUsersData is null
  const currentChatDetails = apiCurrentChatData?.data?.chat;
  const messagesList = apiMessagesData?.data?.messages || [];
  const groupMembersList = apiGroupMembersData?.data?.members || [];
  const unreadCount = unreadCountData?.data?.data?.unreadCount || 0;
  const totalUnreadCount =
    totalUnreadCountData?.data?.data?.totalUnreadCount || 0;

  // Return consolidated interface
  return {
    // State
    user,
    chats: chatsList,
    groupChats: groupChatsList,
    chattedUsers: chattedUsersList,
    currentChat: currentChatDetails || currentChat,
    messages: messagesList,
    groupMembers: groupMembersList,
    selectedChat,
    selectedChatId: selectedChat?._id,
    showCreateGroupModal,
    showNewChatModal,
    showGroupMembersModal,
    loading,
    errors,

    // Typing state
    isTyping: localIsTyping,
    typingUsers: localTypingUsers,

    // Read status
    unreadCount,
    totalUnreadCount,

    // Loading states
    isLoadingChats,
    isLoadingGroupChats,
    isLoadingChattedUsers,
    isLoadingCurrentChat,
    isLoadingMessages,
    isLoadingGroupMembers,
    isLoadingUnreadCount,
    isLoadingTotalUnreadCount,

    // Error states
    chatsError,
    groupChatsError,
    chattedUsersError,
    currentChatError,
    messagesError,
    groupMembersError,

    // Chat management actions
    selectChat,
    openCreateGroupModal,
    closeCreateGroupModal,
    openNewChatModal,
    closeNewChatModal,
    openGroupMembersModal,
    closeGroupMembersModal,
    addMessage,
    updateMessage,
    removeMessage,
    clearChatError,

    // Message actions
    sendMessage: sendMessageMutation.mutate,
    editMessage: editMessageMutation.mutate,
    deleteMessage: deleteMessageMutation.mutate,
    addReaction: addReactionMutation.mutate,
    removeReaction: removeReactionMutation.mutate,

    // Group management actions
    createGroupChat: createGroupChatMutation.mutate,
    updateGroupChat: updateGroupChatMutation.mutate,
    addGroupMembers: addGroupMembersMutation.mutate,
    removeGroupMember: removeGroupMemberMutation.mutate,
    updateMemberRole: updateMemberRoleMutation.mutate,
    leaveGroup: leaveGroupMutation.mutate,

    // Chat operations
    archiveChat: archiveChatMutation.mutate,
    unarchiveChat: unarchiveChatMutation.mutate,
    createOneToOneChat: createOneToOneChatMutation.mutate,

    // Typing actions
    startTyping,
    stopTyping,

    // Read status actions
    markMessagesAsRead,
    markMessageAsDelivered,
    markMessageAsRead,
    handleMessageReceived,
    handleChatOpened,

    // Refetch functions
    refetchChats,

    // Mutation states
    isSendingMessage: sendMessageMutation.isPending,
    isEditingMessage: editMessageMutation.isPending,
    isDeletingMessage: deleteMessageMutation.isPending,
    isAddingReaction: addReactionMutation.isPending,
    isRemovingReaction: removeReactionMutation.isPending,
    isCreatingGroup: createGroupChatMutation.isPending,
    isUpdatingGroup: updateGroupChatMutation.isPending,
    isAddingMembers: addGroupMembersMutation.isPending,
    isRemovingMember: removeGroupMemberMutation.isPending,
    isUpdatingRole: updateMemberRoleMutation.isPending,
    isLeavingGroup: leaveGroupMutation.isPending,
    isArchivingChat: archiveChatMutation.isPending,
    isUnarchivingChat: unarchiveChatMutation.isPending,
    isCreatingOneToOneChat: createOneToOneChatMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAsDelivered: markAsDeliveredMutation.isPending,
  };
};

// Chat Page Business Logic Hook
export const useChatPage = () => {
  const navigate = useNavigate();
  const { receiverId, groupId } = useParams();
  const { user } = useSelector((state) => state.auth);

  // Local UI state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showChatList, setShowChatList] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Use the API functions directly instead of the hook
  const queryClient = useQueryClient();

  // Get call functionality
  const { startCall } = useCall();

  // Start a one-to-one chat
  const handleStartChat = useCallback(
    async (userId) => {
      try {
        const response = await getOrCreateOneToOneChat(userId);

        const chat =
          response.data?.data?.chat || response.data?.chat || response.data;

        if (chat && chat._id) {
          setSelectedChat(chat);
          setShowChatList(false);
          navigate(`/chat/${userId}`, { replace: true });
          return { success: true, chat };
        } else {
          throw new Error("Failed to start chat with user");
        }
      } catch (error) {
        toast.error("Failed to start chat with user");
        return { success: false, error };
      }
    },
    [navigate]
  );

  // Load a group chat
  const handleLoadGroupChat = useCallback(
    async (groupId) => {
      try {
        const response = await getChatById(groupId);

        const chat =
          response.data?.data?.chat || response.data?.chat || response.data;

        if (chat && chat._id) {
          setSelectedChat(chat);
          setShowChatList(false);
          navigate(`/chat/group/${groupId}`, { replace: true });
          return { success: true, chat };
        } else {
          throw new Error("Failed to load group chat");
        }
      } catch (error) {
        toast.error("Failed to load group chat");
        return { success: false, error };
      }
    },
    [navigate]
  );

  // Show chat list without auto-selecting latest chat
  const handleShowChatList = useCallback(() => {
    // Just show the chat list, don't auto-select any chat
    setSelectedChat(null);
    setShowChatList(true);
    return { success: true };
  }, []);

  // Handle URL parameters and auto-load chats
  const handleUrlParams = useCallback(async () => {
    if (receiverId) {
      await handleStartChat(receiverId);
    } else if (groupId) {
      await handleLoadGroupChat(groupId);
    } else {
      // No specific chat requested, show chat list
      handleShowChatList();
    }
  }, [
    receiverId,
    groupId,
    handleStartChat,
    handleLoadGroupChat,
    handleShowChatList,
  ]);

  // Handle new chat creation
  const handleNewChatCreated = useCallback(
    (chat) => {
      setSelectedChat(chat);
      setShowNewChat(false);
      setShowChatList(false);
      navigate(`/chat/group/${chat._id}`, { replace: true });
      return { success: true, chat };
    },
    [navigate]
  );

  // Handle back to chat list
  const handleBackToChatList = useCallback(() => {
    setSelectedChat(null);
    setShowChatList(true);
    navigate("/chat", { replace: true });
  }, [navigate]);

  // Handle chat selection with navigation
  const handleSelectChat = useCallback(
    (chat) => {
      setSelectedChat(chat);
      setShowChatList(false);

      // Navigate to the appropriate chat URL
      if (chat.isOneToOne) {
        const otherParticipant = chat.participants?.find(
          (p) => p.user?._id !== user?._id
        );
        if (otherParticipant?.user?._id) {
          navigate(`/chat/${otherParticipant.user._id}`, { replace: true });
        }
      } else {
        navigate(`/chat/group/${chat._id}`, { replace: true });
      }

      return { success: true, chat };
    },
    [navigate, user]
  );

  // Handle video call with better integration
  const handleVideoCall = useCallback(
    async (chat) => {
      if (!chat) {
        toast.error("No chat selected for video call");
        return { success: false, error: "No chat selected" };
      }

      try {
        // Start the call using just the chatId as expected by useCall
        await startCall(chat._id);

        const chatName =
          chat.name || chat.participants?.[0]?.user?.name || "Unknown Chat";
        toast.success(`Video call initiated with ${chatName}`);
        return { success: true };
      } catch (error) {
        toast.error("Error starting video call: " + error.message);
        return { success: false, error: error.message };
      }
    },
    [startCall]
  );

  // Handle call history navigation
  const handleCallHistory = useCallback(() => {
    navigate("/call-history");
  }, [navigate]);

  // Handle create group
  const handleCreateGroup = useCallback(() => {
    setShowCreateGroup(true);
  }, []);

  // Handle modal close
  const handleCloseModal = useCallback((modalType) => {
    switch (modalType) {
      case "newChat":
        setShowNewChat(false);
        break;
      case "createGroup":
        setShowCreateGroup(false);
        break;
      default:
        break;
    }
  }, []);

  // Handle modal open
  const handleOpenModal = useCallback((modalType) => {
    switch (modalType) {
      case "newChat":
        setShowNewChat(true);
        break;
      case "createGroup":
        setShowCreateGroup(true);
        break;
      default:
        break;
    }
  }, []);

  // Handle chat archive
  const handleArchive = useCallback((chat, onChatSelect) => {
    if (!chat?._id) return;

    // TODO: Implement archive functionality with React Query mutation
    // For now, just navigate away from the chat
    if (onChatSelect) {
      onChatSelect(null);
    }
    return { success: true, chatId: chat._id };
  }, []);

  // Handle chat delete
  const handleDelete = useCallback((chat, onChatSelect) => {
    if (!chat?._id) return;

    // TODO: Implement delete functionality with React Query mutation
    // For now, just navigate away from the chat
    if (onChatSelect) {
      onChatSelect(null);
    }
    return { success: true, chatId: chat._id };
  }, []);

  // Handle chat info
  const handleInfo = useCallback((chat) => {
    if (chat.type === "group") {
      // This would typically open a group info modal
      return { success: true, action: "showGroupInfo", chat };
    }
    return { success: true, action: "showUserInfo", chat };
  }, []);

  // Show chat list when no specific chat is selected
  useEffect(() => {
    if (!selectedChat && !receiverId && !groupId) {
      handleShowChatList();
    }
  }, [selectedChat, receiverId, groupId, handleShowChatList]);

  return {
    // State
    showCreateGroup,
    showNewChat,
    selectedChat,
    showChatList,
    searchQuery,

    // Actions
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
    handleArchive,
    handleDelete,
    handleInfo,
    handleShowChatList,

    // Setters
    setSelectedChat,
    setShowChatList,
    setSearchQuery,

    // Modal states
    setShowCreateGroup,
    setShowNewChat,
  };
};

// Additional hooks for ChatPageRedux
export const useChatManager = () => {
  const dispatch = useDispatch();
  const currentChat = useSelector(selectCurrentChat);
  const selectedChatId = useSelector(selectSelectedChat)?._id;
  const showCreateGroupModal = useSelector(selectShowCreateGroupModal);
  const showNewChatModal = useSelector(selectShowNewChatModal);

  const selectChat = useCallback(
    (chat) => {
      dispatch(selectChat(chat));
    },
    [dispatch]
  );

  const openCreateGroupModal = useCallback(() => {
    dispatch(openCreateGroupModal());
  }, [dispatch]);

  const closeCreateGroupModal = useCallback(() => {
    dispatch(closeCreateGroupModal());
  }, [dispatch]);

  const openNewChatModal = useCallback(() => {
    dispatch(openNewChatModal());
  }, [dispatch]);

  const closeNewChatModal = useCallback(() => {
    dispatch(closeNewChatModal());
  }, [dispatch]);

  return {
    currentChat,
    selectedChatId,
    showCreateGroupModal,
    showNewChatModal,
    selectChat,
    openCreateGroupModal,
    closeCreateGroupModal,
    openNewChatModal,
    closeNewChatModal,
  };
};

export const useCreateGroupChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroupChat,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["chats"]);
      queryClient.invalidateQueries(["groupChats"]);
      toast.success("Group chat created successfully");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to create group chat"
      );
    },
  });
};

export const useCreateOneToOneChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: getOrCreateOneToOneChat,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["chats"]);
      queryClient.invalidateQueries(["oneToOneChats"]);
      toast.success("Chat started successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to start chat");
    },
  });
};

export const useChatQuery = (chatId) => {
  return useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => getChatById(chatId),
    enabled: !!chatId,
    staleTime: 30000,
  });
};
