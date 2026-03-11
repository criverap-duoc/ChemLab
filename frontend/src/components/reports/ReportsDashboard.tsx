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
  Paper,
  Chip,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Assessment as ReportIcon,
  Science as ScienceIcon,
  Biotech as BiotechIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { reportService } from '../../services/reportService';
import { reagentService } from '../../services/reagentService';
import { equipmentService } from '../../services/equipmentService';
import { experimentService } from '../../services/experimentService';

export const ReportsDashboard: React.FC = () => {
  const [reagents, setReagents] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reagentsData, equipmentData, experimentsData] = await Promise.all([
        reagentService.getAll(),
        equipmentService.getAll(),
        experimentService.getAll(1, 100)
      ]);
      setReagents(reagentsData.data);
      setEquipment(equipmentData.data);
      setExperiments(experimentsData.data);
    } catch (err) {
      setError('Error al cargar datos para reportes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReagentsExcel = () => {
    const data = reagents.map(r => ({
      Nombre: r.name,
      'Fórmula Química': r.chemicalFormula,
      'Número CAS': r.casNumber || 'N/A',
      Cantidad: r.quantity,
      Unidad: r.unit,
      Ubicación: r.location,
      'Nivel de Peligro': r.hazardLevel,
      Proveedor: r.supplier || 'N/A',
      'Fecha Vencimiento': r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : 'N/A',
      'Creado por': r.createdBy,
      'Fecha Creación': new Date(r.createdAt).toLocaleDateString()
    }));
    reportService.exportToExcel(data, 'reactivos_chemlab', 'Reactivos');
  };

  const handleExportEquipmentExcel = () => {
    const data = equipment.map(e => ({
      Nombre: e.name,
      Modelo: e.model,
      'Número de Serie': e.serialNumber || 'N/A',
      Ubicación: e.location,
      Estado: e.status === 0 ? 'Disponible' :
              e.status === 1 ? 'En uso' :
              e.status === 2 ? 'Mantenimiento' :
              e.status === 3 ? 'Calibración pendiente' : 'Fuera de servicio',
      'Última Calibración': e.lastCalibration ? new Date(e.lastCalibration).toLocaleDateString() : 'N/A',
      'Próxima Calibración': e.nextCalibration ? new Date(e.nextCalibration).toLocaleDateString() : 'N/A',
      'Creado por': e.createdBy
    }));
    reportService.exportToExcel(data, 'equipos_chemlab', 'Equipos');
  };

  const handleExportReagentsPDF = () => {
    reportService.exportReagentsToPDF(reagents, 'reactivos_chemlab');
  };

  const handleExportEquipmentPDF = () => {
    reportService.exportEquipmentToPDF(equipment, 'equipos_chemlab');
  };

  const handleExportSummaryPDF = () => {
    reportService.exportSummaryToPDF(reagents, equipment, experiments);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Reportes y Exportación
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Genera reportes detallados de tu inventario y experimentos
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Tarjetas de resumen */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Resumen del Laboratorio
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <ScienceIcon color="primary" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h5">{reagents.length}</Typography>
                        <Typography variant="body2" color="textSecondary">Reactivos</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <BiotechIcon color="secondary" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h5">{equipment.length}</Typography>
                        <Typography variant="body2" color="textSecondary">Equipos</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <TimelineIcon color="success" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h5">{experiments.length}</Typography>
                        <Typography variant="body2" color="textSecondary">Experimentos</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Reportes de Reactivos */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <ScienceIcon color="primary" />
                <Typography variant="h6">Reportes de Reactivos</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Exportar a Excel</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<ExcelIcon />}
                    onClick={handleExportReagentsExcel}
                    size="small"
                  >
                    Exportar
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Exportar a PDF</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PdfIcon />}
                    onClick={handleExportReagentsPDF}
                    size="small"
                    color="error"
                  >
                    Exportar
                  </Button>
                </Box>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Chip
                  label={`${reagents.length} reactivos disponibles`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Reportes de Equipos */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <BiotechIcon color="secondary" />
                <Typography variant="h6">Reportes de Equipos</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Exportar a Excel</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<ExcelIcon />}
                    onClick={handleExportEquipmentExcel}
                    size="small"
                  >
                    Exportar
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Exportar a PDF</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PdfIcon />}
                    onClick={handleExportEquipmentPDF}
                    size="small"
                    color="error"
                  >
                    Exportar
                  </Button>
                </Box>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Chip
                  label={`${equipment.length} equipos registrados`}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Reporte Ejecutivo */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <ReportIcon color="success" />
                <Typography variant="h6">Reporte Ejecutivo</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="body2" color="textSecondary" paragraph>
                Genera un reporte completo con resumen de inventario, experimentos recientes y estadísticas generales del laboratorio.
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<PdfIcon />}
                  onClick={handleExportSummaryPDF}
                  color="success"
                >
                  Generar Reporte Ejecutivo
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
