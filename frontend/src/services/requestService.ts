import api from './api';
import {
  Request,
  CreateRequestDto,
  ApproveRequestDto,
  RejectRequestDto,
  RequestStatus,
  RequestType
} from '../types/request';

interface RequestsResponse {
  data: Request[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export const requestService = {
  async getAll(params?: {
    status?: RequestStatus;
    type?: RequestType;
    page?: number;
    pageSize?: number;
  }): Promise<RequestsResponse> {
    const response = await api.get('/requests', { params });
    return response.data;
  },

  async getMyRequests(page = 1, pageSize = 20): Promise<RequestsResponse> {
    const response = await api.get('/requests/my', { params: { page, pageSize } });
    return response.data;
  },

  async getById(id: string): Promise<Request> {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },

  async create(data: CreateRequestDto): Promise<{ id: string }> {
    const response = await api.post('/requests', data);
    return response.data;
  },

  async approve(id: string, data: ApproveRequestDto): Promise<void> {
    await api.put(`/requests/${id}/approve`, data);
  },

  async reject(id: string, data: RejectRequestDto): Promise<void> {
    await api.put(`/requests/${id}/reject`, data);
  },

  async cancel(id: string): Promise<void> {
    await api.put(`/requests/${id}/cancel`, {});
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/requests/${id}`);
  }
};
