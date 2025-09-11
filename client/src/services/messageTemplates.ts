import api from './api';

export interface MessageTemplate {
  _id: string;
  name: string;
  content: string;
  type: 'text' | 'text_and_image';
  imageUrl?: string;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageTemplateRequest {
  name: string;
  content: string;
  type: 'text' | 'text_and_image';
  imageUrl?: string;
}

export interface UpdateMessageTemplateRequest {
  name?: string;
  content?: string;
  type?: 'text' | 'text_and_image';
  imageUrl?: string;
}

export interface MessageTemplatesResponse {
  templates: MessageTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TemplateStats {
  totalTemplates: number;
  textTemplates: number;
  imageTemplates: number;
}

export const messageTemplatesService = {
  getAll: async (page = 1, limit = 10, search?: string): Promise<MessageTemplatesResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    
    const response = await api.get(`/app/message-templates?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<MessageTemplate> => {
    const response = await api.get(`/app/message-templates/${id}`);
    return response.data;
  },

  create: async (data: CreateMessageTemplateRequest): Promise<MessageTemplate> => {
    const response = await api.post('/app/message-templates', data);
    return response.data;
  },

  update: async (id: string, data: UpdateMessageTemplateRequest): Promise<MessageTemplate> => {
    const response = await api.patch(`/app/message-templates/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/app/message-templates/${id}`);
  },

  getStats: async (): Promise<TemplateStats> => {
    const response = await api.get('/app/message-templates/stats');
    return response.data;
  },
};