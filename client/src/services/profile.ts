import api from './api';

export interface ProfileResponse {
  email: string;
  userId: string;
  role?: 'editor' | 'viewer';
  workspace?: { workspaceId: string; name: string };
}

export const profileService = {
  getProfile: async (): Promise<ProfileResponse> => {
    const res = await api.get('/app/auth/profile');
    return res.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean }> => {
    const res = await api.post('/app/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
};
