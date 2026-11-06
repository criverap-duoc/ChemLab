import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// La plantilla de CRA traía "renders learn react link", que no aplica a ChemLab y hacía
// fallar la suite. Sin sesión, la raíz redirige a /dashboard y ProtectedRoute manda a
// /login, así que la pantalla esperada es el formulario de acceso.
beforeEach(() => {
  window.history.pushState({}, '', '/login');
  localStorage.clear();
});

test('renders_login_screen_when_there_is_no_session', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
});

