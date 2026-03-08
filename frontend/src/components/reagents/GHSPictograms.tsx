import React from 'react';
import { Box, Tooltip, Paper } from '@mui/material';

interface GHSPictogramProps {
  pictograms: string[];
  size?: number;
}

const pictogramImages: Record<string, { icon: string; label: string }> = {
  GHS01: { icon: '💥', label: 'Explosivo' },
  GHS02: { icon: '🔥', label: 'Inflamable' },
  GHS03: { icon: '⚡', label: 'Comburente' },
  GHS04: { icon: '🧪', label: 'Gas a presión' },
  GHS05: { icon: '⚠️', label: 'Corrosivo' },
  GHS06: { icon: '☠️', label: 'Tóxico agudo' },
  GHS07: { icon: '⚠️', label: 'Irritante' },
  GHS08: { icon: '🏥', label: 'Peligro para la salud' },
  GHS09: { icon: '🌊', label: 'Peligro para el medio ambiente' },
};

export const GHSPictograms: React.FC<GHSPictogramProps> = ({ pictograms, size = 32 }) => {
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {pictograms.map((picto) => {
        const data = pictogramImages[picto] || { icon: '⚠️', label: picto };
        return (
          <Tooltip key={picto} title={data.label}>
            <Paper
              sx={{
                width: size,
                height: size,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'warning.light',
                color: 'white',
                fontSize: size * 0.6,
                cursor: 'help',
                borderRadius: 1,
              }}
            >
              {data.icon}
            </Paper>
          </Tooltip>
        );
      })}
    </Box>
  );
};
