import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginApi, registerApi, getMeApi, type BackendUser } from '../services/api';



interface AuthContextType {
  user: BackendUser | null;
  token: string | null;
  isLoading: boolean;
  login: (student_id: string, email: string, password: string) => Promise<void>;
  register: (payload: {
    student_id: string;
    name: string;
    email: string;
    password: string;
    bio?: string;
  }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}



const AuthContext = createContext<AuthContextType | undefined>(undefined);



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('campusforge-token')
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  
  useEffect(() => {
    async function restoreSession() {
      const stored = localStorage.getItem('campusforge-token');
      if (!stored) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await getMeApi();
        setUser(me);
        setToken(stored);
      } catch {
        
        localStorage.removeItem('campusforge-token');
        localStorage.removeItem('campusforge-user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = useCallback(async (student_id: string, email: string, password: string) => {
    const data = await loginApi(student_id, email, password);
    localStorage.setItem('campusforge-token', data.access_token);
    localStorage.setItem('campusforge-user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (payload: {
      student_id: string;
      name: string;
      email: string;
      password: string;
      bio?: string;
    }) => {
      await registerApi(payload);
      
      await login(payload.student_id, payload.email, payload.password);
    },
    [login]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('campusforge-token');
    localStorage.removeItem('campusforge-user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};



export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
};
