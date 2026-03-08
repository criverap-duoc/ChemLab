// src\types\index.ts

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'LAB_MANAGER' | 'RESEARCHER' | 'LAB_TECH';
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export const ROLES = {
  ADMIN: 'ADMIN',
  LAB_MANAGER: 'LAB_MANAGER',
  RESEARCHER: 'RESEARCHER',
  LAB_TECH: 'LAB_TECH'
} as const;

export const PERMISSIONS = {
  // Reagents
  CREATE_REAGENT: 'create:reagent',
  EDIT_REAGENT: 'edit:reagent',
  DELETE_REAGENT: 'delete:reagent',
  VIEW_REAGENT: 'view:reagent',

  // Equipment
  CREATE_EQUIPMENT: 'create:equipment',
  EDIT_EQUIPMENT: 'edit:equipment',
  DELETE_EQUIPMENT: 'delete:equipment',
  VIEW_EQUIPMENT: 'view:equipment',
  CALIBRATE_EQUIPMENT: 'calibrate:equipment',

  // Experiments
  CREATE_EXPERIMENT: 'create:experiment',
  EDIT_EXPERIMENT: 'edit:experiment',
  DELETE_EXPERIMENT: 'delete:experiment',
  VIEW_EXPERIMENT: 'view:experiment',

  // Users
  MANAGE_USERS: 'manage:users',
  VIEW_USERS: 'view:users',

  // Reports
  VIEW_REPORTS: 'view:reports',
  EXPORT_DATA: 'export:data'
} as const;

export type Role = keyof typeof ROLES;
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: Object.values(PERMISSIONS),

  LAB_MANAGER: [
    PERMISSIONS.CREATE_REAGENT,
    PERMISSIONS.EDIT_REAGENT,
    PERMISSIONS.VIEW_REAGENT,
    PERMISSIONS.CREATE_EQUIPMENT,
    PERMISSIONS.EDIT_EQUIPMENT,
    PERMISSIONS.VIEW_EQUIPMENT,
    PERMISSIONS.CALIBRATE_EQUIPMENT,
    PERMISSIONS.CREATE_EXPERIMENT,
    PERMISSIONS.EDIT_EXPERIMENT,
    PERMISSIONS.VIEW_EXPERIMENT,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA
  ],

  RESEARCHER: [
    PERMISSIONS.VIEW_REAGENT,
    PERMISSIONS.VIEW_EQUIPMENT,
    PERMISSIONS.CREATE_EXPERIMENT,
    PERMISSIONS.EDIT_EXPERIMENT,
    PERMISSIONS.VIEW_EXPERIMENT,
    PERMISSIONS.VIEW_REPORTS
  ],

  LAB_TECH: [
    PERMISSIONS.VIEW_REAGENT,
    PERMISSIONS.VIEW_EQUIPMENT,
    PERMISSIONS.CALIBRATE_EQUIPMENT,
    PERMISSIONS.VIEW_EXPERIMENT
  ]
};

// Tipo para las props de componentes que reciben usuario
export interface WithUser {
  user: User;
}

// Función helper para verificar si un string es un Role válido
export const isValidRole = (role: string): role is Role => {
  return Object.keys(ROLES).includes(role);
};

export interface Reagent {
  id: string;
  name: string;
  chemicalFormula: string;
  casNumber?: string;
  quantity: number;
  unit: string;
  location: string;
  hazardLevel: 0 | 1 | 2 | 3 | 4;
  supplier?: string;
  expiryDate?: string;
  createdBy: string;
  createdAt: string;
  minQuantity: number;
}

export interface CreateReagentDto {
  name: string;
  chemicalFormula: string;
  casNumber?: string;
  quantity: number;
  unit: string;
  location: string;
  hazardLevel: number;
  supplier?: string;
  expiryDate?: string;
  minQuantity: number;
}

export interface AuthResponse {
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  firstName: string;
  lastName: string;
}

export interface Equipment {
  id: string;
  name: string;
  model: string;
  serialNumber?: string;
  location: string;
  status: 0 | 1 | 2 | 3 | 4;
  lastCalibration?: string;
  nextCalibration?: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateEquipmentDto {
  name: string;
  model: string;
  serialNumber?: string;
  location: string;
  status: number;
  lastCalibration?: string;
  nextCalibration?: string;
}

export const EquipmentStatus = {
  0: 'Disponible',
  1: 'En Uso',
  2: 'Mantenimiento',
  3: 'Calibración Pendiente',
  4: 'Fuera de Servicio'
} as const;

export const StatusColors = {
  0: '#4caf50', // verde
  1: '#2196f3', // azul
  2: '#ff9800', // naranja
  3: '#f44336', // rojo
  4: '#9e9e9e'  // gris
} as const;
