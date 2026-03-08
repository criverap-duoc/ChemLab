import { createTheme, ThemeOptions } from '@mui/material/styles';
import { useMemo, useState, createContext, useContext } from 'react';

// Colores personalizados para el laboratorio
const labColors = {
  primary: {
    main: '#2e7d32', // Verde químico
    light: '#4caf50',
    dark: '#1b5e20',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#0288d1', // Azul científico
    light: '#03a9f4',
    dark: '#01579b',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ed6c02', // Naranja precaución
    light: '#ff9800',
    dark: '#e65100',
  },
  error: {
    main: '#d32f2f', // Rojo peligro
    light: '#ef5350',
    dark: '#c62828',
  },
  hazard: {
    none: '#4caf50',
    low: '#2196f3',
    moderate: '#ff9800',
    high: '#f44336',
    extreme: '#9c27b0',
  },
};

// Función para crear tema claro/oscuro
export const getTheme = (mode: 'light' | 'dark') => {
  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: labColors.primary,
      secondary: labColors.secondary,
      ...(mode === 'light'
        ? {
            // Tema claro
            background: {
              default: '#f5f5f5',
              paper: '#ffffff',
            },
            text: {
              primary: '#1e293b',
              secondary: '#475569',
            },
          }
        : {
            // Tema oscuro
            background: {
              default: '#0a1929',
              paper: '#1e293b',
            },
            text: {
              primary: '#e2e8f0',
              secondary: '#94a3b8',
            },
          }),
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 500,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 500,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'light'
              ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
              : '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: mode === 'light'
                ? '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                : '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            padding: '8px 16px',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};

// Hook personalizado para el tema

type ThemeContextType = {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);
