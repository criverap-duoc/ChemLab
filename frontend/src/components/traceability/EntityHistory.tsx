import React, { useEffect, useState } from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Drawer,
} from '@mui/material';
import {
  History as HistoryIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as TransferIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { traceabilityService, AuditLog } from '../../services/traceabilityService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EntityHistoryProps {
  entityType: 'reagent' | 'equipment';
  entityId: string;
  entityName: string;
  open: boolean;
  onClose: () => void;
}

export const EntityHistory: React.FC<EntityHistoryProps> = ({
  entityType,
  entityId,
  entityName,
  open,
  onClose
}) => {
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && entityId) {
      loadHistory();
    }
  }, [open, entityId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await traceabilityService.getEntityHistory(entityType, entityId);
      setHistory(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'CREATE': return <AddIcon color="success" />;
      case 'UPDATE': return <EditIcon color="info" />;
      case 'DELETE': return <DeleteIcon color="error" />;
      case 'TRANSFER': return <TransferIcon color="warning" />;
      default: return <HistoryIcon />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'CREATE': return 'success' as const;
      case 'UPDATE': return 'info' as const;
      case 'DELETE': return 'error' as const;
      case 'TRANSFER': return 'warning' as const;
      default: return 'primary' as const;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'CREATE': return 'Creación';
      case 'UPDATE': return 'Actualización';
      case 'DELETE': return 'Eliminación';
      case 'TRANSFER': return 'Transferencia';
      default: return action || 'Desconocido';
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 500 } } }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon color="primary" />
            <Typography variant="h6">
              Historial de {entityName}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : history.length === 0 ? (
          <Alert severity="info">No hay historial disponible para este elemento</Alert>
        ) : (
          <Timeline position="right">
            {history.map((log, index) => (
              <TimelineItem key={index}>
                <TimelineOppositeContent sx={{ flex: 0.3 }}>
                  <Typography variant="caption" color="textSecondary">
                    {format(new Date(log.timestamp), 'dd/MM/yyyy', { locale: es })}
                  </Typography>
                  <Typography variant="caption" display="block" color="textSecondary">
                    {format(new Date(log.timestamp), 'HH:mm', { locale: es })}
                  </Typography>
                </TimelineOppositeContent>

                <TimelineSeparator>
                  <TimelineDot color={getActionColor(log.action)}>
                    {getActionIcon(log.action)}
                  </TimelineDot>
                  {index < history.length - 1 && <TimelineConnector />}
                </TimelineSeparator>

                <TimelineContent sx={{ flex: 1 }}>
                  <Box sx={{ mb: 1 }}>
                    <Chip
                      label={getActionLabel(log.action)}
                      size="small"
                      color={getActionColor(log.action)}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="textSecondary">
                      por <strong>{log.userName}</strong>
                    </Typography>
                  </Box>

                  {log.newValue && (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1,
                        bgcolor: 'background.default',
                        maxHeight: 200,
                        overflow: 'auto'
                      }}
                    >
                      <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                        {JSON.stringify(JSON.parse(log.newValue), null, 2)}
                      </pre>
                    </Paper>
                  )}

                  {log.ipAddress && (
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      IP: {log.ipAddress}
                    </Typography>
                  )}
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </Box>
    </Drawer>
  );
};
