import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  username: string;
  email: string;
  companyName: string;
  preferredCurrency: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  companyName: string;
  preferredCurrency?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser && storedUser !== 'undefined') {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', {
        email,
        password,
      });

      const data = await response.json();

      setToken(data.token);
      setUser(data.user);

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    } catch (error) {
      throw new Error('Credenciales inválidas');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiRequest('POST', '/api/auth/register', data);

      const responseData = await response.json();

      setToken(responseData.token);
      setUser(responseData.user);

      localStorage.setItem('auth_token', responseData.token);
      localStorage.setItem('auth_user', JSON.stringify(responseData.user));
    } catch (error) {
      throw new Error('Error al registrar usuario');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
