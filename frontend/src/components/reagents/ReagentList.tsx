// @ts-ignore
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
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
  Avatar,
  Tooltip,
  Paper,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Science as ScienceIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Warning as WarningIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { reagentService } from '../../services/reagentService';
import { Reagent, CreateReagentDto } from '../../types';
import { useTheme } from '@mui/material/styles';
import { EntityHistory } from '../traceability/EntityHistory';
import { pubchemService, PubChemData, PubChemSearchResult } from '../../services/pubchemService';

const hazardLevels = [
  { value: 0, label: 'Ninguno', color: '#4caf50', icon: '✅' },
  { value: 1, label: 'Bajo', color: '#2196f3', icon: '⚠️' },
  { value: 2, label: 'Moderado', color: '#ff9800', icon: '⚠️⚠️' },
  { value: 3, label: 'Alto', color: '#f44336', icon: '☠️' },
  { value: 4, label: 'Extremo', color: '#9c27b0', icon: '☠️☠️' },
];

const units = ['ml', 'l', 'g', 'kg', 'mol', 'mg'];

export const ReagentList: React.FC = () => {
  const [reagents, setReagents] = useState<Reagent[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReagent, setSelectedReagent] = useState<Reagent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHazard, setFilterHazard] = useState<number | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState<CreateReagentDto>({
    name: '',
    chemicalFormula: '',
    casNumber: '',
    quantity: 0,
    unit: 'ml',
    location: '',
    hazardLevel: 1,
    supplier: '',
    expiryDate: '',
    minQuantity: 10,
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedForHistory, setSelectedForHistory] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [enrichedData, setEnrichedData] = useState<PubChemData | null>(null);

  const theme = useTheme();

  useEffect(() => {
    loadReagents();
  }, [page, searchTerm, filterHazard]);

  const loadReagents = async () => {
    const data = await reagentService.getAll();
    let filtered = data.data;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.chemicalFormula.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por nivel de peligro
    if (filterHazard !== 'all') {
      filtered = filtered.filter(r => r.hazardLevel === filterHazard);
    }

    // Paginación
    const itemsPerPage = 12;
    const start = (page - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    setReagents(paginated);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  };

  const handleOpenDialog = (reagent?: Reagent) => {
    if (reagent) {
      setSelectedReagent(reagent);
      setFormData({
        name: reagent.name,
        chemicalFormula: reagent.chemicalFormula,
        casNumber: reagent.casNumber || '',
        quantity: reagent.quantity,
        unit: reagent.unit,
        location: reagent.location,
        hazardLevel: reagent.hazardLevel,
        supplier: reagent.supplier || '',
        expiryDate: reagent.expiryDate || '',
        minQuantity: 10, // Esto debería venir del backend
      });
    } else {
      setSelectedReagent(null);
      setFormData({
        name: '',
        chemicalFormula: '',
        casNumber: '',
        quantity: 0,
        unit: 'ml',
        location: '',
        hazardLevel: 1,
        supplier: '',
        expiryDate: '',
        minQuantity: 10,
      });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (selectedReagent) {
      await reagentService.update(selectedReagent.id, formData);
    } else {
      await reagentService.create(formData);
    }
    setOpenDialog(false);
    loadReagents();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este reactivo?')) {
      await reagentService.delete(id);
      loadReagents();
    }
  };

  const handleViewHistory = (reagent: Reagent) => {
  setSelectedForHistory({ id: reagent.id, name: reagent.name });
  setHistoryOpen(true);
  };


  const getHazardInfo = (level: number) => {
    return hazardLevels[level] || hazardLevels[0];
  };

  const isLowStock = (reagent: Reagent) => {
    return reagent.quantity < reagent.minQuantity;
  };

  const isExpiringSoon = (date?: string) => {
    if (!date) return false;
    const expiry = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (date?: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  // Reemplazar la función handlePubChemSearch existente con:
  const handlePubChemSearch = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // La nueva versión de searchByName ya devuelve PubChemSearchResult[]
      const results = await pubchemService.searchByName(query);
      setSearchResults(results || []);
      console.log('Resultados de búsqueda:', results);
    } catch (error) {
      console.error('Error searching PubChem:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Actualizar handleSelectFromPubChem para recibir CID directamente
  const handleSelectFromPubChem = async (cid: number) => {
    setSearching(true);
    try {
      const data = await pubchemService.getCompoundDetails(cid);
      if (data) {
        setEnrichedData({
          ...data,
          ghsPictograms: await pubchemService.getGHSPictograms(formData.casNumber || ''),
        });
        setFormData({
          ...formData,
          name: data.iupacName || formData.name,
          chemicalFormula: data.formula || formData.chemicalFormula,
        });
      }
    } catch (error) {
      console.error('Error enriching data:', error);
    } finally {
      setSearching(false);
    }
  };



  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Reactivos Químicos
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Gestiona el inventario de reactivos del laboratorio
        </Typography>
      </Box>

      {/* Barra de filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre, fórmula o ubicación..."
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
              <InputLabel>Filtrar por peligro</InputLabel>
              <Select
                value={filterHazard}
                onChange={(e) => setFilterHazard(e.target.value as number | 'all')}
                label="Filtrar por peligro"
              >
                <MenuItem value="all">Todos los niveles</MenuItem>
                {hazardLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: level.color,
                        }}
                      />
                      {level.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Nuevo Reactivo
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Grid de reactivos */}
      <Grid container spacing={3}>
        {reagents.map((reagent) => {
          const hazard = getHazardInfo(reagent.hazardLevel);
          const lowStock = isLowStock(reagent);
          const expiringSoon = isExpiringSoon(reagent.expiryDate);
          const expired = isExpired(reagent.expiryDate);

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={reagent.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: hazard.color }}>
                        <ScienceIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" noWrap sx={{ maxWidth: 150 }}>
                          {reagent.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {reagent.chemicalFormula}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={hazard.label}
                      size="small"
                      sx={{
                        bgcolor: hazard.color,
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Cantidad:</strong> {reagent.quantity} {reagent.unit}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Ubicación:</strong> {reagent.location}
                    </Typography>
                    {reagent.supplier && (
                      <Typography variant="body2">
                        <strong>Proveedor:</strong> {reagent.supplier}
                      </Typography>
                    )}
                    {reagent.expiryDate && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: expired ? 'error.main' : expiringSoon ? 'warning.main' : 'inherit',
                          fontWeight: expired || expiringSoon ? 'bold' : 'normal',
                        }}
                      >
                        <strong>Vence:</strong> {new Date(reagent.expiryDate).toLocaleDateString()}
                        {expired && ' (Vencido)'}
                        {expiringSoon && !expired && ' (Próximo a vencer)'}
                      </Typography>
                    )}
                  </Box>

                  {(lowStock || expired || expiringSoon) && (
                    <Box sx={{ mt: 2 }}>
                      {lowStock && (
                        <Chip
                          icon={<WarningIcon />}
                          label="Stock Bajo"
                          color="warning"
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      )}
                      {expired && (
                        <Chip
                          icon={<WarningIcon />}
                          label="Vencido"
                          color="error"
                          size="small"
                        />
                      )}
                    </Box>
                  )}

                  <Typography variant="caption" display="block" sx={{ mt: 2, color: 'textSecondary' }}>
                    Creado por: {reagent.createdBy}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <Tooltip title="Editar">
                    <IconButton onClick={() => handleOpenDialog(reagent)} color="primary">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton onClick={() => handleDelete(reagent.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Ver historial">
                    <IconButton onClick={() => handleViewHistory(reagent)} color="info">
                      <HistoryIcon />
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

      {/* Diálogo de creación/edición */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          {selectedReagent ? 'Editar Reactivo' : 'Nuevo Reactivo'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Buscar en PubChem (Base de datos química gratuita)
            </Typography>
            <TextField
              fullWidth
              placeholder="Buscar por nombre químico..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handlePubChemSearch(e.target.value);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searching && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ),
              }}
              size="small"
            />

            {searchResults.length > 0 && (
              <Paper sx={{ mt: 1, maxHeight: 300, overflow: 'auto' }}>
                {searchResults.map((result, index) => {
                  // Verificar que molecularWeight sea número antes de usar toFixed
                  const molecularWeight = typeof result.molecularWeight === 'number'
                    ? result.molecularWeight
                    : parseFloat(result.molecularWeight as any);

                  return (
                    <MenuItem
                      key={index}
                      onClick={() => handleSelectFromPubChem(result.cid)}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        borderBottom: index < searchResults.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        py: 1.5,
                        width: '100%',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <ScienceIcon fontSize="small" color="primary" />
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {result.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, ml: 4, mt: 0.5, flexWrap: 'wrap' }}>
                        {result.formula && (
                          <Chip
                            label={`Fórmula: ${result.formula}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                        {!isNaN(molecularWeight) && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>
                            PM: {molecularWeight.toFixed(2)}
                          </Typography>
                        )}
                        <Typography variant="caption" color="primary" sx={{ alignSelf: 'center' }}>
                          CID: {result.cid}
                        </Typography>
                      </Box>
                    </MenuItem>
                  );
                })}
              </Paper>
            )}
          </Box>
          {enrichedData && (
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle2">Datos de PubChem:</Typography>
              <Typography variant="body2">Fórmula: {enrichedData.formula}</Typography>
              <Typography variant="body2">Peso molecular: {enrichedData.molecularWeight}</Typography>
              <Typography variant="body2">InChI Key: {enrichedData.inchiKey}</Typography>
              {enrichedData.ghsPictograms && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  {enrichedData.ghsPictograms.map((picto) => (
                    <Chip
                      key={picto}
                      label={picto}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre *"
                margin="normal"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fórmula Química *"
                margin="normal"
                value={formData.chemicalFormula}
                onChange={(e) => setFormData({ ...formData, chemicalFormula: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Número CAS"
                margin="normal"
                value={formData.casNumber}
                onChange={(e) => setFormData({ ...formData, casNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Proveedor"
                margin="normal"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Cantidad *"
                type="number"
                margin="normal"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Unidad *"
                margin="normal"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                {units.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Cantidad Mínima *"
                type="number"
                margin="normal"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
                helperText="Alerta de stock bajo"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ubicación *"
                margin="normal"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Nivel de Peligro *"
                margin="normal"
                value={formData.hazardLevel}
                onChange={(e) => setFormData({ ...formData, hazardLevel: Number(e.target.value) })}
              >
                {hazardLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: level.color,
                        }}
                      />
                      {level.label}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fecha de Vencimiento"
                type="date"
                margin="normal"
                InputLabelProps={{ shrink: true }}
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </Grid>
          </Grid>
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            onClick={handleSubmit}
            size="large"
          >
            {selectedReagent ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogContent>
      </Dialog>
      <EntityHistory
        entityType="reagent"
        entityId={selectedForHistory?.id || ''}
        entityName={selectedForHistory?.name || ''}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </Container>
  );
};
