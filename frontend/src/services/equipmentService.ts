import api from './api';
import { Equipment, CreateEquipmentDto } from '../types';

interface EquipmentResponse {
  data: Equipment[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export const equipmentService = {
  async getAll(): Promise<{ data: Equipment[] }> {
    const response = await api.get('/equipment');
    return response.data;
  },
  async getById(id: string): Promise<Equipment> {
    const response = await api.get<Equipment>(`/equipment/${id}`);
    return response.data;
  },

  async create(data: CreateEquipmentDto): Promise<{ id: string }> {
    const response = await api.post<{ id: string }>('/equipment', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateEquipmentDto>): Promise<void> {
    await api.put(`/equipment/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/equipment/${id}`);
  },
};
