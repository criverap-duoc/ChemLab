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
import { ExperimentReagentSelector } from './ExperimentReagentSelector';
import { ExperimentEquipmentSelector } from './ExperimentEquipmentSelector';

interface SelectedReagent {
  reagentId: string;
  reagentName: string;
  quantityUsed: number;
  unit: string;
  batchNumber?: string;
}

interface SelectedEquipment {
  equipmentId: string;
  equipmentName: string;
  usageHours?: number;
  calibrationBefore?: string;
  calibrationAfter?: string;
}

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
    startDate: '',
  });

  const [selectedReagents, setSelectedReagents] = useState<SelectedReagent[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<SelectedEquipment[]>([]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingExperiment, setEditingExperiment] = useState<Experiment | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    protocol: '',
    notes: '',
    startDate: ''
  });
  const [editReagents, setEditReagents] = useState<SelectedReagent[]>([]);
  const [editEquipment, setEditEquipment] = useState<SelectedEquipment[]>([]);

  useEffect(() => {
    loadExperiments();
  }, [page, statusFilter]);

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
      const payload = {
        name: formData.name,
        description: formData.description,
        protocol: formData.protocol || undefined,
        notes: formData.notes || undefined,
        startDate: formData.startDate || undefined,
        reagents: selectedReagents,
        equipment: selectedEquipment
      };

      await experimentService.create(payload);
      setOpenDialog(false);
      setFormData({ name: '', description: '', protocol: '', notes: '', startDate: '' });
      setSelectedReagents([]);
      setSelectedEquipment([]);
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

  const handleEditExperiment = async (experiment: Experiment) => {
    setEditingExperiment(experiment);

    setEditFormData({
      name: experiment.name,
      description: experiment.description,
      protocol: experiment.protocol || '',
      notes: experiment.notes || '',
      startDate: experiment.startDate?.split('T')[0] || ''
    });

    // Cargar reactivos asociados (sin acceder a r.reagent)
    const reagentsList = experiment.reagents?.map(r => ({
      reagentId: r.reagentId,
      reagentName: r.reagentName || `Reactivo ${r.reagentId.slice(0, 8)}`,
      quantityUsed: r.quantityUsed,
      unit: r.unit,
      batchNumber: r.batchNumber
    })) || [];
    setEditReagents(reagentsList);

    // Cargar equipos asociados
    const equipmentList = experiment.equipment?.map(e => ({
      equipmentId: e.equipmentId,
      equipmentName: e.equipmentName || `Equipo ${e.equipmentId.slice(0, 8)}`,
      usageHours: e.usageHours,
      calibrationBefore: e.calibrationBefore,
      calibrationAfter: e.calibrationAfter
    })) || [];
    setEditEquipment(equipmentList);

    setEditDialogOpen(true);
  };

  const handleUpdateExperiment = async () => {
    if (!editingExperiment) return;

    try {
      const payload = {
        name: editFormData.name,
        description: editFormData.description,
        protocol: editFormData.protocol || undefined,
        notes: editFormData.notes || undefined,
        startDate: editFormData.startDate || undefined,
        reagents: editReagents,
        equipment: editEquipment
      };

      await experimentService.update(editingExperiment.id, payload);
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
          const statusStr = typeof exp.status === 'number'
            ? ['Planned', 'InProgress', 'Completed', 'Cancelled', 'Failed'][exp.status]
            : exp.status;

          return (
            <Grid item xs={12} md={6} lg={4} key={exp.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
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
                      onClick={() => handleEditExperiment(exp)}
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
            label="Fecha de inicio"
            type="date"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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
          <ExperimentReagentSelector
            value={selectedReagents}
            onChange={setSelectedReagents}
          />
          <ExperimentEquipmentSelector
            value={selectedEquipment}
            onChange={setSelectedEquipment}
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
          <TextField
            fullWidth
            label="Fecha de inicio"
            type="date"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={editFormData.startDate}
            onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
          />
          <ExperimentReagentSelector
            value={editReagents}
            onChange={setEditReagents}
          />
          <ExperimentEquipmentSelector
            value={editEquipment}
            onChange={setEditEquipment}
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
