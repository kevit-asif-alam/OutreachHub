import api from './api';

export interface Workspace {
  _id: string;
  name: string;
  description?: string;
  members: Array<{
    userId: string;
    role: 'editor' | 'viewer';
    joinedAt: string;
  }>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
}

export interface InviteUserRequest {
  email: string;
  role: 'editor' | 'viewer';
  tempPassword?: string;
}

export const workspacesService = {
  getAll: async (): Promise<Workspace[]> => {
    const response = await api.get('/admin/workspaces');
    return response.data;
  },

  getById: async (id: string): Promise<Workspace> => {
    const response = await api.get(`/admin/workspaces/${id}`);
    return response.data;
  },

  create: async (data: CreateWorkspaceRequest): Promise<Workspace> => {
    const response = await api.post('/admin/workspaces', data);
    return response.data;
  },

  update: async (id: string, data: UpdateWorkspaceRequest): Promise<Workspace> => {
    const response = await api.patch(`/admin/workspaces/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/admin/workspaces/${id}`);
  },

  inviteUser: async (
    workspaceId: string,
    data: InviteUserRequest
  ): Promise<{ user: { id: string; email: string; role: 'editor' | 'viewer'; tempPassword: string } }> => {
    const response = await api.post(`/admin/workspaces/${workspaceId}/users`, data);
    return response.data;
  },

  getUsers: async (workspaceId: string) => {
    const response = await api.get(`/admin/workspaces/${workspaceId}/users`);
    return response.data;
  },

  removeUser: async (workspaceId: string, userId: string) => {
    await api.delete(`/admin/workspaces/${workspaceId}/users/${userId}`);
  },

  updateUserRole: async (
    workspaceId: string,
    userId: string,
    role: 'editor' | 'viewer'
  ): Promise<{ success: boolean }> => {
    const response = await api.patch(`/admin/workspaces/${workspaceId}/users/${userId}`, { role });
    return response.data;
  },

  updateWorkspaceUser: async (
    workspaceId: string,
    userId: string,
    data: { email?: string; role?: 'editor' | 'viewer'; tempPassword?: string }
  ): Promise<{ success: boolean }> => {
    const response = await api.patch(`/admin/workspaces/${workspaceId}/users/${userId}`, data);
    return response.data;
  },
};