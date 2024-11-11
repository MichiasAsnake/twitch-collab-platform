import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Message } from '../types';
import { fetchMessages, sendMessage, fetchUserMessages } from '../lib/api';
import { useStore } from '../store';

export function useMessages(requestId: string) {
  const user = useStore((state) => state.user);
  const setError = useStore((state) => state.setError);

  return useQuery<Message[], Error>(
    ['messages', requestId],
    () => fetchMessages(requestId),
    {
      enabled: !!user,
      onError: (error) => {
        const errorMessage = error?.message || 'Failed to fetch messages';
        console.error('Messages error:', errorMessage);
        setError(errorMessage);
      },
    }
  );
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const setError = useStore((state) => state.setError);

  return useMutation(sendMessage, {
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries('messages');
      useStore.getState().addMessage(newMessage);
    },
    onError: (error: Error) => {
      const errorMessage = error?.message || 'Failed to send message';
      console.error('Send message error:', errorMessage);
      setError(errorMessage);
    },
  });
}

export function useUserMessages(userId: string | undefined) {
  const setError = useStore((state) => state.setError);

  return useQuery<Message[], Error>(
    ['userMessages', userId],
    () => fetchUserMessages(userId!),
    {
      enabled: !!userId,
      onError: (error) => {
        const errorMessage = error?.message || 'Failed to fetch user messages';
        console.error('User messages error:', errorMessage);
        setError(errorMessage);
      },
    }
  );
}