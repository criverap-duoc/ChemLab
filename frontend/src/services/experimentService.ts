import api from './api';
import {
  Experiment,
  CreateExperimentDto,
  UpdateExperimentDto,
  AddReagentDto,
  AddEquipmentDto,
  ExperimentStatus
} from '../types/experiment';

interface ExperimentsResponse {
  data: Experiment[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export const experimentService = {
  async getAll(page = 1, pageSize = 20, status?: ExperimentStatus): Promise<ExperimentsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (status !== undefined) params.append('status', status.toString()); // Convertir a string

    const response = await api.get(`/experiments?${params.toString()}`);
    return response.data;
  },

  async getById(id: string): Promise<Experiment> {
    const response = await api.get(`/experiments/${id}`);
    return response.data;
  },

  async create(data: any): Promise<{ id: string }> {
    // Asegurar que los datos tienen el formato correcto
    const payload = {
      name: data.name,
      description: data.description,
      protocol: data.protocol || null,
      notes: data.notes || null,
      startDate: data.startDate || null,
      reagents: data.reagents || [],
      equipment: data.equipment || []
    };

    const response = await api.post('/experiments', payload);
    return response.data;
  },

  async update(id: string, data: UpdateExperimentDto): Promise<void> {
    await api.put(`/experiments/${id}`, data);
  },


  async delete(id: string): Promise<void> {
    await api.delete(`/experiments/${id}`);
  },

  async updateStatus(id: string, status: ExperimentStatus): Promise<void> {
    console.log('Enviando status:', { status }); // status es número
    await api.patch(`/experiments/${id}/status`, { status });
  },

  async addReagent(id: string, data: AddReagentDto): Promise<void> {
    await api.post(`/experiments/${id}/reagents`, data);
  },

  async addEquipment(id: string, data: AddEquipmentDto): Promise<void> {
    await api.post(`/experiments/${id}/equipment`, data);
  }
};
