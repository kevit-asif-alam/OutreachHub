import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
  workspaceId?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    isAdmin: boolean;
    workspaces?: Array<{
      workspaceId: string;
      role: 'editor' | 'viewer';
      joinedAt: string;
    }>;
  };
}

export interface WorkspaceResponse {
  userId: string;
  email: string;
  workspaces: Array<{
    workspaceId: string;
    role: 'editor' | 'viewer';
    joinedAt: string;
  }>;
}

export const authService = {
  // Admin auth
  adminRegister: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/admin/auth/register', data);
    return response.data;
  },

  adminLogin: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/admin/auth/login', data);
    return response.data;
  },

  adminLogout: async (): Promise<void> => {
    await api.post('/admin/auth/logout');
  },

  // App auth
  appLogin: async (data: LoginRequest): Promise<AuthResponse | WorkspaceResponse> => {
    const response = await api.post('/app/auth/login', data);
    return response.data;
  },

  appLogout: async (): Promise<void> => {
    await api.post('/app/auth/logout');
  },
};


