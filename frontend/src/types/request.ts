export type RequestType = 'Reagent' | 'Equipment' | 'Maintenance' | 'Calibration' | 'Other';
export type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'InProgress' | 'Completed' | 'Cancelled';
export type RequestPriority = 0 | 1 | 2 | 3;

export interface RequestItem {
  id?: string;
  itemName: string;
  catalogNumber?: string;
  casNumber?: string;
  quantity?: number;
  unit?: string;
  specifications?: string;
  supplier?: string;
  estimatedPrice?: number;
}

export interface Request {
  id: string;
  title: string;
  description: string;
  type: RequestType;
  status: RequestStatus;
  priority: RequestPriority;
  requestedAt: string;
  expectedDate?: string;
  resolvedAt?: string;
  comments?: string;
  rejectionReason?: string;
  requestedBy: {
    id: string;
    name: string;
    email: string;
  };
  approvedBy?: {
    id: string;
    name: string;
  };
  items: RequestItem[];
  itemsCount?: number;
  totalItems?: number;
}

export interface CreateRequestDto {
  title: string;
  description: string;
  type: RequestType;
  priority: RequestPriority;
  expectedDate?: string;
  items: RequestItem[];
}

export interface ApproveRequestDto {
  comments?: string;
}

export interface RejectRequestDto {
  rejectionReason: string;
}

export const requestTypeColors: Record<RequestType, string> = {
  Reagent: '#4caf50',      // Verde
  Equipment: '#2196f3',     // Azul
  Maintenance: '#ff9800',   // Naranja
  Calibration: '#9c27b0',   // Morado
  Other: '#9e9e9e'          // Gris
};

export const requestStatusColors: Record<RequestStatus, string> = {
  Pending: '#ff9800',       // Naranja
  Approved: '#4caf50',      // Verde
  Rejected: '#f44336',      // Rojo
  InProgress: '#2196f3',    // Azul
  Completed: '#2e7d32',     // Verde oscuro
  Cancelled: '#9e9e9e'      // Gris
};

export const requestPriorityColors: Record<RequestPriority, string> = {
  [0]: '#8bc34a',           // Verde claro - Baja
  [1]: '#ff9800',           // Naranja - Media
  [2]: '#f44336',           // Rojo - Alta
  [3]: '#9c27b0'            // Morado - Urgente
};

export const requestTypeIcons: Record<RequestType, string> = {
  Reagent: '🧪',
  Equipment: '🔧',
  Maintenance: '🛠️',
  Calibration: '📏',
  Other: '📦'
};

export const requestStatusIcons: Record<RequestStatus, string> = {
  Pending: '⏳',
  Approved: '✅',
  Rejected: '❌',
  InProgress: '⚙️',
  Completed: '🎉',
  Cancelled: '🚫'
};
