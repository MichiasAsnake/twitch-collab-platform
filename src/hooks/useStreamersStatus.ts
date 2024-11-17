import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { socket } from '../lib/socket';

interface StreamerStatus {
  userId: string;
  isLive: boolean;
}

export function useStreamersStatus(userIds: string[] = []) {
  const queryClient = useQueryClient();
  const queryKey = ['streamers-status', userIds];

  const handleStatusUpdate = useCallback(({ userId, isLive }: StreamerStatus) => {
    if (!userIds.includes(userId)) return;
    
    queryClient.setQueryData<StreamerStatus[]>(queryKey, (oldData = []) => {
      const existingIndex = oldData.findIndex(status => status.userId === userId);
      if (existingIndex >= 0 && oldData[existingIndex].isLive === isLive) {
        return oldData;
      }
      
      const newData = existingIndex >= 0 
        ? [...oldData.slice(0, existingIndex), { userId, isLive }, ...oldData.slice(existingIndex + 1)]
        : [...oldData, { userId, isLive }];
      
      return newData;
    });
  }, [queryClient, queryKey, userIds]);

  useEffect(() => {
    if (!userIds?.length) return;

    const requestedIds = new Set();
    userIds.forEach(userId => {
      if (!requestedIds.has(userId)) {
        socket.emit('checkStatus', userId);
        requestedIds.add(userId);
      }
    });

    socket.on('statusUpdate', handleStatusUpdate);
    socket.on('statusResponse', handleStatusUpdate);

    return () => {
      socket.off('statusUpdate', handleStatusUpdate);
      socket.off('statusResponse', handleStatusUpdate);
    };
  }, [userIds, handleStatusUpdate]);

  const { data } = useQuery({
    queryKey,
    queryFn: () => Promise.resolve([]) as Promise<StreamerStatus[]>,
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  return {
    data: data || [],
    isLive: data?.some(status => status.isLive) || false
  };
} 