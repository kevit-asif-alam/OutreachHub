import api from './api';

export interface DashboardStats {
  contactStats: {
    totalContacts: number;
  };
  campaignStats: {
    totalCampaigns: number;
    completedCampaigns: number;
    runningCampaigns: number;
  };
  recentCampaigns: Array<{
    _id: string;
    name: string;
    targetTags: string[];
    status: string;
    createdAt: string;
    launchedAt?: string;
    templateId: {
      _id: string;
      name: string;
      type: string;
    };
  }>;
  topTags: Array<{
    tag: string;
    count: number;
  }>;
}

export interface ChartDataPoint {
  date: string;
  count: number;
}

export interface MessagesPerTypeDataPoint {
  date: string;
  type: string;
  count: number;
}

export const analyticsService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/app/analytics/dashboard');
    return response.data;
  },

  getCampaignsPerDay: async (startDate?: string, endDate?: string): Promise<ChartDataPoint[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/app/analytics/campaigns-per-day?${params}`);
    return response.data;
  },

  getMessagesPerTypePerDay: async (startDate?: string, endDate?: string): Promise<MessagesPerTypeDataPoint[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/app/analytics/messages-per-type-per-day?${params}`);
    return response.data;
  },

  getContactsReachedPerDay: async (startDate?: string, endDate?: string): Promise<ChartDataPoint[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/app/analytics/contacts-reached-per-day?${params}`);
    return response.data;
  },
};


