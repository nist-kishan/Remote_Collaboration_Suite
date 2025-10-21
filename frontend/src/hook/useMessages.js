import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChatMessages, sendMessage, editMessage, deleteMessage, addReaction } from '../api/chatApi';

export const useMessages = (chatId, options = {}) => {
  const { page = 1, limit = 20, enabled = true } = options;

  return useQuery({
    queryKey: ['messages', chatId, page, limit],
    queryFn: () => getChatMessages(chatId, { page, limit }),
    enabled: enabled && !!chatId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (data, variables) => {
      // Invalidate messages query to refetch
      queryClient.invalidateQueries(['messages', variables.chatId]);
      // Invalidate chats query to update last message
      queryClient.invalidateQueries(['chats']);
    },
    onError: (error) => {
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
    mutationFn: ({ messageId, reaction, chatId }) => addReaction(messageId, { reaction }),
    onSuccess: (data, variables) => {
      // Invalidate messages query to refetch
      queryClient.invalidateQueries(['messages', variables.chatId]);
    },
    onError: (error) => {
    },
  });
};
