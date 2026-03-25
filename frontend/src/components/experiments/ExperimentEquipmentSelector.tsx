import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Typography,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Biotech as BiotechIcon,
} from '@mui/icons-material';
import { equipmentService } from '../../services/equipmentService';
import { Equipment } from '../../types';

interface SelectedEquipment {
  equipmentId: string;
  equipmentName: string;
  usageHours?: number;
  calibrationBefore?: string;
  calibrationAfter?: string;
}

interface EquipmentOption extends Equipment {
  displayLabel: string;
}

interface ExperimentEquipmentSelectorProps {
  value: SelectedEquipment[];
  onChange: (equipment: SelectedEquipment[]) => void;
}

export const ExperimentEquipmentSelector: React.FC<ExperimentEquipmentSelectorProps> = ({
  value,
  onChange
}) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentOption | null>(null);
  const [usageHours, setUsageHours] = useState<number>(0);
  const [calibrationBefore, setCalibrationBefore] = useState<string>('');
  const [calibrationAfter, setCalibrationAfter] = useState<string>('');

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const data = await equipmentService.getAll();
      setEquipment(data.data);
    } catch (error) {
      console.error('Error loading equipment:', error);
    }
  };

  const handleAddEquipment = () => {
    if (!selectedEquipment) return;

    const newEquipment: SelectedEquipment = {
      equipmentId: selectedEquipment.id,
      equipmentName: selectedEquipment.name,
      usageHours: usageHours || undefined,
      calibrationBefore: calibrationBefore || undefined,
      calibrationAfter: calibrationAfter || undefined
    };

    onChange([...value, newEquipment]);
    setSelectedEquipment(null);
    setUsageHours(0);
    setCalibrationBefore('');
    setCalibrationAfter('');
  };

  const handleRemoveEquipment = (index: number) => {
    const newEquipment = [...value];
    newEquipment.splice(index, 1);
    onChange(newEquipment);
  };

  // Opciones para el Autocomplete
  const equipmentOptions: EquipmentOption[] = equipment
    .filter(e => !value.some(v => v.equipmentId === e.id))
    .map(e => ({
      ...e,
      displayLabel: `${e.name} (${e.model}) - ${e.location}`
    }));

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Equipos utilizados
      </Typography>

      {/* Lista de equipos seleccionados */}
      {value.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          {value.map((equipmentItem, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box>
                <Typography variant="body2">
                  <strong>{equipmentItem.equipmentName}</strong>
                </Typography>
                {equipmentItem.usageHours && (
                  <Typography variant="caption" color="textSecondary">
                    Horas de uso: {equipmentItem.usageHours}
                  </Typography>
                )}
                {equipmentItem.calibrationBefore && (
                  <Typography variant="caption" color="textSecondary" display="block">
                    Calibración antes: {new Date(equipmentItem.calibrationBefore).toLocaleDateString()}
                  </Typography>
                )}
                {equipmentItem.calibrationAfter && (
                  <Typography variant="caption" color="textSecondary" display="block">
                    Calibración después: {new Date(equipmentItem.calibrationAfter).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
              <IconButton
                size="small"
                onClick={() => handleRemoveEquipment(index)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Paper>
      )}

      {/* Selector de equipos */}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={5}>
          <Autocomplete
            options={equipmentOptions}
            getOptionLabel={(option) => option.displayLabel}
            value={selectedEquipment}
            onChange={(_, newValue) => setSelectedEquipment(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar equipo"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <BiotechIcon />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            type="number"
            label="Horas de uso (opcional)"
            size="small"
            value={usageHours}
            onChange={(e) => setUsageHours(Number(e.target.value))}
            disabled={!selectedEquipment}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddEquipment}
            disabled={!selectedEquipment}
            size="small"
          >
            Agregar
          </Button>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            type="date"
            label="Calibración antes (opcional)"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={calibrationBefore}
            onChange={(e) => setCalibrationBefore(e.target.value)}
            disabled={!selectedEquipment}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            type="date"
            label="Calibración después (opcional)"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={calibrationAfter}
            onChange={(e) => setCalibrationAfter(e.target.value)}
            disabled={!selectedEquipment}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
