import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  Grid,
  Alert
} from '@mui/material';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../types';
import { authService } from '../../services/authService';

export const RoleTester: React.FC = () => {
  const { user, permissions, isAdmin, can } = usePermissions();

  const handleForceAdmin = () => {
    // SOLO PARA PRUEBAS: Forzar rol de ADMIN
    if (user) {
      const adminUser = { ...user, role: 'ADMIN' };
      localStorage.setItem('user', JSON.stringify(adminUser));
      localStorage.setItem('permissions', JSON.stringify(Object.values(PERMISSIONS)));
      window.location.reload();
    }
  };

  const handleForceLabManager = () => {
    if (user) {
      const labManagerUser = { ...user, role: 'LAB_MANAGER' };
      localStorage.setItem('user', JSON.stringify(labManagerUser));
      localStorage.setItem('permissions', JSON.stringify([
        PERMISSIONS.CREATE_REAGENT,
        PERMISSIONS.EDIT_REAGENT,
        PERMISSIONS.VIEW_REAGENT,
        PERMISSIONS.CREATE_EQUIPMENT,
        PERMISSIONS.EDIT_EQUIPMENT,
        PERMISSIONS.VIEW_EQUIPMENT,
      ]));
      window.location.reload();
    }
  };

  const handleForceResearcher = () => {
    if (user) {
      const researcherUser = { ...user, role: 'RESEARCHER' };
      localStorage.setItem('user', JSON.stringify(researcherUser));
      localStorage.setItem('permissions', JSON.stringify([
        PERMISSIONS.VIEW_REAGENT,
        PERMISSIONS.VIEW_EQUIPMENT,
      ]));
      window.location.reload();
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <Container>
        <Alert severity="warning">No hay usuario logueado</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Probador de Roles
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Usuario Actual:</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography><strong>Email:</strong> {user.email}</Typography>
              <Typography><strong>Nombre:</strong> {user.firstName} {user.lastName}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography><strong>Rol:</strong>
                <Chip
                  label={user.role}
                  color={user.role === 'ADMIN' ? 'error' : 'primary'}
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography><strong>Es Admin?</strong> {isAdmin() ? '✅' : '❌'}</Typography>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Permisos ({permissions.length}):</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {permissions.map(perm => (
              <Chip
                key={perm}
                label={perm}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Permisos Específicos:</Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Chip
                label={`VER REAGENTES: ${can(PERMISSIONS.VIEW_REAGENT) ? '✅' : '❌'}`}
                color={can(PERMISSIONS.VIEW_REAGENT) ? 'success' : 'default'}
              />
            </Grid>
            <Grid item xs={4}>
              <Chip
                label={`CREAR REAGENTES: ${can(PERMISSIONS.CREATE_REAGENT) ? '✅' : '❌'}`}
                color={can(PERMISSIONS.CREATE_REAGENT) ? 'success' : 'default'}
              />
            </Grid>
            <Grid item xs={4}>
              <Chip
                label={`VER EQUIPOS: ${can(PERMISSIONS.VIEW_EQUIPMENT) ? '✅' : '❌'}`}
                color={can(PERMISSIONS.VIEW_EQUIPMENT) ? 'success' : 'default'}
              />
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" color="error" onClick={handleForceAdmin}>
            Forzar ADMIN
          </Button>
          <Button variant="contained" color="warning" onClick={handleForceLabManager}>
            Forzar LAB MANAGER
          </Button>
          <Button variant="contained" color="info" onClick={handleForceResearcher}>
            Forzar RESEARCHER
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};
