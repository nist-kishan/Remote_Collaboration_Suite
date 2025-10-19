import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { 
  sendMessage, 
  getChatMessages, 
  editMessage, 
  deleteMessage, 
  addReaction, 
  removeReaction, 
  markAsRead 
} from '../api/chatApi';
import { toast } from 'react-hot-toast';

export const useMessages = (chatId, params = {}) => {
  const { user } = useSelector((state) => state.auth);
  
  return useQuery({
    queryKey: ['messages', chatId, params],
    queryFn: () => getChatMessages(chatId, params),
    enabled: !!user && !!chatId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    keepPreviousData: true, // Keep previous data while fetching new page
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chatId, data }) => sendMessage(chatId, data),
    onSuccess: (data, variables) => {
      // Invalidate messages for this chat
      queryClient.invalidateQueries(['messages', variables.chatId]);
      // Invalidate chats to update last message
      queryClient.invalidateQueries(['chats']);
    },
    onError: (error) => {
      toast.error('Failed to send message');
    },
  });
};

export const useEditMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chatId, messageId, content }) => editMessage(chatId, messageId, content),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['messages', variables.chatId]);
      toast.success('Message edited successfully');
    },
    onError: (error) => {
      toast.error('Failed to edit message');
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chatId, messageId }) => deleteMessage(chatId, messageId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['messages', variables.chatId]);
      toast.success('Message deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete message');
    },
  });
};

export const useAddReaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chatId, messageId, emoji }) => addReaction(chatId, messageId, emoji),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['messages', variables.chatId]);
    },
    onError: (error) => {
      toast.error('Failed to add reaction');
    },
  });
};

export const useRemoveReaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chatId, messageId, emoji }) => removeReaction(chatId, messageId, emoji),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['messages', variables.chatId]);
    },
    onError: (error) => {
      toast.error('Failed to remove reaction');
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chatId) => markAsRead(chatId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['messages', variables]);
      queryClient.invalidateQueries(['chats']);
    },
    onError: (error) => {
    },
  });
};
