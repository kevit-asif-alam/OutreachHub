import api from './api';

export interface Campaign {
  startDate: string;
  endDate: string;
  _id: string;
  name: string;
  description?: string;
  targetTags: string[];
  status: 'draft' | 'running' | 'completed' | 'failed';
  templateId: string;
  template?: {
    _id: string;
    name: string;
    type: string;
  };
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  launchedAt?: string;
  completedAt?: string;
  totalContacts: number;
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  targetTags: string[];
  templateId: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  targetTags?: string[];
  templateId?: string;
  startDate?: string; // ISO
  endDate?: string;   // ISO
}

export interface CampaignsResponse {
  campaigns: Campaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CampaignStats {
  totalCampaigns: number;
  draftCampaigns: number;
  runningCampaigns: number;
  completedCampaigns: number;
}

export interface CampaignStatus {
  _id: string;
  name: string;
  status: 'draft' | 'running' | 'completed' | 'failed';
  totalContacts: number;
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  launchedAt?: string;
  completedAt?: string;
}

export const campaignsService = {
  getAll: async (page = 1, limit = 10, search?: string): Promise<CampaignsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    
    const response = await api.get(`/app/campaigns?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<Campaign> => {
    const response = await api.get(`/app/campaigns/${id}`);
    return response.data;
  },

  create: async (data: CreateCampaignRequest): Promise<Campaign> => {
    const response = await api.post('/app/campaigns', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCampaignRequest): Promise<Campaign> => {
    const response = await api.patch(`/app/campaigns/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/app/campaigns/${id}`);
  },

  copy: async (id: string): Promise<Campaign> => {
    const response = await api.post(`/app/campaigns/${id}/copy`);
    return response.data;
  },

  launch: async (id: string) => {
    const response = await api.post(`/app/campaigns/${id}/launch`);
    return response.data;
  },

  stop: async (id: string) => {
    const response = await api.post(`/app/campaigns/${id}/stop`);
    return response.data;
  },

  complete: async (id: string) => {
    const response = await api.post(`/app/campaigns/${id}/complete`);
    return response.data;
  },

  getStatus: async (id: string): Promise<CampaignStatus> => {
    const response = await api.get(`/app/campaigns/${id}/status`);
    return response.data;
  },

  getStats: async (): Promise<CampaignStats> => {
    const response = await api.get('/app/campaigns/stats');
    return response.data;
  },
};


