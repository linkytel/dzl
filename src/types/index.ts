export interface User {
  id: string;
  name: string;
  createdAt: string;
}

// visibility: 'all' = 所有人可见, 'self' = 仅自己可见, 'members' = 指定成员可见, 'none' = 不可见
export type Visibility = 'all' | 'self' | 'members' | 'none';

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdBy: string;
  visibility: Visibility;
  visibleMembers: string[];
  createdAt: string;
}

export interface Todo {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'done';
  category: string;
  visibility: Visibility;
  visibleMembers: string[];
  createdBy: string;
  projectId: string;
  commentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  todoId: string;
  createdBy: string;
  createdAt: string;
}

export type ViewMode = 'list' | 'month' | 'day';

export interface AuthState {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
}
