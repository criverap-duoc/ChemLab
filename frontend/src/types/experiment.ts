// Definir el enum numérico (coincide con backend)
export enum ExperimentStatus {
  Planned = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3,
  Failed = 4
}

// Para usar en el frontend (conversiones)
export const ExperimentStatusLabels: Record<ExperimentStatus, string> = {
  [ExperimentStatus.Planned]: 'Planned',
  [ExperimentStatus.InProgress]: 'InProgress',
  [ExperimentStatus.Completed]: 'Completed',
  [ExperimentStatus.Cancelled]: 'Cancelled',
  [ExperimentStatus.Failed]: 'Failed'
};

// Colores para cada estado (USANDO CORCHETES, no strings)
export const statusColors: Record<ExperimentStatus, string> = {
  [ExperimentStatus.Planned]: '#2196f3',      // Azul
  [ExperimentStatus.InProgress]: '#ff9800',   // Naranja
  [ExperimentStatus.Completed]: '#4caf50',    // Verde
  [ExperimentStatus.Cancelled]: '#9e9e9e',    // Gris
  [ExperimentStatus.Failed]: '#f44336'        // Rojo
};

// Iconos para cada estado
export const statusIcons: Record<ExperimentStatus, string> = {
  [ExperimentStatus.Planned]: '📅',
  [ExperimentStatus.InProgress]: '⚗️',
  [ExperimentStatus.Completed]: '✅',
  [ExperimentStatus.Cancelled]: '❌',
  [ExperimentStatus.Failed]: '⚠️'
};

// Para la API (cuando enviamos datos)
export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: ExperimentStatus;
  startDate: string;
  endDate?: string;
  protocol?: string;
  results?: string;
  notes?: string;
  createdBy: string;
  reagents: ExperimentReagent[];
  equipment: ExperimentEquipment[];
  createdAt: string;
  updatedAt?: string;
}

export interface ExperimentReagent {
  reagentId: string;
  reagentName?: string;
  quantityUsed: number;
  unit: string;
  batchNumber?: string;
}


export interface ExperimentEquipment {
  equipmentId: string;
  equipmentName?: string;
  usageHours?: number;
  calibrationBefore?: string;
  calibrationAfter?: string;
}

export interface CreateExperimentDto {
  name: string;
  description: string;
  startDate?: string;
  protocol?: string;
  notes?: string;
}

export interface UpdateExperimentDto {
  name?: string;
  description?: string;
  protocol?: string;
  results?: string;
  notes?: string;
  endDate?: string;
}

export interface AddReagentDto {
  reagentId: string;
  quantityUsed: number;
  unit: string;
  batchNumber?: string;
}

export interface AddEquipmentDto {
  equipmentId: string;
  usageHours?: number;
  calibrationBefore?: string;
  calibrationAfter?: string;
}

export interface UpdateStatusDto {
  status: ExperimentStatus;
}
