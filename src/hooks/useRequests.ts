import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { fetchRequests, createRequest, deleteRequest } from '../lib/api';
import { useStore } from '../store';
import { CollabRequest } from '../types';
import { socket } from '../lib/socket';
import { useEffect } from 'react';

export function useRequests() {
  const queryClient = useQueryClient();

  useEffect(() => {
    socket.on('statusUpdate', (data) => {
      console.log('[Socket] Received status update:', data);
      
      // Update the requests data
      queryClient.setQueryData<CollabRequest[]>(['requests'], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((request) => {
          if (request.user.id === data.userId) {
            console.log(`Updating status for ${data.userId} to ${data.isLive}`);
            return {
              ...request,
              user: {
                ...request.user,
                isLive: data.isLive
              }
            };
          }
          return request;
        });
      });
    });

    return () => {
      socket.off('statusUpdate');
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['requests'],
    queryFn: fetchRequests,
    refetchInterval: 60000, // Refetch every minute as backup
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const setError = useStore((state) => state.setError);

  return useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    }
  });
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRequest,
    onMutate: async (requestId) => {
      await queryClient.cancelQueries({ queryKey: ['requests'] });
      const previousRequests = queryClient.getQueryData<CollabRequest[]>(['requests']);
      queryClient.setQueryData<CollabRequest[]>(['requests'], (old = []) => 
        old.filter(request => request.id !== requestId)
      );
      return { previousRequests };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    }
  });
}