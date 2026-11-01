import React from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Science as ScienceIcon,
  Build as BuildIcon,
  Biotech as BiotechIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

interface Benefit {
  icon: React.ReactElement;
  text: string;
}

const benefits: Benefit[] = [
  { icon: <ScienceIcon fontSize="small" />, text: 'Control de stock de reactivos' },
  { icon: <BuildIcon fontSize="small" />, text: 'Equipos y calibración' },
  { icon: <BiotechIcon fontSize="small" />, text: 'Experimentos y protocolos' },
  { icon: <AssignmentIcon fontSize="small" />, text: 'Solicitudes de insumos' },
  { icon: <AssessmentIcon fontSize="small" />, text: 'Reportes y trazabilidad' },
];

/**
 * Panel de marca compartido por Login y Registro.
 *
 * - md+: columna lateral a pantalla completa con logo, eslogan y beneficios.
 * - xs-sm: banda compacta (logo + eslogan) sobre el formulario, con altura
 *   acotada y sin desbordes horizontales.
 *
 * El degradado se construye solo con tokens del theme (primary/secondary),
 * así que mantiene contraste AA en modo claro y oscuro.
 */
export const BrandPanel: React.FC = () => {
  return (
    <Box
      component="section"
      aria-label="ChemLab, gestión integral de tu laboratorio"
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 'auto', md: '100%' },
        display: 'flex',
        flexDirection: { xs: 'row', md: 'column' },
        alignItems: { xs: 'center', md: 'flex-start' },
        justifyContent: { xs: 'center', md: 'center' },
        gap: { xs: 2, md: 5 },
        px: { xs: 2.5, sm: 4, md: 6 },
        py: { xs: 2.5, sm: 3.5, md: 6 },
        color: 'primary.contrastText',
        overflow: 'hidden',
        background: (theme) =>
          `linear-gradient(150deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 45%, ${theme.palette.secondary.dark} 100%)`,
        /* Círculo decorativo derivado del contrastText (sin colores nuevos) */
        '&::after': {
          content: '""',
          position: 'absolute',
          width: { xs: 180, md: 420 },
          height: { xs: 180, md: 420 },
          borderRadius: '50%',
          right: { xs: -60, md: -140 },
          bottom: { xs: -80, md: -160 },
          border: '1px solid',
          borderColor: (theme) => alpha(theme.palette.primary.contrastText, 0.18),
          backgroundColor: (theme) => alpha(theme.palette.primary.contrastText, 0.06),
          pointerEvents: 'none',
        },
      }}
    >
      {/* Logo + eslogan */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.5, md: 2 },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            width: { xs: 42, md: 60 },
            height: { xs: 42, md: 60 },
            borderRadius: { xs: '12px', md: '16px' },
            border: '1px solid',
            borderColor: (theme) => alpha(theme.palette.primary.contrastText, 0.3),
            backgroundColor: (theme) => alpha(theme.palette.primary.contrastText, 0.14),
          }}
        >
          <ScienceIcon sx={{ fontSize: { xs: 24, md: 32 } }} />
        </Box>

        <Box>
          <Typography
            variant="h4"
            component="p"
            sx={{
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              fontSize: { xs: '1.35rem', md: '2rem' },
            }}
          >
            ChemLab
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              fontSize: { xs: '0.8rem', md: '0.95rem' },
              color: (theme) => alpha(theme.palette.primary.contrastText, 0.9),
            }}
          >
            Gestión integral de tu laboratorio
          </Typography>
        </Box>
      </Box>

      {/* Beneficios (solo escritorio para mantener compacto el panel en móvil) */}
      <Box
        component="ul"
        sx={{
          position: 'relative',
          zIndex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          gap: 2,
          width: '100%',
          maxWidth: 340,
          m: 0,
          p: 0,
          listStyle: 'none',
        }}
      >
        {benefits.map((benefit) => (
          <Box
            component="li"
            key={benefit.text}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
          >
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                width: 34,
                height: 34,
                borderRadius: '10px',
                border: '1px solid',
                borderColor: (theme) => alpha(theme.palette.primary.contrastText, 0.26),
                backgroundColor: (theme) => alpha(theme.palette.primary.contrastText, 0.12),
              }}
            >
              {benefit.icon}
            </Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                fontSize: '0.925rem',
                color: (theme) => alpha(theme.palette.primary.contrastText, 0.95),
              }}
            >
              {benefit.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default BrandPanel;
