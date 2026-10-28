import api from './api';
import {
  Request,
  RequestItem,
  CreateRequestDto,
  ApproveRequestDto,
  RejectRequestDto,
  RequestStatus,
  RequestType,
  RequestPriority
} from '../types/request';

interface RequestsResponse {
  data: Request[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// --- Normalización del contrato del backend -------------------------------
// El backend (RequestEndpoints.cs) devuelve:
//  * Type/Status/Priority como string ("Pending", "High", ...)
//  * En los listados: requestedBy/approvedBy como texto y itemsCount
//    en lugar del array de items.
//  * En el detalle: requestedBy/approvedBy como objeto y el array de items.
// Aquí se adapta todo a los tipos de `types/request.ts`.

interface RawRequestItem {
  id?: string;
  itemName: string;
  catalogNumber?: string | null;
  casNumber?: string | null;
  quantity?: number | null;
  unit?: string | null;
  specifications?: string | null;
  supplier?: string | null;
  estimatedPrice?: number | null;
}

interface RawUserRef {
  id: string;
  name: string;
  email?: string | null;
}

interface RawRequest {
  id: string;
  title: string;
  description: string;
  type: RequestType;
  status: RequestStatus;
  priority: string | number | null;
  requestedAt: string;
  expectedDate?: string | null;
  resolvedAt?: string | null;
  comments?: string | null;
  rejectionReason?: string | null;
  requestedBy: RawUserRef | string;
  approvedBy?: RawUserRef | string | null;
  items?: RawRequestItem[];
  itemsCount?: number;
  totalItems?: number;
}

interface RawRequestsResponse {
  data: RawRequest[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const priorityByLabel: Record<string, RequestPriority> = {
  Low: 0,
  Medium: 1,
  High: 2,
  Urgent: 3
};

const toPriority = (value: RawRequest['priority']): RequestPriority => {
  if (typeof value === 'number') return value as RequestPriority;
  if (!value) return 0;

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) return numeric as RequestPriority;

  return priorityByLabel[value] ?? 0;
};

const mapUserRef = (value: RawUserRef | string | null | undefined): RawUserRef | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return { id: '', name: value, email: '' };
  return value;
};

const mapItem = (item: RawRequestItem): RequestItem => ({
  id: item.id,
  itemName: item.itemName,
  catalogNumber: item.catalogNumber ?? undefined,
  casNumber: item.casNumber ?? undefined,
  quantity: item.quantity ?? undefined,
  unit: item.unit ?? undefined,
  specifications: item.specifications ?? undefined,
  supplier: item.supplier ?? undefined,
  estimatedPrice: item.estimatedPrice ?? undefined
});

const mapRequest = (raw: RawRequest): Request => {
  const requestedBy = mapUserRef(raw.requestedBy);
  const approvedBy = mapUserRef(raw.approvedBy);
  const items = (raw.items ?? []).map(mapItem);

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    type: raw.type,
    status: raw.status,
    priority: toPriority(raw.priority),
    requestedAt: raw.requestedAt,
    expectedDate: raw.expectedDate ?? undefined,
    resolvedAt: raw.resolvedAt ?? undefined,
    comments: raw.comments ?? undefined,
    rejectionReason: raw.rejectionReason ?? undefined,
    requestedBy: {
      id: requestedBy?.id ?? '',
      name: requestedBy?.name ?? '',
      email: requestedBy?.email ?? ''
    },
    approvedBy: approvedBy ? { id: approvedBy.id, name: approvedBy.name } : undefined,
    items,
    itemsCount: raw.itemsCount ?? items.length,
    totalItems: raw.totalItems
  };
};

const toResponse = (raw: RawRequestsResponse): RequestsResponse => ({
  data: (raw.data ?? []).map(mapRequest),
  page: raw.page,
  pageSize: raw.pageSize,
  totalCount: raw.totalCount,
  totalPages: raw.totalPages
});

export const requestService = {
  async getAll(params?: {
    status?: RequestStatus;
    type?: RequestType;
    page?: number;
    pageSize?: number;
  }): Promise<RequestsResponse> {
    const response = await api.get<RawRequestsResponse>('/requests', { params });
    return toResponse(response.data);
  },

  async getMyRequests(page = 1, pageSize = 20): Promise<RequestsResponse> {
    const response = await api.get<RawRequestsResponse>('/requests/my', { params: { page, pageSize } });
    return toResponse(response.data);
  },

  async getById(id: string): Promise<Request> {
    const response = await api.get<RawRequest>(`/requests/${id}`);
    return mapRequest(response.data);
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
