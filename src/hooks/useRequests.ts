import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { fetchRequests, createRequest, deleteRequest } from '../lib/api';
import { useStore } from '../store';
import { CollabRequest, CreateRequestPayload } from '../types';

export function useRequests() {
  return useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      try {
        const data = await fetchRequests();
        return data;
      } catch (error) {
        console.error('Error fetching requests:', error);
        throw error;
      }
    },
    refetchOnMount: true,
    staleTime: 0
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const setError = useStore((state) => state.setError);

  return useMutation({
    mutationFn: async (data: CreateRequestPayload) => {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('twitch_token')}`
        },
        body: JSON.stringify({
          ...data,
          language: data.language || null // Ensure language is explicitly set
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    }
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