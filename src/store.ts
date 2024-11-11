import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TwitchUser, CollabRequest, Message } from './types';

interface Store {
  user: TwitchUser | null;
  requests: CollabRequest[];
  messages: Message[];
  darkMode: boolean;
  error: string | null;
  setUser: (user: TwitchUser | null) => void;
  setRequests: (requests: CollabRequest[]) => void;
  addRequest: (request: CollabRequest) => void;
  addMessage: (message: Message) => void;
  markMessageAsRead: (messageId: string) => void;
  getUnreadCount: () => number;
  toggleDarkMode: () => void;
  setError: (error: string | null) => void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      user: null,
      requests: [],
      messages: [],
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      error: null,
      setUser: (user) => set({ user }),
      setRequests: (requests) => set({ requests }),
      addRequest: (request) => set((state) => ({ 
        requests: [request, ...state.requests] 
      })),
      addMessage: (message) => set((state) => ({
        messages: [message, ...state.messages]
      })),
      markMessageAsRead: (messageId) => set((state) => ({
        messages: state.messages.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      })),
      getUnreadCount: () => {
        const state = get();
        return state.messages.filter(msg => 
          !msg.read && msg.toUser.id === state.user?.id
        ).length;
      },
      toggleDarkMode: () => set((state) => ({ 
        darkMode: !state.darkMode 
      })),
      setError: (error) => set({ error }),
    }),
    {
      name: 'twitch-collab-storage',
      partialize: (state) => ({
        requests: state.requests,
        messages: state.messages,
        darkMode: state.darkMode,
      }),
    }
  )
);