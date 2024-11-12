export interface User {
  id: string;
  displayName: string;
  profileImageUrl: string;
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  requestId: string;
  requestTitle: string;
  fromUser: User;
  toUser: User;
} 