# 🧪 ChemLab - Sistema de Gestión de Inventario para Laboratorios Químicos

[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Sistema profesional para la gestión integral de laboratorios químicos con integración a PubChem, notificaciones en tiempo real, trazabilidad completa y reportes avanzados.

## ✨ Características

### 🧪 Gestión de Reactivos
- CRUD completo de reactivos químicos
- Integración con PubChem API para autocompletar datos (fórmula, peso molecular, InChI Key)
- Control de stock con alertas automáticas
- Seguimiento de fechas de vencimiento
- Clasificación por nivel de peligro (GHS)
- Historial de cambios completo

### 🔧 Gestión de Equipos
- CRUD de equipos de laboratorio
- Control de calibraciones con alertas de vencimiento
- Seguimiento de mantenimiento
- Historial de uso en experimentos

### 🧬 Gestión de Experimentos
- Creación de experimentos con reactivos y equipos asociados
- Control de cantidades utilizadas (descuento automático de stock)
- Seguimiento de estados (Planificado, En progreso, Completado, Fallido)
- Registro de protocolos y resultados

### 📝 Sistema de Solicitudes
- Solicitud de reactivos y equipos
- Flujo de aprobación/rechazo por administradores
- Prioridades (Baja, Media, Alta, Urgente)
- Historial de solicitudes

### 🔔 Notificaciones en Tiempo Real
- Alertas automáticas de stock bajo
- Recordatorios de calibraciones próximas
- Notificaciones de reactivos próximos a vencer
- Alertas de nuevas solicitudes y cambios de estado
- Notificaciones guardadas en base de datos

### 📊 Reportes Avanzados
- Exportación a Excel de reactivos, equipos y experimentos
- Exportación a PDF con formato profesional
- Reporte ejecutivo con resumen del laboratorio
- Gráficos interactivos en dashboard

### 👥 Roles y Permisos
| Rol | Permisos |
|-----|----------|
| **ADMIN** | Acceso total al sistema |
| **LAB_MANAGER** | Gestión de inventario, experimentos y reportes |
| **RESEARCHER** | Creación de experimentos y consulta de inventario |
| **LAB_TECH** | Gestión de equipos y calibraciones |

### 🔒 Seguridad y Trazabilidad
- Autenticación JWT con cookies
- Separación de datos por usuario
- Auditoría automática de todas las operaciones
- Registro de IP y user agent en cambios

## 🏗️ Arquitectura
ChemLab/
├── ChemLab.Domain/ # Entidades, Value Objects, Enums
├── ChemLab.Application/ # Casos de uso, DTOs, Interfaces
├── ChemLab.Infrastructure/ # Persistencia, SignalR, Servicios
├── ChemLab.API/ # Endpoints Minimal API
├── frontend/ # React + TypeScript
│ ├── src/
│ │ ├── components/ # Componentes UI
│ │ ├── services/ # Servicios API
│ │ ├── types/ # Definiciones TypeScript
│ │ └── hooks/ # Custom hooks
│ └── public/
└── tests/ # Pruebas unitarias y de integración


## 🚀 Tecnologías

### Backend
- **.NET 8** - Framework principal
- **Entity Framework Core** - ORM con SQLite
- **SignalR** - Notificaciones en tiempo real
- **Minimal APIs** - Endpoints ligeros
- **Identity Framework** - Autenticación y roles
- **Serilog** - Logging estructurado

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Material-UI (MUI)** - Componentes y temas
- **Recharts** - Gráficos interactivos
- **Axios** - Cliente HTTP
- **React Router** - Navegación
- **React Query** - Estado del servidor
- **date-fns** - Manipulación de fechas

### APIs Externas
- **PubChem** - Datos químicos (fórmulas, pesos moleculares, InChI Keys)

## 📦 Instalación

### Requisitos Previos
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- [SQLite](https://www.sqlite.org/) (opcional, se crea automáticamente)

### Backend

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/ChemLab.git
cd ChemLab/ChemLabBackend

# Restaurar dependencias
dotnet restore

# Crear base de datos (SQLite)
dotnet ef database update --project src/ChemLab.Infrastructure --startup-project src/ChemLab.API

# Ejecutar API
dotnet run --project src/ChemLab.API

### Frontend

cd ../frontend

# Instalar dependencias
npm install

# Ejecutar aplicación
npm start


La aplicación estará disponible en:

    Frontend: http://localhost:3000

    API: http://localhost:5000

    Swagger: http://localhost:5000/swagger

Usuario por defecto
text

Email: admin@chemlab.com
Password: Admin123!
