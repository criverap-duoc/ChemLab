import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { authService } from '../../services/authService';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { AuthLayout } from './AuthLayout';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  // returnUrl lo pone el interceptor de 401 de api.ts (y ProtectedRoute) al
  // expirar la sesión, para devolver al usuario a la pantalla donde estaba.
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');        // <-- ESTABA FALTANDO
  const [loading, setLoading] = useState(false); // <-- ESTABA FALTANDO
  // Estado solo visual: mostrar u ocultar la contraseña.
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Nunca registrar la contraseña en consola.
      console.log('Intentando login con:', { email });
      const response = await authService.login({ email, password });
      console.log('Login exitoso:', response);

      // Destino post-login: returnUrl (solo rutas internas) o /dashboard.
      const returnUrl = searchParams.get('returnUrl');
      const isSafeInternalPath =
        !!returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//');
      const target = isSafeInternalPath && returnUrl ? returnUrl : '/dashboard';

      navigate(target, { replace: true });
    } catch (err: any) {
      console.error('Error de login:', err);
      if (err.response?.status === 401) {
        setError('Credenciales inválidas');
      } else if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        setError('No se puede conectar al backend. Asegúrate que esté corriendo en http://localhost:5000');
      } else {
        setError('Error al iniciar sesión. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Iniciar Sesión"
      subtitle="Accede para gestionar reactivos, equipos y experimentos de tu laboratorio."
    >
      {error && (
        <Alert
          severity="error"
          role="alert"
          className="auth-alert-enter"
          sx={{ mb: 2.5, borderRadius: '12px', overflowWrap: 'anywhere' }}
        >
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <TextField
            fullWidth
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            autoComplete="email"
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={loading}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <VisibilityOffIcon fontSize="small" />
                    ) : (
                      <VisibilityIcon fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Stack>
        <Button
          fullWidth
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
          sx={{
            mt: 3,
            py: 1.25,
            borderRadius: '12px',
            fontSize: '0.975rem',
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 2,
            },
          }}
        >
          {loading ? 'Ingresando...' : 'Iniciar Sesión'}
        </Button>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            ¿No tienes cuenta?{' '}
            <Link
              component={RouterLink}
              to="/register"
              underline="hover"
              sx={{
                fontWeight: 700,
                /* Claro: text.secondary (6.7:1). Oscuro: primary.light (5.1:1),
                   para evitar el morado sobre azul-pizarra ilegible. */
                color: (theme) =>
                  theme.palette.mode === 'dark'
                    ? theme.palette.primary.light
                    : theme.palette.text.secondary,
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                  borderRadius: '4px',
                },
              }}
            >
              Regístrate
            </Link>
          </Typography>
        </Box>
      </form>
    </AuthLayout>
  );
};
