import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { searchUsers, getCurrentUser, getUserRoles, updateUserRole } from '../api/userApi';
import { toast } from 'react-hot-toast';

export const useCurrentUser = () => {
  const { user } = useSelector((state) => state.auth);
  
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    enabled: !!user,
    staleTime: 300000, // 5 minutes
  });
};

export const useUserSearch = (query, enabled = true) => {
  const { user } = useSelector((state) => state.auth);
  
  return useQuery({
    queryKey: ['userSearch', query],
    queryFn: () => searchUsers({ query }),
    enabled: enabled && !!user && query && query.length >= 2,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
};

export const useUserRoles = () => {
  const { user } = useSelector((state) => state.auth);
  
  return useQuery({
    queryKey: ['userRoles'],
    queryFn: getUserRoles,
    enabled: !!user,
    staleTime: 300000, // 5 minutes
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, role }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries(['userRoles']);
      queryClient.invalidateQueries(['currentUser']);
      toast.success('User role updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update user role');
    },
  });
};
