// src\services\authService.ts

import api from './api';
import { LoginRequest, RegisterRequest, AuthResponse, User, Permission, PERMISSIONS } from '../types';

interface AuthResponseWithUser extends AuthResponse {
  user: User;
}

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponseWithUser> {
  const response = await api.post<AuthResponseWithUser>('/auth/login', data);

  // Guardar usuario en localStorage
  if (response.data.user) {
    localStorage.setItem('user', JSON.stringify(response.data.user));

    // ASIGNAR PERMISOS SEGÚN EL ROL
    const permissions = this.getPermissionsForRole(response.data.user.role);
    localStorage.setItem('permissions', JSON.stringify(permissions));

    console.log('Usuario logueado:', response.data.user);
    console.log('Permisos asignados:', permissions);
  }

  return response.data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    await api.post('/auth/logout');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getPermissions(): Permission[] {
    const permsStr = localStorage.getItem('permissions');
    return permsStr ? JSON.parse(permsStr) : [];
  },

  getPermissionsForRole(role: string): Permission[] {
  // Mapeo de roles a permisos
  const rolePermissions = {
    'ADMIN': Object.values(PERMISSIONS),
    'LAB_MANAGER': [
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
    'RESEARCHER': [
      PERMISSIONS.VIEW_REAGENT,
      PERMISSIONS.VIEW_EQUIPMENT,
      PERMISSIONS.CREATE_EXPERIMENT,
      PERMISSIONS.EDIT_EXPERIMENT,
      PERMISSIONS.VIEW_EXPERIMENT,
      PERMISSIONS.VIEW_REPORTS
    ],
    'LAB_TECH': [
      PERMISSIONS.VIEW_REAGENT,
      PERMISSIONS.VIEW_EQUIPMENT,
      PERMISSIONS.CALIBRATE_EQUIPMENT,
      PERMISSIONS.VIEW_EXPERIMENT
    ]
  };

  return rolePermissions[role as keyof typeof rolePermissions] || [];
  },

  hasPermission(permission: Permission): boolean {
    const permissions = this.getPermissions();
    return permissions.includes(permission);
  },

  hasAnyPermission(permissions: Permission[]): boolean {
    const userPermissions = this.getPermissions();
    return permissions.some(p => userPermissions.includes(p));
  },

  hasAllPermissions(permissions: Permission[]): boolean {
    const userPermissions = this.getPermissions();
    return permissions.every(p => userPermissions.includes(p));
  },

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
  }
};
