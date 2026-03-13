import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from '../types';
import { api } from '../utils/api';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (name: string, password: string) => Promise<void>;
  register: (name: string, password: string) => Promise<void>;
  switchUser: (name: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUsers: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const refreshUsers = useCallback(async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch {
      // silent fail on refresh
    }
  }, []);

  useEffect(() => {
    refreshUsers();
    // restore session
    const saved = localStorage.getItem('wigs_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('wigs_user');
      }
    }
  }, [refreshUsers]);

  const login = useCallback(async (name: string, password: string) => {
    try {
      setError(null);
      const user = await api.login(name, password);
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('wigs_user', JSON.stringify(user));
    } catch (e) {
      setError((e as Error).message);
      throw e;
    }
  }, []);

  const register = useCallback(
    async (name: string, password: string) => {
      try {
        setError(null);
        const user = await api.createUser(name, password);
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('wigs_user', JSON.stringify(user));
        await refreshUsers();
      } catch (e) {
        setError((e as Error).message);
        throw e;
      }
    },
    [refreshUsers],
  );

  const switchUser = useCallback(
    async (name: string, password: string) => {
      await login(name, password);
    },
    [login],
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('wigs_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated,
        login,
        register,
        switchUser,
        logout,
        refreshUsers,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
