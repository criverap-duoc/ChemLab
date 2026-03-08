import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Permission } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requireAll?: boolean;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requireAll = true,
  fallbackPath = '/login'
}) => {
  const user = authService.getCurrentUser();

  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to={fallbackPath} />;
  }

  // Si no se requieren permisos específicos, permitir acceso
  if (requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  // Verificar permisos
  let hasRequiredPermissions = false;
  if (requireAll) {
    hasRequiredPermissions = authService.hasAllPermissions(requiredPermissions);
  } else {
    hasRequiredPermissions = authService.hasAnyPermission(requiredPermissions);
  }

  if (!hasRequiredPermissions) {
    return <Navigate to="/dashboard" />; // Redirigir al dashboard si no tiene permisos
  }

  return <>{children}</>;
};
