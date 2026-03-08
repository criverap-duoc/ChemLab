import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  MenuItem,
  Box,
  Chip,
  IconButton,
  CardActions,
  Paper,
  InputAdornment,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Science as ScienceIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { equipmentService } from '../../services/equipmentService';
import { Equipment, EquipmentStatus, StatusColors, CreateEquipmentDto } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const EquipmentList: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreateEquipmentDto>({
    name: '',
    model: '',
    serialNumber: '',
    location: '',
    status: 0,
    lastCalibration: '',
    nextCalibration: '',
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    const data = await equipmentService.getAll();
    setEquipment(data.data);
  };

  const handleOpenDialog = (eq?: Equipment) => {
    if (eq) {
      setSelectedEquipment(eq);
      setFormData({
        name: eq.name,
        model: eq.model,
        serialNumber: eq.serialNumber || '',
        location: eq.location,
        status: eq.status,
        lastCalibration: eq.lastCalibration || '',
        nextCalibration: eq.nextCalibration || '',
      });
    } else {
      setSelectedEquipment(null);
      setFormData({
        name: '',
        model: '',
        serialNumber: '',
        location: '',
        status: 0,
        lastCalibration: '',
        nextCalibration: '',
      });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (selectedEquipment) {
      await equipmentService.update(selectedEquipment.id, formData);
    } else {
      await equipmentService.create(formData);
    }
    setOpenDialog(false);
    loadEquipment();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este equipo?')) {
      await equipmentService.delete(id);
      loadEquipment();
    }
  };

  const getStatusText = (status: number) => {
    return EquipmentStatus[status as keyof typeof EquipmentStatus] || 'Desconocido';
  };

  const formatDate = (date?: string) => {
    if (!date) return 'No registrada';
    return format(new Date(date), 'dd/MM/yyyy', { locale: es });
  };

  const isCalibrationDue = (nextCalibration?: string) => {
    if (!nextCalibration) return false;
    const next = new Date(nextCalibration);
    const today = new Date();
    const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const filteredEquipment = equipment.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Equipos de Laboratorio
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Gestiona el inventario de equipos y su calendario de calibraciones
        </Typography>
      </Box>

      {/* Barra de búsqueda y acciones */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ flex: '1 1 60%', minWidth: '300px' }}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre, modelo o ubicación..."
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
          </Box>
          <Box sx={{ flex: '0 1 auto', minWidth: '200px' }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Nuevo Equipo
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Grid de equipos con flexbox */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {filteredEquipment.map((item) => {
          const dueSoon = isCalibrationDue(item.nextCalibration);
          return (
            <Box key={item.id} sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: dueSoon ? '2px solid' : 'none',
                  borderColor: 'error.main',
                }}
              >
                {dueSoon && (
                  <Chip
                    label="¡Calibración próxima!"
                    color="error"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -10,
                      right: 10,
                      zIndex: 1,
                      fontWeight: 'bold',
                    }}
                  />
                )}
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <BuildIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" noWrap sx={{ maxWidth: 200 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {item.model}
                      </Typography>
                    </Box>
                  </Box>

                  {item.serialNumber && (
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Serial:</strong> {item.serialNumber}
                    </Typography>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Ubicación:</strong> {item.location}
                    </Typography>

                    <Box sx={{ mt: 1, mb: 2 }}>
                      <Chip
                        label={getStatusText(item.status)}
                        sx={{
                          bgcolor: StatusColors[item.status as keyof typeof StatusColors],
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                        size="small"
                      />
                    </Box>

                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Última calibración:</strong> {formatDate(item.lastCalibration)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" color={dueSoon ? 'error' : 'action'} />
                        <Typography
                          variant="body2"
                          sx={{
                            color: dueSoon ? 'error.main' : 'inherit',
                            fontWeight: dueSoon ? 'bold' : 'normal'
                          }}
                        >
                          <strong>Próxima calibración:</strong> {formatDate(item.nextCalibration)}
                        </Typography>
                      </Box>
                    </Paper>

                    <Typography variant="caption" display="block" sx={{ mt: 2, color: 'textSecondary' }}>
                      Creado por: {item.createdBy}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ mt: 'auto', justifyContent: 'flex-end' }}>
                  <Tooltip title="Editar">
                    <IconButton onClick={() => handleOpenDialog(item)} color="primary">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton onClick={() => handleDelete(item.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Box>
          );
        })}
      </Box>

      {/* Diálogo de creación/edición */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          {selectedEquipment ? 'Editar Equipo' : 'Nuevo Equipo'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
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
            label="Modelo *"
            margin="normal"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Número de Serie"
            margin="normal"
            value={formData.serialNumber}
            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
          />
          <TextField
            fullWidth
            label="Ubicación *"
            margin="normal"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
          <TextField
            fullWidth
            select
            label="Estado *"
            margin="normal"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
          >
            {Object.entries(EquipmentStatus).map(([value, label]) => (
              <MenuItem key={value} value={Number(value)}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: StatusColors[Number(value) as keyof typeof StatusColors],
                    }}
                  />
                  {label}
                </Box>
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Última Calibración"
            type="date"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={formData.lastCalibration}
            onChange={(e) => setFormData({ ...formData, lastCalibration: e.target.value })}
          />
          <TextField
            fullWidth
            label="Próxima Calibración"
            type="date"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={formData.nextCalibration}
            onChange={(e) => setFormData({ ...formData, nextCalibration: e.target.value })}
          />
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            onClick={handleSubmit}
            size="large"
          >
            {selectedEquipment ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogContent>
      </Dialog>
    </Container>
  );
};
