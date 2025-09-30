import api from './api';

export interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  tags: string[];
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  tags?: string[];
}

export interface UpdateContactRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  tags?: string[];
}

export interface ContactsResponse {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ContactStats {
  totalContacts: number;
  topTags: Array<{
    tag: string;
    count: number;
  }>;
}

export const contactsService = {
  getAll: async (page = 1, limit = 5, search?: string): Promise<ContactsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    
    const response = await api.get(`/app/contacts?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<Contact> => {
    const response = await api.get(`/app/contacts/${id}`);
    return response.data;
  },

  create: async (data: CreateContactRequest): Promise<Contact> => {
    const response = await api.post('/app/contacts', data);
    return response.data;
  },

  update: async (id: string, data: UpdateContactRequest): Promise<Contact> => {
    const response = await api.patch(`/app/contacts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/app/contacts/${id}`);
  },

  getStats: async (): Promise<ContactStats> => {
    const response = await api.get('/app/contacts/stats');
    return response.data;
  },

  getTags: async (): Promise<Array<{ tag: string; count: number }>> => {
    const response = await api.get('/app/contacts/tags');
    return response.data;
  },
};


