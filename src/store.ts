import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TwitchUser, CollabRequest, Message } from './types';

interface AuthState {
  token: string | null;
  clientId: string;
}

interface User {
  id: string;
  displayName: string;
  profileImageUrl: string;
}

interface State {
  user: User | null;
  requests: CollabRequest[];
  messages: Message[];
  darkMode: boolean;
  error: string | null;
  auth: AuthState;
  setUser: (user: User | null) => void;
  setRequests: (requests: CollabRequest[]) => void;
  addRequest: (request: CollabRequest) => void;
  addMessage: (message: Message) => void;
  markMessageAsRead: (messageId: string) => void;
  getUnreadCount: () => number;
  toggleDarkMode: () => void;
  setError: (error: string | null) => void;
  setAuth: (auth: Partial<AuthState>) => void;
  clearAuth: () => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      user: null,
      requests: [],
      messages: [],
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      error: null,
      auth: {
        token: localStorage.getItem('twitch_token'),
        clientId: import.meta.env.VITE_TWITCH_CLIENT_ID
      },
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
      setAuth: (auth) => {
        set((state) => ({
          auth: { ...state.auth, ...auth }
        }));
        if (auth.token) {
          localStorage.setItem('twitch_token', auth.token);
        }
      },
      clearAuth: () => {
        localStorage.removeItem('twitch_token');
        set((state) => ({
          auth: { ...state.auth, token: null },
          user: null
        }));
      }
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