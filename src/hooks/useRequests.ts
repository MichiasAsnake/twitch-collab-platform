import { useQuery, useMutation, useQueryClient } from 'react-query';
import { fetchRequests, createRequest } from '../lib/api';
import { useStore } from '../store';

export function useRequests() {
  return useQuery('requests', fetchRequests);
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
      setError(error.message);
    },
  });
}