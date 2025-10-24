import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserPreferences, updateUserPreferences } from '../services/userPreferencesService';
import { UpdateUserPreferencesRequest, UserPreferences } from '../types';

/**
 * Custom hook for managing user preferences
 */
export function useUserPreferences() {
  const queryClient = useQueryClient();

  // Query for fetching user preferences
  const {
    data: preferences,
    isLoading,
    error,
    refetch,
  } = useQuery<UserPreferences, Error>({
    queryKey: ['userPreferences'],
    queryFn: getUserPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Mutation for updating user preferences
  const updateMutation = useMutation<
    UserPreferences,
    Error,
    UpdateUserPreferencesRequest
  >({
    mutationFn: updateUserPreferences,
    onSuccess: (data) => {
      // Update the cache with new preferences
      queryClient.setQueryData(['userPreferences'], data);
    },
  });

  return {
    preferences,
    isLoading,
    error,
    refetch,
    updatePreferences: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}
