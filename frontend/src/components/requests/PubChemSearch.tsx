import React, { useCallback, useState, useEffect, useRef } from 'react';
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
  helperText?: string;
}

export const PubChemSearch: React.FC<PubChemSearchProps> = ({
  onSelect,
  initialQuery = '',
  label = 'Buscar en PubChem',
  placeholder = 'Ej: aspirina, etanol, ácido sulfúrico...',
  helperText = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  // F7c: última consulta realmente buscada. Evita mostrar "sin resultados"
  // mientras el debounce sigue pendiente (el usuario aún escribe).
  const [lastSearched, setLastSearched] = useState('');
  // F7c: marca si ya hay una selección válida. Sirve para descartar respuestas
  // que llegan tarde y reabrirían el dropdown después de elegir un compuesto.
  const selectedRef = useRef<any>(null);

  const handleSearch = useCallback(async (term: string) => {
    if (term.length < 3) return;

    setSearching(true);
    try {
      const searchResults = await pubchemService.searchForRequestItem(term);
      if (selectedRef.current) return; // el usuario ya eligió: no reabrir la lista
      setResults(searchResults);
    } catch (error) {
      console.error('Error searching PubChem:', error);
    } finally {
      setSearching(false);
      setLastSearched(term);
    }
  }, []);

  useEffect(() => {
    // F7c: al seleccionar un resultado el query pasa a ser su label. Sin este
    // guard, el debounce volvía a buscar y reabría el dropdown (bug de F7).
    if (selected && query === selected.label) {
      setResults([]);
      return;
    }

    if (query.length < 3) {
      setResults([]);
      return;
    }

    const term = query;
    const delayDebounce = setTimeout(() => {
      handleSearch(term);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query, selected, handleSearch]);

  const handleSelect = (result: any) => {
    if (result?.disabled) return; // el mensaje de "no encontrado" no es seleccionable

    selectedRef.current = result;
    setSelected(result);
    setResults([]);
    setLastSearched(result.label);
    setQuery(result.label);
    onSelect(result);
  };

  const handleChange = (value: string) => {
    setQuery(value);
    // Si el usuario edita el texto, la selección anterior deja de ser válida
    // y se reanuda la búsqueda.
    if (selected) setSelected(null);
    selectedRef.current = null;
  };

  const showNotFound =
    !searching &&
    !selected &&
    results.length === 0 &&
    query.length > 3 &&
    lastSearched === query;

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <TextField
        fullWidth
        label={label}
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        error={showNotFound}
        helperText={showNotFound
          ? 'No se encontraron resultados. Prueba con otro término.'
          : helperText}

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
