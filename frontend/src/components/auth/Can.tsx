import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../types';

interface CanProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null
}) => {
  const { can, canAll, canAny } = usePermissions();

  // Si hay un solo permiso
  if (permission) {
    return can(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Si hay múltiples permisos
  if (permissions.length > 0) {
    const hasPermission = requireAll
      ? canAll(permissions)
      : canAny(permissions);

    return hasPermission ? <>{children}</> : <>{fallback}</>;
  }

  return <>{children}</>;
};
