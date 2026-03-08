import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Science as ScienceIcon,
  Biotech as BiotechIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { reagentService } from '../../services/reagentService';
import { equipmentService } from '../../services/equipmentService';
import { Reagent, Equipment } from '../../types';

const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9e9e9e'];
const hazardColors = {
  0: '#4caf50',
  1: '#2196f3',
  2: '#ff9800',
  3: '#f44336',
  4: '#9c27b0'
};

export const Dashboard: React.FC = () => {
  const [reagents, setReagents] = useState<Reagent[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reagentsData, equipmentData] = await Promise.all([
        reagentService.getAll(),
        equipmentService.getAll(),
      ]);
      setReagents(reagentsData.data);
      setEquipment(equipmentData.data);
    } finally {
      setLoading(false);
    }
  };

  // Estadísticas
  const totalReagents = reagents.length;
  const totalEquipment = equipment.length;
  const lowStockReagents = reagents.filter(r => r.quantity < (r.minQuantity || 0)).length;
  const equipmentDueForCalibration = equipment.filter(e => {
    if (!e.nextCalibration) return false;
    const next = new Date(e.nextCalibration);
    const today = new Date();
    const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;

  // Datos para gráficos
  const reagentsByHazard = reagents.reduce((acc, reagent) => {
    const level = reagent.hazardLevel;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const hazardData = Object.entries(reagentsByHazard).map(([level, count]) => ({
    name: `Nivel ${level}`,
    value: count,
  }));

  const equipmentByStatus = equipment.reduce((acc, eq) => {
    const status = eq.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const statusData = Object.entries(equipmentByStatus).map(([status, count]) => ({
    name: `Estado ${status}`,
    value: count,
  }));

  const getTopReagents = () => {
    return [...reagents]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  const getExpiringSoon = () => {
    const today = new Date();
    const thirtyDays = new Date(today.setDate(today.getDate() + 30));

    return reagents.filter(r =>
      r.expiryDate && new Date(r.expiryDate) <= thirtyDays
    ).length;
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard del Laboratorio
      </Typography>

      {/* Tarjetas de resumen */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Reactivos
                  </Typography>
                  <Typography variant="h4">{totalReagents}</Typography>
                </Box>
                <ScienceIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Equipos
                  </Typography>
                  <Typography variant="h4">{totalEquipment}</Typography>
                </Box>
                <BiotechIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: lowStockReagents > 0 ? '#ff9800' : 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color={lowStockReagents > 0 ? 'white' : 'textSecondary'} gutterBottom>
                    Stock Bajo
                  </Typography>
                  <Typography variant="h4" color={lowStockReagents > 0 ? 'white' : 'inherit'}>
                    {lowStockReagents}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 40, color: lowStockReagents > 0 ? 'white' : 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: equipmentDueForCalibration > 0 ? '#f44336' : 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color={equipmentDueForCalibration > 0 ? 'white' : 'textSecondary'} gutterBottom>
                    Calibración Próxima
                  </Typography>
                  <Typography variant="h4" color={equipmentDueForCalibration > 0 ? 'white' : 'inherit'}>
                    {equipmentDueForCalibration}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: equipmentDueForCalibration > 0 ? 'white' : 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3}>
        {/* Gráfico de reactivos por nivel de peligro */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Reactivos por Nivel de Peligro
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={hazardData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {hazardData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico de equipos por estado */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Equipos por Estado
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#2196f3" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Nuevas secciones */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top 5 Reactivos (por cantidad)
            </Typography>
            <List>
              {getTopReagents().map((r, i) => (
                <ListItem key={r.id}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: hazardColors[r.hazardLevel as keyof typeof hazardColors] }}>
                      {i + 1}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={r.name}
                    secondary={`${r.quantity} ${r.unit} - ${r.location}`}
                  />
                  <Chip
                    label={`Nivel ${r.hazardLevel}`}
                    size="small"
                    sx={{ bgcolor: hazardColors[r.hazardLevel as keyof typeof hazardColors], color: 'white' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Alertas y Notificaciones
            </Typography>
            <List>
              {reagents.filter(r => r.quantity < 100).map(r => (
                <ListItem key={r.id}>
                  <ListItemIcon>
                    <WarningIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Stock bajo: ${r.name}`}
                    secondary={`Quedan ${r.quantity} ${r.unit}`}
                  />
                </ListItem>
              ))}
              {getExpiringSoon() > 0 && (
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${getExpiringSoon()} reactivos próximos a vencer`}
                    secondary="En los próximos 30 días"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
