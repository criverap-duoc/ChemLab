import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const user = authService.getCurrentUser();

  // Si no hay usuario, redirigir al login conservando la ruta original.
  // `replace` evita que la ruta protegida quede en el historial.
  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${fallbackPath}?returnUrl=${returnUrl}`} replace />;
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
