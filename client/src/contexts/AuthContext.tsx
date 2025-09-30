import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/auth';
import type { User, Workspace, AuthContextType } from '../types';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  // Keep pending credentials in-memory only (not persisted) for workspace selection
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);

  // Token validation function
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      // Make a simple request to validate the token
      const response = await fetch('http://localhost:3000/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for stored auth data on app load
      const storedUser = localStorage.getItem('user');
      const storedWorkspace = localStorage.getItem('currentWorkspace');
      const token = localStorage.getItem('accessToken');

      if (storedUser && token) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Validate token before setting user
          const isValidToken = await validateToken(token);
          
          if (isValidToken) {
            setUser(parsedUser);
            if (storedWorkspace) {
              setCurrentWorkspace(JSON.parse(storedWorkspace));
            }
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('user');
            localStorage.removeItem('currentWorkspace');
            localStorage.removeItem('accessToken');
            toast.error('Session expired. Please login again.');
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('currentWorkspace');
          localStorage.removeItem('accessToken');
        }
      }
      setIsInitializing(false);
    };

    initializeAuth();
  }, []);

  const login: AuthContextType['login'] = async (email, password, isAdmin, workspaceId) => {
    try {
      let response;
      
      if (isAdmin) {
        response = await authService.adminLogin({ email, password });
      } else {
        response = await authService.appLogin({ email, password, workspaceId });
      }

      // Handle workspace selection for app users
      if (!isAdmin && 'workspaces' in response && response.workspaces) {
        if (!workspaceId) {
          // Step 1: credentials are valid; prompt user to select workspace
          const partialUser: User = {
            id: (response as any).userId,
            email: (response as any).email,
            isAdmin: false,
            workspaces: (response as any).workspaces,
          };
          setUser(partialUser);
          localStorage.setItem('user', JSON.stringify(partialUser));

          // keep credentials in-memory for step 2 (do NOT persist password)
          setPendingCredentials({ email, password });
          return { requiresWorkspaceSelection: true };
        } else {
          // Step 2: workspace selected; set current workspace from provided response
          const selectedWorkspace = (response as any).user?.workspaces?.find(
            (ws: any) => ws.workspaceId === workspaceId
          ) || (response as any).workspace || null;
          if (selectedWorkspace) {
            setCurrentWorkspace(selectedWorkspace);
            localStorage.setItem('currentWorkspace', JSON.stringify(selectedWorkspace));
          }
        }
      }

      // Set user and token (narrow type to AuthResponse)
      const authResp = response as any;
      setUser(authResp.user);
      localStorage.setItem('user', JSON.stringify(authResp.user));
      localStorage.setItem('accessToken', authResp.accessToken);
      setPendingCredentials(null);
      
      // Show success message
      toast.success(`Welcome back, ${authResp.user.email}!`);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Enhanced error handling with toast notifications
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      
      if (errorMessage.toLowerCase().includes('invalid credentials')) {
        toast.error('Invalid email or password. Please check your credentials.');
      } else if (errorMessage.toLowerCase().includes('not an admin')) {
        toast.error('Admin access required. Please check "Login as Admin" or contact your administrator.');
      } else if (errorMessage.toLowerCase().includes('access denied')) {
        toast.error('Access denied. Please verify your permissions.');
      } else {
        toast.error(errorMessage);
      }
      
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (user?.isAdmin) {
        await authService.adminLogout();
      } else {
        await authService.appLogout();
      }
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout');
    } finally {
      setUser(null);
      setCurrentWorkspace(null);
      setPendingCredentials(null);
      localStorage.removeItem('user');
      localStorage.removeItem('currentWorkspace');
      localStorage.removeItem('accessToken');
    }
  };

  const selectWorkspace = async (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    localStorage.setItem('currentWorkspace', JSON.stringify(workspace));
    // Complete login using pending credentials for the chosen workspace
    if (pendingCredentials) {
      const { email, password } = pendingCredentials;
      await login(email, password, false, workspace.workspaceId);
    }
  };

  const value: AuthContextType = {
    user,
    currentWorkspace,
    login,
    logout,
    selectWorkspace,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    isInitializing,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


