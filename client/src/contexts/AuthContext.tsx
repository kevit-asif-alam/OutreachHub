import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/auth';
import type { User, Workspace, AuthContextType } from '../types';

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

  useEffect(() => {
    // Check for stored auth data on app load
    const storedUser = localStorage.getItem('user');
    const storedWorkspace = localStorage.getItem('currentWorkspace');
    const token = localStorage.getItem('accessToken');

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
        if (storedWorkspace) {
          setCurrentWorkspace(JSON.parse(storedWorkspace));
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('currentWorkspace');
        localStorage.removeItem('accessToken');
      }
    }
  }, []);

  const login = async (email: string, password: string, isAdmin: boolean, workspaceId?: string) => {
    try {
      let response;
      
      if (isAdmin) {
        response = await authService.adminLogin({ email, password });
      } else {
        response = await authService.appLogin({ email, password, workspaceId });
      }

      // Handle workspace selection for app users
      if (!isAdmin && 'workspaces' in response && response.workspaces) {
        if (workspaceId) {
          // User selected a specific workspace
          const selectedWorkspace = response.workspaces.find(
            (ws: any) => ws.workspaceId === workspaceId
          );
          if (selectedWorkspace) {
            setCurrentWorkspace(selectedWorkspace);
            localStorage.setItem('currentWorkspace', JSON.stringify(selectedWorkspace));
          }
        } else {
          // User needs to select a workspace
          setUser({
            id: response.userId,
            email: response.email,
            isAdmin: false,
            workspaces: response.workspaces,
          });
          localStorage.setItem('user', JSON.stringify({
            id: response.userId,
            email: response.email,
            isAdmin: false,
            workspaces: response.workspaces,
          }));
          return; // Don't set token yet, wait for workspace selection
        }
      }

      // Set user and token (narrow type to AuthResponse)
      const authResp = response as any;
      setUser(authResp.user);
      localStorage.setItem('user', JSON.stringify(authResp.user));
      localStorage.setItem('accessToken', authResp.accessToken);
    } catch (error) {
      console.error('Login error:', error);
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
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setCurrentWorkspace(null);
      localStorage.removeItem('user');
      localStorage.removeItem('currentWorkspace');
      localStorage.removeItem('accessToken');
    }
  };

  const selectWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    localStorage.setItem('currentWorkspace', JSON.stringify(workspace));
    
    // Now login with the selected workspace
    if (user) {
      login(user.email, '', false, workspace.workspaceId);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


