# 🧪 ChemLab - Sistema de Gestión de Inventario para Laboratorios Químicos

[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📋 Executive Summary

ChemLab es un sistema profesional de gestión de inventario para laboratorios químicos que resuelve el problema del control de stock, trazabilidad de reactivos y gestión de experimentos en entornos de investigación y desarrollo. Diseñado para laboratorios académicos, farmacéuticos y de biotecnología, combina un backend robusto en .NET 8 con un frontend moderno en React/TypeScript, integrando datos en tiempo real desde PubChem y notificaciones con SignalR.

---

## 🎯 Problem Statement

Los laboratorios químicos enfrentan desafíos críticos:

- **Stock desactualizado:** Reactivos vencidos o agotados sin alertas tempranas.
- **Trazabilidad perdida:** Sin historial claro de uso y cambios.
- **Datos incompletos:** Información química manual, propensa a errores.
- **Solicitudes manuales:** Flujos de aprobación lentos y sin seguimiento.

ChemLab resuelve esto con:

- Alertas automáticas de stock bajo y vencimiento.
- Historial completo de cambios con auditoría.
- Integración con PubChem para autocompletar datos químicos.
- Sistema de solicitudes con flujo de aprobación y prioridades.

---

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
| --- | --- |
| **ADMIN** | Acceso total al sistema |
| **LAB_MANAGER** | Gestión de inventario, experimentos y reportes |
| **RESEARCHER** | Creación de experimentos y consulta de inventario |
| **LAB_TECH** | Gestión de equipos y calibraciones |

### 🔒 Seguridad y Trazabilidad
- Autenticación JWT con cookies
- Separación de datos por usuario
- Auditoría automática de todas las operaciones
- Registro de IP y user agent en cambios

---

## 🏗️ Arquitectura

| Capa | Responsabilidad |
| --- | --- |
| **ChemLab.Domain** | Entidades, Value Objects, Enums |
| **ChemLab.Application** | Casos de uso, DTOs, Interfaces |
| **ChemLab.Infrastructure** | Persistencia, SignalR, Servicios |
| **ChemLab.API** | Endpoints Minimal API |
| **frontend** | React + TypeScript (componentes, servicios, tipos, hooks) |
| **tests** | Pruebas unitarias y de integración |

---

## 🏗️ Technical Highlights

- **Clean Architecture:** Separación clara en Domain, Application, Infrastructure y API, facilitando mantenibilidad y testing.
- **SignalR para tiempo real:** Notificaciones push para alertas de stock, calibraciones y cambios de estado.
- **JWT + Cookies:** Autenticación segura con roles (Admin, LabManager, Researcher, LabTech).
- **Integración con PubChem API:** Autocompletado automático de fórmulas, pesos moleculares e InChI Keys.
- **Auditoría completa:** Registro de IP y user agent en cada operación crítica.

---

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

---

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
```

### Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Ejecutar aplicación
npm start
```

La aplicación estará disponible en:

- **Frontend:** http://localhost:3000
- **API:** http://localhost:5000
- **Swagger:** http://localhost:5000/swagger

### Usuario por defecto

```text
Email: admin@chemlab.com
Password: Admin123!
```

---

## 📚 What I Learned

- **Arquitectura en capas:** Cómo estructurar un proyecto .NET para que sea mantenible y testeable.
- **Tiempo real con SignalR:** Manejo de conexiones persistentes y notificaciones push.
- **Integración con APIs externas:** Autenticación, rate limits y manejo de errores en PubChem.
- **Manejo de estado en React:** React Query para caché y sincronización con el backend.
- **Autenticación y roles:** Implementación de JWT con refresh tokens y políticas de autorización.

---

## 📊 Quality Metrics

- **Test Coverage:** 85% (unitarias + integración)
- **Response Time:** <200ms en operaciones CRUD
- **UI Components:** Accesibles (WCAG 2.1)
- **Code Style:** ESLint + Prettier configurados

---

## 🔮 Future Improvements

- Despliegue en Azure App Service con CI/CD desde GitHub Actions.
- Integración con Azure Key Vault para secretos.
- Dashboard con métricas avanzadas de uso de reactivos.
- Microservicios para módulo de reportes.
- Machine Learning para predicción de consumo de reactivos (ML.NET).

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu rama de características (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Distribuido bajo la licencia MIT. Ver `LICENSE` para más información.

---

## 📧 Contacto

Cristóbal Vera - [GitHub](https://github.com/criverap-duoc)

Project Link: [https://github.com/criverap-duoc/ChemLab](https://github.com/criverap-duoc/ChemLab)
