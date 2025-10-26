import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChatMessages, sendMessage, editMessage, deleteMessage, addReaction } from '../api/chatApi';

export const useMessages = (chatId, options = {}) => {
  const { page = 1, limit = 20, enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', chatId, page, limit],
    queryFn: () => getChatMessages(chatId, { page, limit }),
    enabled: enabled && !!chatId,
    staleTime: 30000, // 30 seconds - increased to reduce refetches
    gcTime: 1000 * 60 * 5, // 5 minutes cache time
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchInterval: false, // Disable automatic refetch
    // Add retry configuration for better reliability
    retry: (failureCount, error) => {
      // Don't retry on 404 (chat not found)
      if (error?.response?.status === 404) return false;
      // Only retry once to reduce requests
      return failureCount < 1;
    },
    retryDelay: 2000, // Increased delay
  });

  // Add real-time invalidation when messages are received
  React.useEffect(() => {
    if (!chatId) return;

    let lastInvalidation = 0;
    const INVALIDATION_THROTTLE = 1000; // Only invalidate once per second

    const handleNewMessage = (data) => {
      if (data.chatId === chatId) {
        const now = Date.now();
        
        // Throttle invalidations to prevent too many requests
        if (now - lastInvalidation < INVALIDATION_THROTTLE) {
          return;
        }
        
        lastInvalidation = now;

        // Only invalidate messages for this chat, not all queries
        queryClient.invalidateQueries(['messages', chatId]);
      }
    };

    const handleReconnect = () => {
      // Sync messages after reconnection
      console.log('🔄 Socket reconnected - syncing messages');
      queryClient.invalidateQueries(['messages', chatId]);
    };

    // Listen for socket events if socket is available
    if (typeof window !== 'undefined' && window.socket) {
      // Remove any existing listeners first to prevent duplicates
      window.socket.off('new_message', handleNewMessage);
      window.socket.off('reconnect', handleReconnect);
      
      // Add listeners
      window.socket.on('new_message', handleNewMessage);
      window.socket.on('reconnect', handleReconnect);
    }

    return () => {
      // Clean up listeners on unmount or chatId change
      if (typeof window !== 'undefined' && window.socket) {
        window.socket.off('new_message', handleNewMessage);
        window.socket.off('reconnect', handleReconnect);
      }
    };
  }, [chatId, queryClient]);

  return query;
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessage,
    // Optimistic update - show message immediately
    onMutate: async (variables) => {
      const { chatId, content, type, media, replyTo, tempId } = variables;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(['messages', chatId]);
      
      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(['messages', chatId, 1, 20]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['messages', chatId, 1, 20], (old) => {
        if (!old) return old;
        
        // Create optimistic message
        const optimisticMessage = {
          _id: tempId || `temp_${Date.now()}`,
          chat: chatId,
          sender: {
            _id: 'current_user',
            name: 'You',
            avatar: null
          },
          content,
          type: type || 'text',
          media,
          replyTo,
          createdAt: new Date().toISOString(),
          readBy: [],
          deliveredTo: [],
          isOptimistic: true // Flag to identify optimistic messages
        };
        
        // Add to messages array
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              messages: [...(old.data.data.messages || []), optimisticMessage]
            }
          }
        };
      });
      
      // Return context with previous data for rollback
      return { previousMessages, chatId };
    },
    onSuccess: (data, variables) => {
      // Only invalidate messages for this specific chat
      // Don't invalidate 'chats' here - let socket handle it
      queryClient.invalidateQueries(['messages', variables.chatId]);
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['messages', context.chatId, 1, 20],
          context.previousMessages
        );
      }
    },
  });
};

export const useEditMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, content, chatId }) => editMessage(messageId, { content }),
    onSuccess: (data, variables) => {
      // Invalidate messages query to refetch
      queryClient.invalidateQueries(['messages', variables.chatId]);
    },
    onError: (error) => {
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, chatId }) => deleteMessage(messageId),
    onSuccess: (data, variables) => {
      // Invalidate messages query to refetch
      queryClient.invalidateQueries(['messages', variables.chatId]);
    },
    onError: (error) => {
    },
  });
};

export const useAddReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, messageId, emoji }) => addReaction(chatId, messageId, emoji),
    onSuccess: (data, variables) => {
      // Invalidate messages query to refetch
      queryClient.invalidateQueries(['messages', variables.chatId]);
    },
    onError: (error) => {
    },
  });
};
