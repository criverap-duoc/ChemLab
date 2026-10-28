import api from './api';
import { Equipment, CreateEquipmentDto } from '../types';

export const equipmentService = {
  async getAll(page = 1, pageSize = 20): Promise<{ data: Equipment[] }> {
    const response = await api.get('/equipment', { params: { page, pageSize } });
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
