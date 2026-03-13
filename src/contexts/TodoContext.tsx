import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { Todo, Project, Comment, ViewMode, Visibility } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';

interface TodoContextType {
  // Projects
  projects: Project[];
  currentProjectId: string | null;
  setCurrentProjectId: (id: string) => void;
  addProject: (
    name: string,
    description: string,
    createdBy: string,
  ) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Todos
  todos: Todo[];
  filteredTodos: Todo[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  categories: string[];

  // Actions
  addTodo: (
    title: string,
    description: string,
    category: string,
    createdBy: string,
    visibility?: Visibility,
    visibleMembers?: string[],
  ) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;

  // Comments
  getComments: (todoId: string) => Promise<Comment[]>;
  addComment: (
    todoId: string,
    content: string,
    createdBy: string,
  ) => Promise<Comment>;
  deleteComment: (commentId: string) => Promise<void>;

  refreshData: () => Promise<void>;
  loading: boolean;
}

const TodoContext = createContext<TodoContextType | null>(null);

export function TodoProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(
    () => localStorage.getItem('lgyxCurrentProjectId') || null,
  );

  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem('lgyxCurrentProjectId', currentProjectId);
    } else {
      localStorage.removeItem('lgyxCurrentProjectId');
    }
  }, [currentProjectId]);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [projs, tds] = await Promise.all([
        api.getProjects(),
        api.getTodos(),
      ]);
      setProjects(projs);
      if (projs.length > 0 && !currentProjectId) {
        setCurrentProjectId(projs[0].id);
      }
      tds.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setTodos(tds);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }, [currentProjectId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addProject = useCallback(
    async (name: string, description: string, createdBy: string) => {
      const proj = await api.createProject({ name, description, createdBy });
      await refreshData();
      setCurrentProjectId(proj.id);
    },
    [refreshData],
  );

  const updateProject = useCallback(
    async (id: string, updates: Partial<Project>) => {
      await api.updateProject(id, updates);
      await refreshData();
    },
    [refreshData],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      await api.deleteProject(id);
      if (currentProjectId === id) setCurrentProjectId('');
      await refreshData();
    },
    [currentProjectId, refreshData],
  );

  // Filter displayed todos by project AND visibility rules
  const projectTodos = useMemo(() => {
    if (!currentProjectId) return [];
    let list = todos.filter((t) => t.projectId === currentProjectId);

    // Apply visibility rules
    list = list.filter((t) => {
      if (t.visibility === 'all') return true;
      if (t.createdBy === currentUser?.id) return true; // Creator always sees their own
      if (
        t.visibility === 'members' &&
        t.visibleMembers?.includes(currentUser?.id || '')
      )
        return true;
      return false; // 'none' or 'self' created by others
    });

    return list;
  }, [todos, currentProjectId, currentUser]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    projectTodos.forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats).sort();
  }, [projectTodos]);

  // Filter by active category
  const filteredTodos = useMemo(() => {
    if (activeCategory === '全部') return projectTodos;
    return projectTodos.filter((t) => t.category === activeCategory);
  }, [projectTodos, activeCategory]);

  const addTodo = useCallback(
    async (
      title: string,
      description: string,
      category: string,
      createdBy: string,
      visibility: Visibility = 'all',
      visibleMembers: string[] = [],
    ) => {
      if (!currentProjectId) return;
      await api.createTodo({
        title,
        description,
        category,
        createdBy,
        projectId: currentProjectId,
        visibility,
        visibleMembers,
      });
      await refreshData();
    },
    [currentProjectId, refreshData],
  );

  const updateTodo = useCallback(
    async (id: string, updates: Partial<Todo>) => {
      await api.updateTodo(id, updates);
      await refreshData();
    },
    [refreshData],
  );

  const deleteTodo = useCallback(
    async (id: string) => {
      await api.deleteTodo(id);
      await refreshData();
    },
    [refreshData],
  );

  // Comments
  const getComments = useCallback(async (todoId: string) => {
    return api.getComments(todoId);
  }, []);

  const addComment = useCallback(
    async (todoId: string, content: string, createdBy: string) => {
      return api.createComment(todoId, { content, createdBy });
    },
    [],
  );

  const deleteComment = useCallback(async (commentId: string) => {
    await api.deleteComment(commentId);
  }, []);

  // Filter displayed projects by visibility rules
  const accessibleProjects = useMemo(() => {
    return projects.filter((p) => {
      if (p.visibility === 'all') return true;
      if (p.ownerId === currentUser?.id || p.createdBy === currentUser?.id)
        return true;
      if (
        p.visibility === 'members' &&
        p.visibleMembers?.includes(currentUser?.id || '')
      )
        return true;
      return false; // 'none' or 'self' for non-owners
    });
  }, [projects, currentUser]);

  return (
    <TodoContext.Provider
      value={{
        projects: accessibleProjects,
        currentProjectId,
        setCurrentProjectId,
        addProject,
        updateProject,
        deleteProject,
        todos: projectTodos,
        filteredTodos,
        viewMode,
        setViewMode,
        activeCategory,
        setActiveCategory,
        categories,
        addTodo,
        updateTodo,
        deleteTodo,
        getComments,
        addComment,
        deleteComment,
        refreshData,
        loading,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
}

export function useTodos() {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error('useTodos must be used within TodoProvider');
  return ctx;
}
