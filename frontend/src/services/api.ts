// src\services\api.ts
import axios from 'axios';

// F7b: URL absoluta del backend. Con baseURL relativa ('/api') el dev-server de
// CRA hacía de proxy y la cookie de sesión no viajaba correctamente.
// Exportamos el host para reutilizarlo en SignalR (notificationService.ts).
export const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  timeout: 10000,
});

// Interceptor para logging (opcional, ayuda a debuggear)
api.interceptors.request.use(request => {
  console.log('Starting Request:', request.method, request.url);
  return request;
});

// Interceptor global de respuestas: logging + manejo centralizado de 401.
// Cuando la cookie de sesión expira el backend responde 401 y aquí limpiamos el
// estado local y mandamos al usuario a /login conservando la ruta original.
api.interceptors.response.use(
  response => {
    console.log('Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('API Error:', error.message, error.config?.url);

    if (error.response?.status === 401) {
      // No redirigir si ya estamos en /login (evita bucles de redirección).
      if (!window.location.pathname.startsWith('/login')) {
        // Limpiar estado local
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');

        // Redirigir preservando la ruta original como query
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?returnUrl=${returnUrl}`;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
