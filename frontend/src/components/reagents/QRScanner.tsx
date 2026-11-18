// src\components\reagents\QRScanner.tsx
// F10.3: escaneo de QR con la cámara del dispositivo (html5-qrcode).
// El diálogo solo monta el contenedor cuando está abierto; el scanner se crea en
// el useEffect y se destruye en el cleanup para no dejar la cámara encendida.
import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

const SCANNER_ELEMENT_ID = 'chemlab-qr-scanner';

export const QRScanner: React.FC<QRScannerProps> = ({ open, onClose, onScan }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  // Mantiene el callback actualizado sin reiniciar el scanner en cada render.
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!open) return;

    setError(null);
    let disposed = false;

    const scanner = new Html5QrcodeScanner(
      SCANNER_ELEMENT_ID,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
      },
      false
    );
    scannerRef.current = scanner;

    try {
      scanner.render(
        (decodedText) => {
          if (disposed) return;
          disposed = true;

          try {
            scanner.clear().catch(() => undefined);
          } catch {
            // El contenedor ya puede estar desmontado: no es un error real.
          }

          scannerRef.current = null;
          onScanRef.current(decodedText);
        },
        () => {
          // Cada frame sin QR dispara un error: se ignora a propósito.
        }
      );
    } catch {
      setError('No se pudo iniciar la cámara. Revisa los permisos del navegador.');
    }

    return () => {
      disposed = true;
      const current = scannerRef.current;
      scannerRef.current = null;

      if (!current) return;

      try {
        current.clear().catch(() => undefined);
      } catch {
        // El diálogo se cerró y el contenedor ya no existe.
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Escanear QR de reactivo</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Apunta la cámara al código QR del reactivo.
        </Typography>
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box
          id={SCANNER_ELEMENT_ID}
          sx={{
            width: '100%',
            '& video': { maxWidth: '100%', borderRadius: 2 },
            '& img': { maxWidth: '100%' },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" startIcon={<CloseIcon />}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
