import React, { useState, useEffect } from 'react';
import {
  TextField,
  Paper,
  MenuItem,
  Box,
  CircularProgress,
  InputAdornment,
  Typography,
  Chip,
} from '@mui/material';
import { Search as SearchIcon, Science as ScienceIcon } from '@mui/icons-material';
import { pubchemService } from '../../services/pubchemService';

interface PubChemSearchProps {
  onSelect: (result: any) => void;
  initialQuery?: string;
  label?: string;
  placeholder?: string;
}

export const PubChemSearch: React.FC<PubChemSearchProps> = ({
  onSelect,
  initialQuery = '',
  label = 'Buscar en PubChem',
  placeholder = 'Ej: aspirina, etanol, ácido sulfúrico...'
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSearch = async () => {
    if (query.length < 3) return;

    setSearching(true);
    try {
      const searchResults = await pubchemService.searchForRequestItem(query);
      setResults(searchResults);
    } catch (error) {
      console.error('Error searching PubChem:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (result: any) => {
    setSelected(result);
    setResults([]);
    setQuery(result.label);
    onSelect(result);
  };

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <TextField
        fullWidth
        label={label}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        error={results.length === 0 && query.length > 3 && !searching && !selected}
        helperText={results.length === 0 && query.length > 3 && !searching && !selected ?
          'No se encontraron resultados. Prueba con otro término.' : ''}
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

      {results.length > 0 && (
        <Paper sx={{
          mt: 1,
          maxHeight: 300,
          overflow: 'auto',
          position: 'absolute',
          zIndex: 1000,
          width: '100%'
        }}>
          {results.map((result, index) => (
            <MenuItem
              key={index}
              onClick={() => handleSelect(result)}
              disabled={result.disabled}  // Solo deshabilitar si viene marcado como disabled
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                borderBottom: index < results.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                py: 1.5,
                opacity: result.disabled ? 0.5 : 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <ScienceIcon fontSize="small" color="primary" />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {result.label}
                </Typography>
              </Box>
              {!result.disabled && result.formula && (
                <Box sx={{ display: 'flex', gap: 1, ml: 4, mt: 0.5 }}>
                  <Chip
                    label={`Fórmula: ${result.formula}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                  <Typography variant="caption" color="primary">
                    CID: {result.cid}
                  </Typography>
                </Box>
              )}
            </MenuItem>
          ))}
        </Paper>
      )}

      {selected && (
        <Paper sx={{ mt: 1, p: 1, bgcolor: 'success.light', color: 'white' }}>
          <Typography variant="caption">
            ✓ Seleccionado: {selected.label}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};
