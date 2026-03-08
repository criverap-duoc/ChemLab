import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { Permission, User } from '../types';

export const usePermissions = () => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = () => {
    const currentUser = authService.getCurrentUser();
    const userPermissions = authService.getPermissions();

    setUser(currentUser);
    setPermissions(userPermissions);
    setLoading(false);
  };

  const can = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const canAny = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some(p => permissions.includes(p));
  };

  const canAll = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every(p => permissions.includes(p));
  };

  const isAdmin = (): boolean => {
    return user?.role === 'ADMIN'; // Cambiado de 'Admin' a 'ADMIN'
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  return {
    user,
    permissions,
    loading,
    can,
    canAny,
    canAll,
    isAdmin,
    hasRole
  };
};
