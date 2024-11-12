import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { fetchRequests, createRequest, deleteRequest } from '../lib/api';
import { useStore } from '../store';
import { CollabRequest } from '../types';

export function useRequests() {
  return useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      try {
        console.log('Fetching requests...');
        const data = await fetchRequests();
        console.log('Response:', data);
        return data;
      } catch (error) {
        console.error('Error fetching requests:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const setError = useStore((state) => state.setError);

  return useMutation({
    mutationFn: createRequest,
    onSuccess: (newRequest) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      useStore.getState().addRequest(newRequest);
    },
    onError: (error: Error) => {
      const errorMessage = error?.message || 'Failed to create request';
      console.error('Create request error:', errorMessage);
      setError(errorMessage);
    },
  });
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();
  const setError = useStore((state) => state.setError);

  return useMutation({
    mutationFn: deleteRequest,
    onMutate: async (requestId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['requests'] });

      // Get the current requests
      const previousRequests = queryClient.getQueryData<CollabRequest[]>(['requests']);

      // Optimistically update the cache
      queryClient.setQueryData<CollabRequest[]>(['requests'], (old = []) => 
        old.filter(request => request.id !== requestId)
      );

      return { previousRequests };
    },
    onSuccess: (_, requestId) => {
      // Update the store
      useStore.getState().removeRequest(requestId);
    },
    onError: (error: Error, _, context) => {
      // Revert the optimistic update
      queryClient.setQueryData(['requests'], context?.previousRequests);
      const errorMessage = error?.message || 'Failed to delete request';
      console.error('Delete request error:', errorMessage);
      setError(errorMessage);
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    }
  });
}