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
  Avatar,
  Divider,
  Alert,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as ApproveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assignment as RequestIcon,
} from '@mui/icons-material';
import { requestService } from '../../services/requestService';
import {
  Request,
  RequestStatus,
  RequestType,
  RequestPriority,
  requestStatusColors,
  requestTypeColors,
  requestPriorityColors,
  requestStatusIcons,
  requestTypeIcons
} from '../../types/request';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../types';
import { PubChemSearch } from './PubChemSearch';

// Definir tipo para los items del formulario
interface RequestFormItem {
  itemName: string;
  quantity?: number;
  unit?: string;
  catalogNumber?: string;
  specifications?: string;
  supplier?: string;
  estimatedPrice?: number;
}

export const RequestList: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<RequestType | 'all'>('all');
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [approveComment, setApproveComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: RequestType;
    priority: RequestPriority;
    expectedDate: string;
    items: RequestFormItem[];
  }>({
    title: '',
    description: '',
    type: 'Reagent',
    priority: 1,
    expectedDate: '',
    items: [{
      itemName: '',
      quantity: undefined,
      unit: '',
      catalogNumber: '',
      specifications: '',
      supplier: '',
      estimatedPrice: undefined
    }]
  });

  const { isAdmin, can } = usePermissions();
  const canApprove = isAdmin() || can(PERMISSIONS.MANAGE_USERS);

  useEffect(() => {
    loadRequests();
  }, [page, statusFilter, typeFilter, tabValue]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params: any = { page, pageSize: 12 };

      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;

      let data;
      if (tabValue === 0) {
        data = await requestService.getAll(params);
      } else {
        data = await requestService.getMyRequests(page, 12);
      }

      setRequests(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    try {
      // Filtrar items vacíos
      const itemsToSend = formData.items.filter(item => item.itemName.trim() !== '');

      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        expectedDate: formData.expectedDate || undefined,  // <-- CAMBIAR null por undefined
        items: itemsToSend.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity || undefined,  // <-- null por undefined
          unit: item.unit || undefined,          // <-- null por undefined
          catalogNumber: item.catalogNumber || undefined,
          specifications: item.specifications || undefined,
          supplier: item.supplier || undefined,
          estimatedPrice: item.estimatedPrice || undefined
        }))
      };

      console.log('Enviando solicitud:', JSON.stringify(payload, null, 2));

      await requestService.create(payload);
      setOpenDialog(false);
      setFormData({
        title: '',
        description: '',
        type: 'Reagent',
        priority: 1,
        expectedDate: '',
        items: [{ itemName: '', quantity: undefined, unit: '' }]
      });
      loadRequests();
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    try {
      await requestService.reject(selectedRequest.id, { rejectionReason: rejectReason });
      setOpenRejectDialog(false);
      setOpenViewDialog(false);
      setSelectedRequest(null);
      setRejectReason('');
      loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleCancelRequest = async (id: string) => {
    if (!window.confirm('¿Estás seguro de cancelar esta solicitud?')) return;
    try {
      await requestService.cancel(id);
      loadRequests();
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta solicitud?')) return;
    try {
      await requestService.delete(id);
      loadRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  const handleViewRequest = (request: Request) => {
    setSelectedRequest(request);
    setOpenViewDialog(true);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: '', quantity: undefined, unit: '' }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index: number, field: keyof RequestFormItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const getStatusChip = (status: RequestStatus) => (
    <Chip
      label={`${requestStatusIcons[status]} ${status}`}
      size="small"
      sx={{
        bgcolor: requestStatusColors[status],
        color: 'white',
        fontWeight: 'bold',
      }}
    />
  );

  const getTypeChip = (type: RequestType) => (
    <Chip
      label={`${requestTypeIcons[type]} ${type}`}
      size="small"
      sx={{
        bgcolor: requestTypeColors[type],
        color: 'white',
        fontWeight: 'bold',
        mr: 1
      }}
    />
  );

  const getPriorityChip = (priority: RequestPriority) => (
    <Chip
      label={priority}
      size="small"
      sx={{
        bgcolor: requestPriorityColors[priority],
        color: 'white',
        fontWeight: 'bold',
      }}
    />
  );

  const filteredRequests = requests.filter(req =>
    req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;
    try {
      await requestService.approve(selectedRequest.id, { comments: approveComment });
      setOpenApproveDialog(false);
      setOpenViewDialog(false);
      setSelectedRequest(null);
      setApproveComment('');
      loadRequests();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Solicitudes
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Gestiona las solicitudes de reactivos, equipos y servicios
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Todas las solicitudes" />
          <Tab label="Mis solicitudes" />
        </Tabs>
      </Paper>

      {/* Barra de filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar solicitudes..."
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtrar por estado</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RequestStatus | 'all')}
                label="Filtrar por estado"
              >
                <MenuItem value="all">Todos los estados</MenuItem>
                <MenuItem value="Pending">⏳ Pendientes</MenuItem>
                <MenuItem value="Approved">✅ Aprobadas</MenuItem>
                <MenuItem value="Rejected">❌ Rechazadas</MenuItem>
                <MenuItem value="InProgress">⚙️ En progreso</MenuItem>
                <MenuItem value="Completed">🎉 Completadas</MenuItem>
                <MenuItem value="Cancelled">🚫 Canceladas</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtrar por tipo</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as RequestType | 'all')}
                label="Filtrar por tipo"
              >
                <MenuItem value="all">Todos los tipos</MenuItem>
                <MenuItem value="Reagent">🧪 Reactivos</MenuItem>
                <MenuItem value="Equipment">🔧 Equipos</MenuItem>
                <MenuItem value="Maintenance">🛠️ Mantenimiento</MenuItem>
                <MenuItem value="Calibration">📏 Calibración</MenuItem>
                <MenuItem value="Other">📦 Otros</MenuItem>
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
              Nueva Solicitud
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Grid de solicitudes */}
      <Grid container spacing={3}>
        {filteredRequests.map((req) => (
          <Grid item xs={12} md={6} lg={4} key={req.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: requestTypeColors[req.type] }}>
                      {requestTypeIcons[req.type]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {req.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {req.requestedBy.name}
                      </Typography>
                    </Box>
                  </Box>
                  {getStatusChip(req.status)}
                </Box>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  {req.description.substring(0, 100)}
                  {req.description.length > 100 && '...'}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    {getTypeChip(req.type)}
                    {getPriorityChip(req.priority)}
                  </Box>

                  <Typography variant="body2">
                    <strong>Solicitado:</strong> {format(new Date(req.requestedAt), 'dd/MM/yyyy', { locale: es })}
                  </Typography>

                  <Typography variant="body2">
                    <strong>Items:</strong> {req.itemsCount || req.items.length}
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ mt: 'auto', justifyContent: 'flex-end' }}>
                <Tooltip title="Ver detalles">
                  <IconButton onClick={() => handleViewRequest(req)} color="primary">
                    <ViewIcon />
                  </IconButton>
                </Tooltip>

                {req.status === 'Pending' && tabValue === 1 && (
                  <Tooltip title="Cancelar solicitud">
                    <IconButton onClick={() => handleCancelRequest(req.id)} color="warning">
                      <CancelIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {req.status === 'Pending' && canApprove && tabValue === 0 && (
                  <>
                    <Tooltip title="Aprobar">
                      <IconButton onClick={() => { setSelectedRequest(req); setOpenApproveDialog(true); }} color="success">
                        <ApproveIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Rechazar">
                      <IconButton onClick={() => { setSelectedRequest(req); setOpenRejectDialog(true); }} color="error">
                        <CancelIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                )}

                {(isAdmin() || req.status === 'Cancelled') && (
                  <Tooltip title="Eliminar">
                    <IconButton onClick={() => handleDeleteRequest(req.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
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
        <DialogTitle>Nueva Solicitud</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Título *"
            margin="normal"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Tipo *</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as RequestType })}
                  label="Tipo *"
                >
                  <MenuItem value="Reagent">🧪 Reactivo</MenuItem>
                  <MenuItem value="Equipment">🔧 Equipo</MenuItem>
                  <MenuItem value="Maintenance">🛠️ Mantenimiento</MenuItem>
                  <MenuItem value="Calibration">📏 Calibración</MenuItem>
                  <MenuItem value="Other">📦 Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Prioridad *</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) as RequestPriority })}
                  label="Prioridad *"
                >
                  <MenuItem value={0}>🟢 Baja</MenuItem>
                  <MenuItem value={1}>🟡 Media</MenuItem>
                  <MenuItem value={2}>🟠 Alta</MenuItem>
                  <MenuItem value={3}>🔴 Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>  {/* ← ESTE GRID CIERRA EL CONTENEDOR DE TIPO Y PRIORIDAD */}

          <TextField
            fullWidth
            label="Fecha esperada"
            type="date"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={formData.expectedDate}
            onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Items
          </Typography>

          {formData.items.map((item, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <PubChemSearch
                    onSelect={(result) => {
                      console.log('Resultado seleccionado:', result);
                      handleItemChange(index, 'itemName', result.name || result.label.split(' (')[0]);
                      handleItemChange(index, 'catalogNumber', `CID:${result.cid}`);
                      if (result.formula) {
                        handleItemChange(index, 'specifications', `Fórmula: ${result.formula}`);
                      }
                    }}
                    label="Buscar reactivo en PubChem"
                    placeholder="Ej: aspirina, etanol..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nombre del item *"
                    size="small"
                    value={item.itemName}
                    onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Cantidad"
                    type="number"
                    size="small"
                    value={item.quantity || ''}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Unidad"
                    size="small"
                    value={item.unit || ''}
                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    placeholder="g, ml, mg, etc."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Número CAS / Catálogo"
                    size="small"
                    value={item.catalogNumber || ''}
                    onChange={(e) => handleItemChange(index, 'catalogNumber', e.target.value)}
                    placeholder="Ej: 50-00-0 (formaldehído)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Especificaciones"
                    size="small"
                    multiline
                    rows={2}
                    value={item.specifications || ''}
                    onChange={(e) => handleItemChange(index, 'specifications', e.target.value)}
                    placeholder="Pureza, concentración, grado, etc."
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Proveedor"
                    size="small"
                    value={item.supplier || ''}
                    onChange={(e) => handleItemChange(index, 'supplier', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Precio estimado"
                    type="number"
                    size="small"
                    value={item.estimatedPrice || ''}
                    onChange={(e) => handleItemChange(index, 'estimatedPrice', parseFloat(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                {index > 0 && (
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleRemoveItem(index)}
                    >
                      Eliminar item
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Paper>
          ))}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddItem}
            sx={{ mt: 1 }}
          >
            Agregar otro item
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateRequest} variant="contained" color="primary">
            Crear Solicitud
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de vista de detalles */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        {selectedRequest && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <RequestIcon />
                <Typography variant="h6">{selectedRequest.title}</Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body1">{selectedRequest.description}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2">Solicitado por</Typography>
                  <Typography variant="body2">{selectedRequest.requestedBy.name}</Typography>
                  <Typography variant="caption" color="textSecondary">{selectedRequest.requestedBy.email}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2">Fecha</Typography>
                  <Typography variant="body2">
                    {format(new Date(selectedRequest.requestedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </Typography>
                </Grid>

                <Grid item xs={4}>
                  <Typography variant="subtitle2">Tipo</Typography>
                  <Box sx={{ mt: 1 }}>{getTypeChip(selectedRequest.type)}</Box>
                </Grid>

                <Grid item xs={4}>
                  <Typography variant="subtitle2">Prioridad</Typography>
                  <Box sx={{ mt: 1 }}>{getPriorityChip(selectedRequest.priority)}</Box>
                </Grid>

                <Grid item xs={4}>
                  <Typography variant="subtitle2">Estado</Typography>
                  <Box sx={{ mt: 1 }}>{getStatusChip(selectedRequest.status)}</Box>
                </Grid>

                {selectedRequest.expectedDate && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Fecha esperada</Typography>
                    <Typography variant="body2">
                      {format(new Date(selectedRequest.expectedDate), 'dd/MM/yyyy', { locale: es })}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Items ({selectedRequest.items?.length || 0})
                  </Typography>
                  {selectedRequest.items && selectedRequest.items.length > 0 ? (
                    selectedRequest.items.map((item, idx) => (
                      <Paper key={idx} sx={{ p: 2, mb: 1, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle2">{item.itemName}</Typography>
                        {item.quantity && (
                          <Typography variant="body2">Cantidad: {item.quantity} {item.unit || ''}</Typography>
                        )}
                        {item.catalogNumber && (
                          <Typography variant="body2">Catálogo/CAS: {item.catalogNumber}</Typography>
                        )}
                        {item.specifications && (
                          <Typography variant="body2">Especificaciones: {item.specifications}</Typography>
                        )}
                        {item.supplier && (
                          <Typography variant="body2">Proveedor: {item.supplier}</Typography>
                        )}
                        {item.estimatedPrice && (
                          <Typography variant="body2">Precio estimado: ${item.estimatedPrice}</Typography>
                        )}
                      </Paper>
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No hay items en esta solicitud
                    </Typography>
                  )}
                </Grid>

                {selectedRequest.comments && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Comentarios</Typography>
                    <Typography variant="body2">{selectedRequest.comments}</Typography>
                  </Grid>
                )}

                {selectedRequest.rejectionReason && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="error">Motivo de rechazo</Typography>
                    <Typography variant="body2" color="error">{selectedRequest.rejectionReason}</Typography>
                  </Grid>
                )}

                {selectedRequest.approvedBy && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Aprobado por</Typography>
                    <Typography variant="body2">{selectedRequest.approvedBy.name}</Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenViewDialog(false)}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Diálogo de aprobación */}
      <Dialog open={openApproveDialog} onClose={() => setOpenApproveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Aprobar Solicitud</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Comentarios (opcional)"
            margin="normal"
            multiline
            rows={3}
            value={approveComment}
            onChange={(e) => setApproveComment(e.target.value)}
            placeholder="Agrega algún comentario sobre la aprobación..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApproveDialog(false)}>Cancelar</Button>
          <Button onClick={handleApproveRequest} variant="contained" color="success">
            Aprobar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de rechazo */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rechazar Solicitud</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Motivo de rechazo *"
            margin="normal"
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Indica el motivo por el cual se rechaza la solicitud..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)}>Cancelar</Button>
          <Button onClick={handleRejectRequest} variant="contained" color="error">
            Rechazar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
