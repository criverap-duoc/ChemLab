import api from './api';
import axios from 'axios';
import { Reagent, CreateReagentDto } from '../types';

export const reagentService = {
  async getAll(page = 1, pageSize = 20): Promise<{ data: Reagent[] }> {
    const response = await api.get('/reagents', { params: { page, pageSize } });
    return response.data;
  },

  async getById(id: string): Promise<Reagent> {
    const response = await api.get<Reagent>(`/reagents/${id}`);
    return response.data;
  },

  // F10.3: búsqueda por QR. El backend resuelve por Id (Guid), CAS o nombre parcial.
  // Un 404 se traduce a null para que la UI muestre "Reactivo no encontrado" sin
  // tener que interpretar el error HTTP; el resto de errores se propagan.
  async getByQr(code: string): Promise<Reagent | null> {
    try {
      const response = await api.get<Reagent>(`/reagents/by-qr/${encodeURIComponent(code)}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
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
