import React from 'react';
import { Box } from '@mui/material';
import { alpha, useTheme as useMuiTheme } from '@mui/material/styles';
import './auth.css';

/**
 * Fondo decorativo de las pantallas de autenticación.
 *
 * SVG inline (sin imágenes externas ni librerías nuevas) con:
 *  - cuadrícula de puntos tipo libreta de laboratorio,
 *  - halos suaves derivados de primary/secondary,
 *  - anillo hexagonal y molécula con animación muy lenta.
 *
 * Todos los colores se derivan de tokens del theme (alpha() sobre
 * primary/secondary), por lo que funciona en modo claro y oscuro.
 */
export const ScienceBackground: React.FC = () => {
  const theme = useMuiTheme();

  // useId asegura ids únicos de <pattern>/<radialGradient> si el fondo
  // se montara más de una vez. Se limpia de caracteres no válidos en id.
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const dotId = `chemlab-dots-${uid}`;
  const primaryGlowId = `chemlab-glow-primary-${uid}`;
  const secondaryGlowId = `chemlab-glow-secondary-${uid}`;

  const isDark = theme.palette.mode === 'dark';
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;

  const gridColor = alpha(isDark ? theme.palette.secondary.light : primary, isDark ? 0.28 : 0.14);
  const strokeColor = alpha(isDark ? theme.palette.secondary.light : theme.palette.primary.main, isDark ? 0.5 : 0.28);
  const nodeFill = alpha(isDark ? theme.palette.secondary.main : theme.palette.primary.main, isDark ? 0.4 : 0.18);

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
        role="presentation"
        style={{ display: 'block' }}
      >
        <defs>
          <pattern id={dotId} width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill={gridColor} />
          </pattern>

          <radialGradient id={primaryGlowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={primary} stopOpacity={isDark ? 0.4 : 0.22} />
            <stop offset="100%" stopColor={primary} stopOpacity="0" />
          </radialGradient>

          <radialGradient id={secondaryGlowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={secondary} stopOpacity={isDark ? 0.4 : 0.2} />
            <stop offset="100%" stopColor={secondary} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Cuadrícula de puntos */}
        <rect width="1200" height="800" fill={`url(#${dotId})`} />

        {/* Halos de color (degradados suaves desde tokens del theme) */}
        <circle cx="170" cy="120" r="340" fill={`url(#${primaryGlowId})`} />
        <circle cx="1050" cy="720" r="380" fill={`url(#${secondaryGlowId})`} />
        <circle cx="1010" cy="80" r="230" fill={`url(#${secondaryGlowId})`} opacity="0.7" />

        {/* Anillo hexagonal girando muy lentamente */}
        <g
          className="auth-bg-spin"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
        >
          <polygon points="980,700 908,658 908,574 980,532 1052,574 1052,658" />
          <polygon points="980,678 926,647 926,585 980,554 1034,585 1034,647" />
          <circle cx="980" cy="700" r="4.5" fill={nodeFill} />
          <circle cx="908" cy="658" r="4.5" fill={nodeFill} />
          <circle cx="1052" cy="574" r="4.5" fill={nodeFill} />
        </g>

        {/* Molécula flotante */}
        <g className="auth-bg-float" stroke={strokeColor} strokeWidth="2" fill="none">
          <line x1="150" y1="640" x2="150" y2="556" />
          <line x1="150" y1="640" x2="222" y2="682" />
          <line x1="150" y1="556" x2="78" y2="598" />
          <circle cx="150" cy="640" r="13" fill={nodeFill} stroke={strokeColor} />
          <circle cx="150" cy="556" r="8" fill={nodeFill} stroke={strokeColor} />
          <circle cx="222" cy="682" r="8" fill={nodeFill} stroke={strokeColor} />
          <circle cx="78" cy="598" r="8" fill={nodeFill} stroke={strokeColor} />
        </g>
      </svg>
    </Box>
  );
};

export default ScienceBackground;
