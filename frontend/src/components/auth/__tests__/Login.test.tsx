import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../Login';

describe('Login', () => {
  it('renders_email_and_password_fields', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Campo de email (TextField de MUI etiquetado "Email").
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

    // Campo de contraseña: el selector 'input' evita chocar con el IconButton
    // "Mostrar contraseña" que también tiene aria-label.
    expect(screen.getByLabelText(/contraseña/i, { selector: 'input' })).toBeInTheDocument();

    // Botón de envío del formulario.
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });
});
