import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { ROLES, ROLE_PERMISSIONS, User } from '../../types';
import { userService } from '../../services/userService';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getAll();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser({ ...user });
    setOpenDialog(true);
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (window.confirm(`¿${currentStatus ? 'desactivar' : 'activar'} este usuario?`)) {
      try {
        await userService.toggleStatus(userId, !currentStatus);
        await loadUsers();
      } catch (err) {
        console.error('Error toggling user status:', err);
      }
    }
  };

  const handleUpdateRole = async () => {
    if (selectedUser) {
      try {
        await userService.updateRole(selectedUser.id, selectedUser.role);
        setOpenDialog(false);
        await loadUsers();
      } catch (err) {
        console.error('Error updating role:', err);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        await userService.delete(userId);
        await loadUsers();
      } catch (err) {
        console.error('Error deleting user:', err);
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'ADMIN': return 'error';
      case 'LAB_MANAGER': return 'warning';
      case 'RESEARCHER': return 'info';
      case 'LAB_TECH': return 'success';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'ADMIN': return 'Administrador';
      case 'LAB_MANAGER': return 'Jefe de Laboratorio';
      case 'RESEARCHER': return 'Investigador';
      case 'LAB_TECH': return 'Técnico';
      default: return role;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Usuarios
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Administra los usuarios y sus permisos en el sistema
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Último acceso</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar>
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        ID: {user.id.slice(0, 8)}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={getRoleLabel(user.role)}
                    color={getRoleColor(user.role) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? 'Activo' : 'Inactivo'}
                    color={user.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleString()
                    : 'Nunca'
                  }
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleEditUser(user)}
                    color="primary"
                    size="small"
                    title="Editar rol"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                    color={user.isActive ? 'warning' : 'success'}
                    size="small"
                    title={user.isActive ? 'Desactivar' : 'Activar'}
                  >
                    {user.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteUser(user.id)}
                    color="error"
                    size="small"
                    title="Eliminar"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo para editar rol */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Rol de Usuario</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Usuario: {selectedUser.firstName} {selectedUser.lastName}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Email: {selectedUser.email}
              </Typography>

              <FormControl fullWidth margin="normal">
                <InputLabel>Rol</InputLabel>
                <Select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    role: e.target.value as User['role']
                  })}
                  label="Rol"
                >
                  {Object.entries(ROLES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={getRoleLabel(key)}
                          color={getRoleColor(key) as any}
                          size="small"
                        />
                        <Typography variant="body2" color="textSecondary">
                          ({ROLE_PERMISSIONS[key as keyof typeof ROLE_PERMISSIONS]?.length || 0} permisos)
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Permisos del rol:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {ROLE_PERMISSIONS[selectedUser.role as keyof typeof ROLE_PERMISSIONS]?.map((permission) => (
                    <Chip
                      key={permission}
                      label={permission.split(':')[1]}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleUpdateRole} variant="contained" color="primary">
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
