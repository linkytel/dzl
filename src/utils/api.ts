import type { User, Project, Todo, Comment } from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败。' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Users
  getUsers: () => request<User[]>('/users'),
  createUser: (name: string, password: string) =>
    request<User>('/users', {
      method: 'POST',
      body: JSON.stringify({ name, password }),
    }),
  login: (name: string, password: string) =>
    request<User>('/auth', {
      method: 'POST',
      body: JSON.stringify({ name, password }),
    }),

  // Projects
  getProjects: () => request<Project[]>('/projects'),
  createProject: (data: {
    name: string;
    description: string;
    createdBy: string;
  }) =>
    request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProject: (id: string, data: Partial<Project>) =>
    request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    request<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Todos
  getTodos: () => request<Todo[]>('/todos'),
  createTodo: (data: {
    title: string;
    description: string;
    category: string;
    createdBy: string;
    projectId: string;
    visibility?: string;
    visibleMembers?: string[];
  }) => request<Todo>('/todos', { method: 'POST', body: JSON.stringify(data) }),
  updateTodo: (id: string, data: Partial<Todo>) =>
    request<Todo>(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTodo: (id: string) =>
    request<void>(`/todos/${id}`, { method: 'DELETE' }),

  // Comments
  getComments: (todoId: string) =>
    request<Comment[]>(`/todos/${todoId}/comments`),
  createComment: (
    todoId: string,
    data: { content: string; createdBy: string },
  ) =>
    request<Comment>(`/todos/${todoId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteComment: (id: string) =>
    request<void>(`/comments/${id}`, { method: 'DELETE' }),
};
