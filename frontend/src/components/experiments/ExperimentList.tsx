import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  TextField,
  InputAdornment,
  MenuItem,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';
import { experimentService } from '../../services/experimentService';
import { Experiment, ExperimentStatus } from '../../types/experiment';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const ExperimentList: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | 'all'>('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    protocol: '',
    notes: '',
  });

  useEffect(() => {
    loadExperiments();
  }, [page, statusFilter]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingExperiment, setEditingExperiment] = useState<Experiment | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    protocol: '',
    notes: '',
  });

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const data = await experimentService.getAll(page, 12, status);
      setExperiments(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error loading experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExperiment = async () => {
    try {
      await experimentService.create(formData);
      setOpenDialog(false);
      setFormData({ name: '', description: '', protocol: '', notes: '' });
      loadExperiments();
    } catch (error) {
      console.error('Error creating experiment:', error);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: number) => {
    try {
      await experimentService.updateStatus(id, newStatus);
      loadExperiments();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este experimento?')) {
      try {
        await experimentService.delete(id);
        loadExperiments();
      } catch (error) {
        console.error('Error deleting experiment:', error);
      }
    }
  };

  const handleEdit = async (experiment: Experiment) => {
    setEditingExperiment(experiment);
    setEditFormData({
      name: experiment.name,
      description: experiment.description,
      protocol: experiment.protocol || '',
      notes: experiment.notes || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateExperiment = async () => {
    if (!editingExperiment) return;

    try {
      await experimentService.update(editingExperiment.id, editFormData);
      setEditDialogOpen(false);
      setEditingExperiment(null);
      loadExperiments();
    } catch (error) {
      console.error('Error updating experiment:', error);
    }
  };

  const getStatusLabel = (status: any): string => {
    const statusStr = typeof status === 'number'
      ? ['Planned', 'InProgress', 'Completed', 'Cancelled', 'Failed'][status]
      : status;

    switch(statusStr) {
      case 'Planned': return 'Planificado';
      case 'InProgress': return 'En progreso';
      case 'Completed': return 'Completado';
      case 'Cancelled': return 'Cancelado';
      case 'Failed': return 'Fallido';
      default: return 'Desconocido';
    }
  };

  const getStatusIcon = (status: any): string => {
    const statusStr = typeof status === 'number'
      ? ['Planned', 'InProgress', 'Completed', 'Cancelled', 'Failed'][status]
      : status;

    switch(statusStr) {
      case 'Planned': return '📅';
      case 'InProgress': return '⚗️';
      case 'Completed': return '✅';
      case 'Cancelled': return '❌';
      case 'Failed': return '⚠️';
      default: return '❓';
    }
  };

  const getStatusColor = (status: any): string => {
    const statusStr = typeof status === 'number'
      ? ['Planned', 'InProgress', 'Completed', 'Cancelled', 'Failed'][status]
      : status;

    switch(statusStr) {
      case 'Planned': return '#2196f3';
      case 'InProgress': return '#ff9800';
      case 'Completed': return '#4caf50';
      case 'Cancelled': return '#9e9e9e';
      case 'Failed': return '#f44336';
      default: return '#999999';
    }
  };

  const filteredExperiments = experiments.filter(exp =>
    exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Experimentos
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Registra y da seguimiento a tus experimentos de laboratorio
        </Typography>
      </Box>

      {/* Barra de filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Buscar experimentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtrar por estado</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ExperimentStatus | 'all')}
                label="Filtrar por estado"
              >
                <MenuItem value="all">Todos los estados</MenuItem>
                <MenuItem value={0}>📅 Planificados</MenuItem>
                <MenuItem value={1}>⚗️ En progreso</MenuItem>
                <MenuItem value={2}>✅ Completados</MenuItem>
                <MenuItem value={3}>❌ Cancelados</MenuItem>
                <MenuItem value={4}>⚠️ Fallidos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Nuevo Experimento
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Grid de experimentos */}
      <Grid container spacing={3}>
        {filteredExperiments.map((exp) => {
          // Convertir status a string para comparaciones
          const statusStr = typeof exp.status === 'number'
            ? ['Planned', 'InProgress', 'Completed', 'Cancelled', 'Failed'][exp.status]
            : exp.status;

          return (
            <Grid item xs={12} md={6} lg={4} key={exp.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
                  {/* Header con nombre y estado */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {exp.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {exp.description?.substring(0, 100)}
                        {exp.description?.length > 100 && '...'}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${getStatusIcon(exp.status)} ${getStatusLabel(exp.status)}`}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(exp.status),
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  </Box>

                  {/* Detalles */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Inicio:</strong> {exp.startDate ? format(new Date(exp.startDate), 'dd/MM/yyyy', { locale: es }) : 'No definido'}
                    </Typography>
                    {exp.endDate && (
                      <Typography variant="body2">
                        <strong>Fin:</strong> {format(new Date(exp.endDate), 'dd/MM/yyyy', { locale: es })}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      <Chip
                        label={`${exp.reagents?.length || 0} reactivos`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`${exp.equipment?.length || 0} equipos`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="caption" display="block" sx={{ mt: 2, color: 'textSecondary' }}>
                      Creado por: {exp.createdBy}
                    </Typography>
                  </Box>
                </CardContent>

                {/* Botones de acción */}
                <CardActions sx={{ mt: 'auto', justifyContent: 'flex-end' }}>
                  {statusStr === 'Planned' && (
                    <Tooltip title="Iniciar experimento">
                      <IconButton
                        onClick={() => handleUpdateStatus(exp.id, 1)}
                        color="success"
                        size="small"
                      >
                        <StartIcon />
                      </IconButton>
                    </Tooltip>
                  )}

                  {statusStr === 'InProgress' && (
                    <>
                      <Tooltip title="Completar">
                        <IconButton
                          onClick={() => handleUpdateStatus(exp.id, 2)}
                          color="success"
                          size="small"
                        >
                          <CompleteIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Detener">
                        <IconButton
                          onClick={() => handleUpdateStatus(exp.id, 4)}
                          color="error"
                          size="small"
                        >
                          <StopIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}

                  <Tooltip title="Editar">
                    <IconButton
                      onClick={() => handleEdit(exp)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Eliminar">
                    <IconButton
                      onClick={() => handleDelete(exp.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Paginación */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Diálogo de creación */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nuevo Experimento</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre *"
            margin="normal"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Descripción *"
            margin="normal"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Protocolo"
            margin="normal"
            multiline
            rows={4}
            value={formData.protocol}
            onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
            placeholder="Describe el procedimiento experimental..."
          />
          <TextField
            fullWidth
            label="Notas adicionales"
            margin="normal"
            multiline
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateExperiment} variant="contained" color="primary">
            Crear Experimento
          </Button>
        </DialogActions>
      </Dialog>
      {/* Diálogo de edición */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Editar Experimento</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre *"
            margin="normal"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Descripción *"
            margin="normal"
            multiline
            rows={3}
            value={editFormData.description}
            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Protocolo"
            margin="normal"
            multiline
            rows={4}
            value={editFormData.protocol}
            onChange={(e) => setEditFormData({ ...editFormData, protocol: e.target.value })}
            placeholder="Describe el procedimiento experimental..."
          />
          <TextField
            fullWidth
            label="Notas adicionales"
            margin="normal"
            multiline
            rows={2}
            value={editFormData.notes}
            onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleUpdateExperiment} variant="contained" color="primary">
            Actualizar Experimento
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
