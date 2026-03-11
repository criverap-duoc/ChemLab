import api from './api';
import { Reagent, CreateReagentDto } from '../types';

interface ReagentResponse {
  data: Reagent[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export const reagentService = {
  async getAll(): Promise<{ data: Reagent[] }> {
    const response = await api.get('/reagents');
    return response.data;
  },

  async getById(id: string): Promise<Reagent> {
    const response = await api.get<Reagent>(`/reagents/${id}`);
    return response.data;
  },

  async create(data: CreateReagentDto): Promise<{ id: string }> {
    const response = await api.post<{ id: string }>('/reagents', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateReagentDto>): Promise<void> {
    console.log('📤 Service - update payload:', JSON.stringify(data, null, 2));
    await api.put(`/reagents/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/reagents/${id}`);
  },
};
