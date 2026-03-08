import api from './api';
import { User } from '../types';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const userService = {
  async getAll(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/users');
    return response.data.data || response.data; // Manejar ambos formatos
  },

  async getById(id: string): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data || response.data;
  },

  async updateRole(id: string, role: string): Promise<void> {
    await api.put(`/users/${id}/role`, { role });
  },

  async toggleStatus(id: string, isActive: boolean): Promise<void> {
    await api.put(`/users/${id}/status`, { isActive });
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  }
};
