import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Science as ScienceIcon,
  Biotech as BiotechIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Assignment as RequestIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme as useAppTheme } from '../../theme';
import { NotificationBell } from '../notifications/NotificationBell';
import { authService } from '../../services/authService';


const drawerWidth = 280;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme } = useAppTheme();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Logout limpio: cierra sesión en backend (sin bloquear si falla) y limpia
  // el estado local antes de volver al login.
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión en el servidor:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
      setAnchorEl(null);
      navigate('/login');
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Reactivos', icon: <ScienceIcon />, path: '/reagents' },
    { text: 'Equipos', icon: <BiotechIcon />, path: '/equipment' },
    { text: 'Experimentos', icon: <ScienceIcon />, path: '/experiments' },
    { text: 'Reportes', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'Solicitudes', icon: <RequestIcon />, path: '/requests' },
  ];

  const drawer = (
    <Box>
      <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          ChemLab 🧪
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                mx: 1,
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'white' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2, md: 3 }, gap: { xs: 0.5, sm: 1 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: { xs: 0.5, sm: 2 }, display: { sm: 'none' }, flexShrink: 0 }}
          >
            <MenuIcon />
          </IconButton>

          {/* minWidth: 0 permite que el título truncado ceda espacio a los iconos en xs */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, minWidth: 0, fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            {menuItems.find(item => item.path === location.pathname)?.text || 'ChemLab'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, sm: 1 }, flexShrink: 0 }}>
            {/* Switch de modo oscuro */}
            <Tooltip title={`Cambiar a modo ${mode === 'light' ? 'oscuro' : 'claro'}`}>
              <IconButton onClick={toggleTheme} color="inherit">
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>

            <NotificationBell />



            {/* Menú de usuario */}
            <Tooltip title="Perfil">
              <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{ ml: 1 }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Menú de notificaciones */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={() => setNotificationsAnchor(null)}
        PaperProps={{
          sx: { width: 320, maxHeight: 400, borderRadius: 2 },
        }}
      >
        <MenuItem>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              ⚠️ Stock bajo: Ácido Sulfúrico
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Quedan 100ml (mínimo 500ml)
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              🔧 Calibración próxima: Espectrofotómetro
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Vence en 3 días
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              🧪 Nuevo reactivo agregado
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Etanol absoluto - 1L
            </Typography>
          </Box>
        </MenuItem>
      </Menu>

      {/* Menú de usuario */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { width: 200, borderRadius: 2 },
        }}
      >
        <MenuItem>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Mi Perfil" />
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Configuración" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Cerrar Sesión" sx={{ color: 'error.main' }} />
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          /* minWidth: 0 evita que el contenido empuje el flex container y genere scroll horizontal en xs */
          minWidth: 0,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};
