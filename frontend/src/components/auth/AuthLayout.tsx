import React from 'react';
import { Box, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { useTheme as useAppTheme } from '../../theme';
import { BrandPanel } from './BrandPanel';
import { ScienceBackground } from './ScienceBackground';
import './auth.css';

interface AuthLayoutProps {
  /** Título principal de la tarjeta (se renderiza como h1 para accesibilidad). */
  title: string;
  /** Subtítulo descriptivo debajo del título. */
  subtitle: string;
  /** Formulario y contenido de la pantalla. */
  children: React.ReactNode;
  /** Ancho máximo de la tarjeta del formulario, en px. */
  maxWidth?: number;
}

/**
 * Layout compartido por Iniciar Sesión y Crear Cuenta.
 *
 * - md+: panel de marca a la izquierda (45%) y formulario centrado a la derecha.
 * - xs-sm: panel de marca compacto arriba y formulario debajo, en una columna.
 * - Toggle de tema en la esquina superior derecha (reutiliza el ThemeContext).
 *
 * Es puramente presentacional: no conoce estados ni llamadas de autenticación.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children,
  maxWidth = 480,
}) => {
  const { mode, toggleTheme } = useAppTheme();
  const nextModeLabel = mode === 'light' ? 'oscuro' : 'claro';

  return (
    <Box
      component="main"
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        minHeight: '100vh',
        '@supports (min-height: 100dvh)': { minHeight: '100dvh' },
        bgcolor: 'background.default',
        overflow: 'hidden',
        transition: 'background-color 300ms ease',
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
      }}
    >
      <ScienceBackground />

      {/* Toggle claro/oscuro: usa el ThemeContext existente */}
      <Tooltip title={`Cambiar a modo ${nextModeLabel}`}>
        <IconButton
          onClick={toggleTheme}
          aria-label={`Cambiar a modo ${nextModeLabel}`}
          sx={{
            position: 'absolute',
            top: { xs: 10, sm: 14, md: 20 },
            right: { xs: 10, sm: 14, md: 20 },
            zIndex: 3,
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 2,
            transition: 'background-color 200ms ease, color 200ms ease, box-shadow 200ms ease',
            '&:hover': {
              bgcolor: 'action.hover',
              boxShadow: 3,
            },
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 2,
            },
          }}
        >
          {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
      </Tooltip>

      {/* Columna izquierda: marca */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: { xs: '100%', md: '45%' },
          flexShrink: 0,
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        <BrandPanel />
      </Box>

      {/* Columna derecha: formulario */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, sm: 4, md: 6 },
        }}
      >
        <Paper
          elevation={0}
          component="section"
          className="auth-enter"
          aria-labelledby="auth-card-title"
          sx={(theme) => ({
            width: '100%',
            maxWidth,
            p: { xs: 2.5, sm: 3.5, md: 4 },
            borderRadius: '16px',
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: '1px solid',
            borderColor: alpha(
              theme.palette.primary.main,
              theme.palette.mode === 'light' ? 0.14 : 0.3
            ),
            boxShadow: `0 24px 48px -28px ${alpha(
              theme.palette.common.black,
              theme.palette.mode === 'light' ? 0.3 : 0.75
            )}`,
            transition: 'background-color 300ms ease, color 300ms ease, border-color 300ms ease',
            '@media (prefers-reduced-motion: reduce)': {
              transition: 'none',
            },
          })}
        >
          <Typography
            id="auth-card-title"
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.01em',
              fontSize: { xs: '1.4rem', sm: '1.5rem' },
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.75, mb: 3 }}
          >
            {subtitle}
          </Typography>

          {children}
        </Paper>
      </Box>
    </Box>
  );
};

export default AuthLayout;
