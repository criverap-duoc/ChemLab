// src\components\reagents\QRCodeDialog.tsx
// F10.3: generación y descarga del QR de un reactivo. El código codificado es el
// Id (Guid) del reactivo, que es lo que resuelve GET /api/reagents/by-qr/{code}.
import React, { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';

export interface QRCodeReagent {
  id: string;
  name: string;
  chemicalFormula: string;
}

interface QRCodeDialogProps {
  open: boolean;
  onClose: () => void;
  reagent: QRCodeReagent | null;
}

const QR_SIZE = 256;
// El PNG se genera a 1024px para que se pueda imprimir sin perder definición.
const PNG_SIZE = 1024;

export const QRCodeDialog: React.FC<QRCodeDialogProps> = ({ open, onClose, reagent }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleDownload = () => {
    const svg = svgRef.current;
    if (!svg || !reagent) return;

    const serialized = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = PNG_SIZE;
      canvas.height = PNG_SIZE;

      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(svgUrl);
        return;
      }

      // Fondo blanco obligatorio: el QR debe ser legible también en modo oscuro.
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, PNG_SIZE, PNG_SIZE);
      context.drawImage(image, 0, 0, PNG_SIZE, PNG_SIZE);
      URL.revokeObjectURL(svgUrl);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `qr-${reagent.name.replace(/[^\w.-]+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    image.onerror = () => URL.revokeObjectURL(svgUrl);
    image.src = svgUrl;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>QR del reactivo</DialogTitle>
      <DialogContent dividers>
        {reagent ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              py: 1,
            }}
          >
            <Box
              sx={{
                bgcolor: '#fff',
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                maxWidth: '100%',
                lineHeight: 0,
              }}
            >
              <QRCodeSVG
                ref={svgRef}
                value={reagent.id}
                size={QR_SIZE}
                level="M"
                marginSize={2}
                title={`QR de ${reagent.name}`}
                style={{ width: '100%', height: 'auto', maxWidth: QR_SIZE }}
              />
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                {reagent.name}
              </Typography>
              {reagent.chemicalFormula && (
                <Typography variant="body2" color="textSecondary">
                  {reagent.chemicalFormula}
                </Typography>
              )}
              <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                ID: {reagent.id}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="textSecondary">
            Selecciona un reactivo para generar su código QR.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" startIcon={<CloseIcon />}>
          Cerrar
        </Button>
        <Button
          onClick={handleDownload}
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={!reagent}
        >
          Descargar QR
        </Button>
      </DialogActions>
    </Dialog>
  );
};
