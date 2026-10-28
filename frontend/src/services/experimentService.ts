import api from './api';
import {
  Experiment,
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

export interface CreateExperimentPayload {
  name: string;
  description: string;
  protocol?: string;
  notes?: string;
  startDate?: string;
  reagents?: AddReagentDto[];
  equipment?: AddEquipmentDto[];
}

// --- Normalización del contrato del backend -------------------------------
// El backend (ExperimentEndpoints.cs) devuelve Status como string ("Planned",
// "InProgress", ...) y, en el listado, los nombres de reactivo/equipo como
// `name` (en el detalle como `reagentName`/`equipmentName`).
// Aquí se adapta todo a los tipos de `types/experiment.ts`.

interface RawExperimentReagent {
  reagentId: string;
  reagentName?: string | null;
  name?: string | null;
  quantityUsed: number;
  unit: string;
  batchNumber?: string | null;
}

interface RawExperimentEquipment {
  equipmentId: string;
  equipmentName?: string | null;
  name?: string | null;
  usageHours?: number | null;
  calibrationBefore?: string | null;
  calibrationAfter?: string | null;
}

interface RawExperiment {
  id: string;
  name: string;
  description: string;
  status: ExperimentStatus | string;
  startDate: string;
  endDate?: string | null;
  protocol?: string | null;
  results?: string | null;
  notes?: string | null;
  createdBy: string;
  reagents?: RawExperimentReagent[];
  equipment?: RawExperimentEquipment[];
  createdAt: string;
  updatedAt?: string | null;
}

interface RawExperimentsResponse {
  data: RawExperiment[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const statusByLabel: Record<string, ExperimentStatus> = {
  Planned: ExperimentStatus.Planned,
  InProgress: ExperimentStatus.InProgress,
  Completed: ExperimentStatus.Completed,
  Cancelled: ExperimentStatus.Cancelled,
  Failed: ExperimentStatus.Failed
};

const toStatus = (value: RawExperiment['status']): ExperimentStatus => {
  if (typeof value === 'number') return value;

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) return numeric as ExperimentStatus;

  return statusByLabel[value] ?? ExperimentStatus.Planned;
};

const mapExperiment = (raw: RawExperiment): Experiment => ({
  id: raw.id,
  name: raw.name,
  description: raw.description,
  status: toStatus(raw.status),
  startDate: raw.startDate,
  endDate: raw.endDate ?? undefined,
  protocol: raw.protocol ?? undefined,
  results: raw.results ?? undefined,
  notes: raw.notes ?? undefined,
  createdBy: raw.createdBy,
  reagents: (raw.reagents ?? []).map(reagent => ({
    reagentId: reagent.reagentId,
    reagentName: reagent.reagentName ?? reagent.name ?? undefined,
    quantityUsed: reagent.quantityUsed,
    unit: reagent.unit,
    batchNumber: reagent.batchNumber ?? undefined
  })),
  equipment: (raw.equipment ?? []).map(item => ({
    equipmentId: item.equipmentId,
    equipmentName: item.equipmentName ?? item.name ?? undefined,
    usageHours: item.usageHours ?? undefined,
    calibrationBefore: item.calibrationBefore ?? undefined,
    calibrationAfter: item.calibrationAfter ?? undefined
  })),
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt ?? undefined
});

const toResponse = (raw: RawExperimentsResponse): ExperimentsResponse => ({
  data: (raw.data ?? []).map(mapExperiment),
  page: raw.page,
  pageSize: raw.pageSize,
  totalCount: raw.totalCount,
  totalPages: raw.totalPages
});

export const experimentService = {
  async getAll(page = 1, pageSize = 20, status?: ExperimentStatus): Promise<ExperimentsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (status !== undefined) params.append('status', status.toString()); // Convertir a string

    const response = await api.get<RawExperimentsResponse>(`/experiments?${params.toString()}`);
    return toResponse(response.data);
  },

  async getById(id: string): Promise<Experiment> {
    const response = await api.get<RawExperiment>(`/experiments/${id}`);
    return mapExperiment(response.data);
  },

  async create(data: CreateExperimentPayload): Promise<{ id: string }> {
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

    const response = await api.post<{ id: string }>('/experiments', payload);
    return response.data;
  },

  async update(
    id: string,
    data: UpdateExperimentDto & { reagents?: AddReagentDto[]; equipment?: AddEquipmentDto[] }
  ): Promise<void> {
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
