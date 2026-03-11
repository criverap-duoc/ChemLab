import React, { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Build as BuildIcon,
  Science as ScienceIcon,
  Assignment as RequestIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { notificationService, Notification } from '../../services/notificationService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar notificaciones guardadas
    const loadInitialNotifications = () => {
      const savedNotifications = notificationService.getNotifications();
      const unread = notificationService.getUnreadCount();

      console.log('📥 Cargando notificaciones iniciales:', {
        total: savedNotifications.length,
        unread: unread
      });

      setNotifications(savedNotifications);
      setUnreadCount(unread);
    };

    loadInitialNotifications();

    // Solicitar permiso para notificaciones del navegador
    notificationService.requestNotificationPermission();

    // Conectar a SignalR
    const connect = async () => {
      await notificationService.startConnection();
      setConnected(true);

      // 🔥 RECARGAR DESPUÉS DE CONECTAR (por si hay nuevas)
      loadInitialNotifications();
    };
    connect();

    // Suscribirse a nuevas notificaciones
    const unsubscribe = notificationService.subscribe((notification) => {
      console.log('Nueva notificación recibida:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      unsubscribe();
      notificationService.stopConnection();
    };
  }, []);

  useEffect(() => {
    console.log('📊 Notificaciones actuales:', notifications);
    console.log('📊 No leídas:', unreadCount);
  }, [notifications, unreadCount]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    await notificationService.markAsRead(notification.id);
    setUnreadCount(prev => Math.max(0, prev - 1));
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );

    // Navegar según el tipo de notificación
    if (notification.data) {
      if (notification.type.includes('request')) {
        navigate('/requests');
      } else if (notification.type.includes('stock')) {
        navigate('/reagents');
      } else if (notification.type.includes('calibration')) {
        navigate('/equipment');
      } else if (notification.type.includes('experiment')) {
        navigate('/experiments');
      }
    }

    handleClose();
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleClearAll = () => {
    if (window.confirm('¿Eliminar todas las notificaciones?')) {
      notificationService.clearNotifications();
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('request')) {
      if (type.includes('approved')) return <CheckCircleIcon color="success" />;
      if (type.includes('rejected')) return <ErrorIcon color="error" />;
      return <RequestIcon color="primary" />;
    }
    if (type.includes('stock')) return <WarningIcon color="warning" />;

    // CALIBRACIONES - Asegurar que estos tipos están cubiertos
    if (type.includes('calibration')) {
      if (type.includes('overdue')) return <ErrorIcon color="error" />;
      if (type.includes('urgent')) return <ErrorIcon color="error" />;
      if (type.includes('upcoming')) return <BuildIcon color="warning" />;
      return <BuildIcon color="info" />;
    }

    if (type.includes('experiment')) return <ScienceIcon color="success" />;
    if (type.includes('reagent')) return <ScienceIcon color="warning" />;

    return <InfoIcon color="action" />;
  };

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;
    return format(date, 'dd/MM/yyyy', { locale: es });
  };

  return (
    <div>
      <IconButton
        color="inherit"
        onClick={handleClick}
        size="large"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            mt: 1.5,
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notificaciones</Typography>
          <Box>
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllAsRead} sx={{ mr: 1 }}>
                Leer todas
              </Button>
            )}
            <Button size="small" color="error" onClick={handleClearAll}>
              Limpiar
            </Button>
          </Box>
        </Box>

        {!connected && (
          <Alert severity="info" sx={{ mx: 2, mb: 1 }}>
            Conectando al servidor de notificaciones...
          </Alert>
        )}

        <Divider />

        {notifications.length === 0 ? (
          <MenuItem disabled sx={{ justifyContent: 'center', py: 4, flexDirection: 'column' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="textSecondary">
              No hay notificaciones
            </Typography>
          </MenuItem>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.slice(0, 10).map((notification) => (
              <ListItem
                key={notification.id}
                button
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  bgcolor: notification.read ? 'inherit' : 'action.hover',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  },
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 0.5 }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                        {getTimeAgo(notification.timestamp)}
                      </Typography>
                    </>
                  }
                />
                {!notification.read && (
                  <ListItemSecondaryAction>
                    <CircleIcon color="primary" sx={{ fontSize: 8, mr: 1 }} />
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
            {notifications.length > 10 && (
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="textSecondary">
                  +{notifications.length - 10} notificaciones más
                </Typography>
              </Box>
            )}
          </List>
        )}
      </Menu>
    </div>
  );
};
