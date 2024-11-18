export interface TwitchUser {
  id: string;
  login: string;
  displayName: string;
  profileImageUrl: string;
  isLive: boolean;
  category?: string;
  title?: string;
}

export interface CollabRequest {
  id: string;
  userId: string;
  title: string;
  description: string;
  categories: string[];
  createdAt: string;
  user: TwitchUser;
  language?: string | null;
}

export interface Message {
  id: string;
  fromUser: TwitchUser;
  toUser: TwitchUser;
  content: string;
  createdAt: string;
  requestId?: string;
  read: boolean;
  conversationId: string;
}

export interface Conversation {
  id: string;
  participants: TwitchUser[];
  requestId: string;
  lastMessage: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface User {
  id: string;
  displayName: string;
  profileImageUrl: string;
}

export type Category = 'Just Chatting' | 'Rust' | 'GTA' | 'Call of Duty';

export interface CreateRequestPayload {
  title: string;
  description: string;
  categories: string[];
  userId: string;
  user: {
    id: string;
    login: string;
    displayName: string;
    profileImageUrl: string;
    isLive: boolean;
    category?: string;
    title?: string;
  };
  language?: string;
}

export interface StreamerStatus {
  userId: string;
  isLive: boolean;
}

export interface Request {
  id: string;
  categories: Category[];
  language: string;
  user: {
    id: string;
    isLive: boolean;
  };
  // ... add any other properties your Request type needs
}