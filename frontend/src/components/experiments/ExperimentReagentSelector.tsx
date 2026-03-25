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
  Science as ScienceIcon,
} from '@mui/icons-material';
import { reagentService } from '../../services/reagentService';
import { Reagent } from '../../types';

interface SelectedReagent {
  reagentId: string;
  reagentName: string;
  quantityUsed: number;
  unit: string;
  batchNumber?: string;
}

interface ReagentOption extends Reagent {
  displayLabel: string;
}

interface ExperimentReagentSelectorProps {
  value: SelectedReagent[];
  onChange: (reagents: SelectedReagent[]) => void;
}

export const ExperimentReagentSelector: React.FC<ExperimentReagentSelectorProps> = ({
  value,
  onChange
}) => {
  const [reagents, setReagents] = useState<Reagent[]>([]);
  const [selectedReagent, setSelectedReagent] = useState<ReagentOption | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('ml');
  const [batchNumber, setBatchNumber] = useState<string>('');

  useEffect(() => {
    loadReagents();
  }, []);

  const loadReagents = async () => {
    try {
      const data = await reagentService.getAll();
      setReagents(data.data);
    } catch (error) {
      console.error('Error loading reagents:', error);
    }
  };

  const handleAddReagent = () => {
    if (!selectedReagent) return;

    const newReagent: SelectedReagent = {
      reagentId: selectedReagent.id,
      reagentName: selectedReagent.name,
      quantityUsed: quantity,
      unit: unit,
      batchNumber: batchNumber || undefined
    };

    onChange([...value, newReagent]);
    setSelectedReagent(null);
    setQuantity(1);
    setUnit('ml');
    setBatchNumber('');
  };

  const handleRemoveReagent = (index: number) => {
    const newReagents = [...value];
    newReagents.splice(index, 1);
    onChange(newReagents);
  };

  // Opciones para el Autocomplete
  const reagentOptions: ReagentOption[] = reagents
    .filter(r => !value.some(v => v.reagentId === r.id))
    .map(r => ({
      ...r,
      displayLabel: `${r.name} (${r.quantity} ${r.unit} disponible)`
    }));

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Reactivos utilizados
      </Typography>

      {/* Lista de reactivos seleccionados */}
      {value.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          {value.map((reagent, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box>
                <Typography variant="body2">
                  <strong>{reagent.reagentName}</strong>
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Cantidad: {reagent.quantityUsed} {reagent.unit}
                  {reagent.batchNumber && ` | Lote: ${reagent.batchNumber}`}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => handleRemoveReagent(index)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Paper>
      )}

      {/* Selector de reactivos */}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={5}>
          <Autocomplete
            options={reagentOptions}
            getOptionLabel={(option) => option.displayLabel}
            value={selectedReagent}
            onChange={(_, newValue) => setSelectedReagent(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar reactivo"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <ScienceIcon />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            type="number"
            label="Cantidad"
            size="small"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            disabled={!selectedReagent}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            fullWidth
            select
            label="Unidad"
            size="small"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            disabled={!selectedReagent}
          >
            <MenuItem value="ml">ml</MenuItem>
            <MenuItem value="l">l</MenuItem>
            <MenuItem value="g">g</MenuItem>
            <MenuItem value="kg">kg</MenuItem>
            <MenuItem value="mg">mg</MenuItem>
            <MenuItem value="mol">mol</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddReagent}
            disabled={!selectedReagent}
            size="small"
          >
            Agregar
          </Button>
        </Grid>
      </Grid>

      <TextField
        fullWidth
        label="Número de lote (opcional)"
        size="small"
        value={batchNumber}
        onChange={(e) => setBatchNumber(e.target.value)}
        disabled={!selectedReagent}
        sx={{ mt: 1 }}
      />
    </Box>
  );
};
