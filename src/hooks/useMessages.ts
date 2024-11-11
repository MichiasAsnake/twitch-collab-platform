import { useQuery, useMutation, useQueryClient } from 'react-query';
import { fetchMessages, sendMessage, fetchUserMessages } from '../lib/api';
import { useStore } from '../store';

export function useMessages(requestId: string) {
  const user = useStore((state) => state.user);

  return useQuery(
    ['messages', requestId],
    () => fetchMessages(requestId),
    {
      enabled: !!user,
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
      setError(error.message);
    },
  });
}

export function useUserMessages(userId: string | undefined) {
  return useQuery(
    ['userMessages', userId],
    () => fetchUserMessages(userId!),
    {
      enabled: !!userId,
    }
  );