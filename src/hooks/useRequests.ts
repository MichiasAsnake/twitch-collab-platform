import { useQuery, useMutation, useQueryClient } from 'react-query';
import { fetchRequests, createRequest } from '../lib/api';
import { useStore } from '../store';
import { CollabRequest } from '../types';

export function useRequests() {
  return useQuery<CollabRequest[], Error>('requests', fetchRequests, {
    onError: (error) => {
      console.error('Failed to fetch requests:', error.message);
    }
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const setError = useStore((state) => state.setError);

  return useMutation(createRequest, {
    onSuccess: (newRequest) => {
      queryClient.invalidateQueries('requests');
      useStore.getState().addRequest(newRequest);
    },
    onError: (error: Error) => {
      const errorMessage = error?.message || 'Failed to create request';
      console.error('Create request error:', errorMessage);
      setError(errorMessage);
    },
  });
}