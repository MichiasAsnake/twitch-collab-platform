import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TwitchUser, CollabRequest, Message } from './types';
import { socket } from './lib/socket';

interface AuthState {
  token: string | null;
  clientId: string;
}

interface User {
  id: string;
  displayName: string;
  profileImageUrl: string;
  isLive: boolean;
}

interface State {
  user: User | null;
  messages: Message[];
  darkMode: boolean;
  error: string | null;
  auth: AuthState;
  setUser: (user: User | null) => void;
  addMessage: (message: Message) => void;
  markMessageAsRead: (messageId: string) => void;
  getUnreadCount: () => number;
  toggleDarkMode: () => void;
  setError: (error: string | null) => void;
  setAuth: (auth: Partial<AuthState>) => void;
  clearAuth: () => void;
  setMessagesRead: (fromUserId: string) => void;
  updateUserStatus: (userId: string, isLive: boolean) => void;
  setMessages: (messages: Message[]) => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      user: null,
      messages: [],
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      error: null,
      auth: {
        token: localStorage.getItem('twitch_token'),
        clientId: import.meta.env.VITE_TWITCH_CLIENT_ID
      },
      setUser: (user) => {
        if (user) {
          socket.emit('join', user.id);
        }
        set({ user });
      },
      addMessage: (message) => set((state) => {
        if (state.messages.some(m => m.id === message.id)) {
          return { messages: state.messages };
        }
        
        return {
          messages: [{
            ...message,
            read: message.fromUser.id === state.user?.id
          }, ...state.messages]
        };
      }),
      markMessageAsRead: (messageId) => set((state) => ({
        messages: state.messages.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      })),
      getUnreadCount: () => {
        const state = get();
        return state.messages.filter(msg => 
          !msg.read && 
          msg.toUser?.id === state.user?.id && 
          msg.fromUser?.id !== state.user?.id
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
      },
      setMessagesRead: (fromUserId) => 
        set(state => ({
          messages: state.messages.map(msg => 
            (msg.fromUser.id === fromUserId || msg.toUser.id === fromUserId)
              ? { ...msg, read: true }
              : msg
          )
        })),
      updateUserStatus: (userId: string, isLive: boolean) => 
        set((state) => ({
          user: state.user?.id === userId 
            ? { ...state.user, isLive }
            : state.user
        })),
      setMessages: (messages) => set({ messages }),
    }),
    {
      name: 'twitch-collab-storage',
      partialize: (state) => ({
        messages: state.messages,
        darkMode: state.darkMode,
      }),
    }
  )
);