import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button, TextField, Container, Typography, Box, Alert, Paper } from '@mui/material';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');        // <-- ESTABA FALTANDO
  const [loading, setLoading] = useState(false); // <-- ESTABA FALTANDO

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Intentando login con:', { email, password });
      const response = await authService.login({ email, password });
      console.log('Login exitoso:', response);
      navigate('/debug/roles');
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
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          ChemLab 🧪
        </Typography>
        <Typography variant="h6" align="center" color="textSecondary" gutterBottom>
          Iniciar Sesión
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              ¿No tienes cuenta?{' '}
              <Link to="/register" style={{ textDecoration: 'none' }}>
                Regístrate
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};
