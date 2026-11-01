# 🧪 ChemLab — Gestión de inventario para laboratorios químicos

[![Release](https://img.shields.io/badge/release-v1.0.0-2ea44f?logo=github)](https://github.com/criverap-duoc/ChemLab/releases/tag/v1.0.0)
[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![EF Core](https://img.shields.io/badge/EF_Core-8.0-512BD4)](https://learn.microsoft.com/ef/core/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![MUI](https://img.shields.io/badge/MUI-5.18-007FFF?logo=mui)](https://mui.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)](https://www.sqlite.org/)
[![SignalR](https://img.shields.io/badge/SignalR-tiempo%20real-512BD4)](https://learn.microsoft.com/aspnet/core/signalr/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#-licencia)

## 📌 Estado del proyecto: v1.0.0

**Release inicial.** La rama `develop` se promovió a `main` con el tag `v1.0.0`
(backend .NET 8 + EF Core + SQLite y frontend React + TypeScript + MUI completos).

### Checklist de features

| Módulo | Estado | Detalle |
| --- | :---: | --- |
| Autenticación y sesión | ✅ | ASP.NET Identity + cookies, registro/login/logout, sesión cross-origin en dev |
| Roles y permisos | ✅ | `ADMIN`, `LAB_MANAGER`, `RESEARCHER`, `LAB_TECH` (permisos en frontend + políticas en API) |
| Reactivos | ✅ | CRUD, stock mínimo con alertas, nivel GHS, vencimiento, autocompletado PubChem |
| Equipos | ✅ | CRUD, última/próxima calibración, estados con colores |
| Experimentos | ✅ | Alta con reactivos y equipos, descuento de stock, estados, protocolo y resultados |
| Solicitudes | ✅ | Flujo pendiente/aprobada/rechazada, prioridades, ítems de reactivo y equipo |
| Notificaciones | ✅ | SignalR (`/hubs/notifications`) + persistencia + `NotificationBackgroundService` |
| Reportes | ✅ | Dashboard con gráficos, exportación a Excel y PDF |
| Trazabilidad | ✅ | Historial por entidad: `/api/traceability/history/{entityType}/{entityId}` |
| Auditoría automática (F8.1) | ✅ | `AuditMiddleware` registra CREATE/UPDATE/DELETE en `AuditLogs` (usuario, IP, user agent, body) |
| Gestión de usuarios (F8.2) | ✅ | `/api/users`: listar, cambiar rol, cambiar estado, baja lógica — policy `AdminOnly` |
| Verificación final (F8.3) | ✅ | `dotnet build` 0 errores · `tsc --noEmit` 0 errores · `pnpm run build` OK · 6 migraciones aplicadas |
| Despliegue productivo | ⏳ | Fuera del alcance de v1.0.0 (PostgreSQL + CI/CD) |
| Cobertura de pruebas | ⏳ | Proyectos de test creados; cobertura aún no medida |

---

## 🎯 Problema y solución

Los laboratorios químicos pierden control cuando el stock está desactualizado, la
trazabilidad no existe, los datos químicos se cargan a mano y las solicitudes internas
circulan por correo. ChemLab concentra esos cuatro problemas en una sola aplicación:

- Alertas automáticas de stock bajo, calibraciones y vencimientos.
- Historial de cambios por entidad y auditoría automática de todas las escrituras.
- Autocompletado de datos químicos desde PubChem (fórmula, peso molecular, CAS, InChI Key).
- Solicitudes con flujo de aprobación, prioridad y trazabilidad de estados.

---

## ✨ Características

### 🧪 Reactivos
CRUD completo, control de stock con mínimo configurable, clasificación por peligro GHS,
fecha de vencimiento, ubicación y proveedor, más integración con PubChem.

### 🔧 Equipos
CRUD de equipos de laboratorio con estado (disponible, en uso, mantenimiento,
calibración pendiente, fuera de servicio) y seguimiento de calibraciones.

### 🧬 Experimentos
Creación de experimentos asociando reactivos (con cantidad utilizada y descuento de stock)
y equipos, seguimiento de estado y registro de protocolo/resultados.

### 📝 Solicitudes
Solicitudes de reactivos y equipos con prioridades (baja, media, alta, urgente) y
aprobación/rechazo por parte de administradores o responsables de laboratorio.

### 🔔 Notificaciones en tiempo real
Push vía SignalR, guardadas en base de datos, generadas por stock bajo, calibraciones
próximas, reactivos por vencer y cambios de estado de solicitudes.

### 📊 Reportes
Dashboard con indicadores y gráficos, exportación a Excel (`xlsx` + `file-saver`) y PDF
(`jspdf` + `jspdf-autotable`).

### 🔒 Seguridad, auditoría y trazabilidad
- Cookies de Identity (sin tokens en localStorage) y CORS con credenciales.
- `AuditMiddleware` escribe en `AuditLogs` cada POST/PUT/PATCH/DELETE exitoso sobre
  `/api/reagents`, `/api/equipment`, `/api/experiments` y `/api/requests`.
- `/api/users` exige la política `AdminOnly`; no se puede degradar ni eliminar al último
  administrador activo, y tampoco un ADMIN puede quitarse su propio rol.

---

## 👥 Roles y permisos

| Rol | Alcance |
| --- | --- |
| **ADMIN** | Acceso total, incluido el panel `/admin/users` |
| **LAB_MANAGER** | Inventario, experimentos y reportes (sin gestión de usuarios) |
| **RESEARCHER** | Consulta de inventario y creación/edición de experimentos |
| **LAB_TECH** | Consulta de inventario, calibración de equipos |

---

## 🏗️ Arquitectura

Clean Architecture con dependencias hacia el dominio:

| Capa | Responsabilidad |
| --- | --- |
| `ChemLab.Domain` | Entidades (`Reagent`, `Equipment`, `Experiment`, `Request`, `Notification`, `AuditLog`, `User`) y enums |
| `ChemLab.Application` | DTOs y registro de MediatR/AutoMapper |
| `ChemLab.Infrastructure` | `ApplicationDbContext`, migraciones EF Core, DI de EF/Redis/SQLite |
| `ChemLab.API` | Minimal APIs, `AuditMiddleware`, SignalR, servicios de notificación |
| `frontend` | React + TypeScript (componentes, servicios, tipos, hooks) |

Endpoints y bases de datos:

- **Minimal APIs** organizadas por recurso en `ChemLabBackend/src/ChemLab.API/Endpoints/`.
- **SQLite** en desarrollo; la ruta se resuelve contra `ContentRoot` (ver `Program.cs`).
- **Identity** con `Guid` + `GuidToStringConverter`; los roles se leen con SQL crudo sobre
  la misma conexión del `DbContext` (limitación documentada en el código, F6.5f).

### Estructura del repositorio

```text
ChemLab/
├── ChemLabBackend/
│   ├── ChemLabInventory.slnx
│   ├── src/
│   │   ├── ChemLab.Domain/          # entidades y enums
│   │   ├── ChemLab.Application/     # DTOs y casos de uso
│   │   ├── ChemLab.Infrastructure/  # EF Core, DbContext, migraciones
│   │   └── ChemLab.API/             # Minimal APIs, middleware, SignalR
│   └── tests/                       # UnitTests e IntegrationTests
├── frontend/
│   └── src/
│       ├── components/              # por feature (auth, reagents, admin, ...)
│       ├── services/                # cliente axios por recurso
│       ├── types/                   # tipos e interfaces (sin `any`)
│       ├── hooks/                   # usePermissions
│       └── theme.ts                 # tema MUI claro/oscuro
└── .gitignore
```

---

## 🚀 Tecnologías

**Backend:** .NET 8 · ASP.NET Core Minimal APIs · Entity Framework Core 8 · SQLite ·
ASP.NET Identity · SignalR · Swagger.

**Frontend:** React 18 · TypeScript 4.9 · MUI 5 · React Query · React Router 6 ·
React Hook Form + Zod · Recharts · date-fns (locale `es`) · xlsx / jsPDF.

**Externas:** [PubChem](https://pubchem.ncbi.nlm.nih.gov/) para datos químicos.

---

## 📦 Instalación (verificada)

### Requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/) y [pnpm](https://pnpm.io/) (`corepack enable`)
- Herramienta EF Core: `dotnet tool install --global dotnet-ef`

### Backend

```bash
git clone https://github.com/criverap-duoc/ChemLab.git
cd ChemLab/ChemLabBackend

dotnet restore
dotnet ef database update --project src/ChemLab.Infrastructure --startup-project src/ChemLab.API
dotnet run --project src/ChemLab.API
```

La API queda en `http://localhost:5000` y Swagger en `http://localhost:5000/swagger`.

### Frontend

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm start
```

La aplicación queda en `http://localhost:3000`. El proyecto usa **solo pnpm**: el lockfile
oficial es `pnpm-lock.yaml` (los `package-lock.json` / `yarn.lock` están ignorados).

### Primer arranque

1. Inicializar los roles de Identity:

   ```bash
   curl -X POST http://localhost:5000/api/setup/init-roles
   ```

2. Registrarse en `http://localhost:3000/register` (el alta asigna `RESEARCHER`).
3. Promover el primer usuario a `ADMIN` (una sola vez, sobre la BD SQLite de desarrollo):

   ```sql
   UPDATE AspNetUserRoles
      SET RoleId = (SELECT Id FROM AspNetRoles WHERE Name = 'ADMIN')
    WHERE UserId = (SELECT Id FROM AspNetUsers WHERE Email = 'tu@correo.cl');
   ```

4. A partir de ahí, la gestión de usuarios se hace desde `/admin/users`
   o con `/api/users` (policy `AdminOnly`).

> Comprobar la salud del backend: `GET http://localhost:5000/api/health` → `{ "status": "Healthy", "version": "1.0.0" }`.

---

## 🔌 API principal

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | — | Alta de usuario (rol `RESEARCHER`) |
| `POST` | `/api/auth/login` | — | Login por cookie + rol real |
| `POST` | `/api/auth/logout` | Cookie | Cierre de sesión |
| `GET/POST/PUT/DELETE` | `/api/reagents` | Cookie | CRUD de reactivos |
| `GET/POST/PUT/DELETE` | `/api/equipment` | Cookie | CRUD de equipos |
| `GET/POST/PUT/DELETE` | `/api/experiments` | Cookie | Experimentos con reactivos y equipos |
| `GET/POST/PUT/DELETE` | `/api/requests` | Cookie | Solicitudes y su flujo de aprobación |
| `GET` | `/api/notifications/unread` | Cookie | Notificaciones no leídas |
| `POST` | `/api/notifications/mark-read/{id}` | Cookie | Marcar una como leída |
| `POST` | `/api/notifications/mark-all-read` | Cookie | Marcar todas como leídas |
| `GET` | `/api/traceability/history/{entityType}/{entityId}` | Cookie | Historial de cambios de una entidad |
| `GET` | `/api/users` | **ADMIN** | Listado paginado con rol (`search`, `isActive`) |
| `PUT` | `/api/users/{id}/role` | **ADMIN** | Cambio de rol (protege al último ADMIN) |
| `PUT` | `/api/users/{id}/status` | **ADMIN** | Activar / desactivar usuario |
| `DELETE` | `/api/users/{id}` | **ADMIN** | Baja lógica (`IsActive = false`) |
| `POST` | `/api/setup/init-roles` | — | Crea los 4 roles de Identity |
| `GET` | `/api/health` | — | Health check |
| `WS` | `/hubs/notifications` | Cookie | Hub SignalR de notificaciones |

---

## 🧪 Verificación y scripts

```bash
# Backend: compilación de la solución completa (0 errores esperados)
cd ChemLabBackend
dotnet build ChemLabInventory.slnx

# Migraciones: todas deben aparecer aplicadas (sin "(Pending)")
dotnet ef migrations list --project src/ChemLab.Infrastructure --startup-project src/ChemLab.API

# Frontend: tipos y build de producción
cd ../frontend
pnpm exec tsc --noEmit
pnpm run build
```

Resultado del cierre de F8.3: `dotnet build` → **0 advertencias, 0 errores**;
`tsc --noEmit` → **0 errores**; `pnpm run build` → **Compiled successfully**;
`dotnet ef migrations list` → **6/6 migraciones aplicadas**.

---

## 📋 Limitaciones conocidas

- **SQLite** es la base de desarrollo (sin concurrencia multi-instancia ni persistencia
  viable en free tiers); producción requerirá PostgreSQL.
- Los roles se resuelven con **SQL crudo** porque `UserManager.GetRolesAsync()` devuelve
  vacío con `IdentityRole<Guid>` + `GuidToStringConverter` en este modelo.
- `LastLogin` no se persiste: la API devuelve `null` y la UI muestra "Nunca".
- `AuditMiddleware` audita los 4 recursos de inventario/experimentación; `/api/users`
  queda fuera de la auditoría automática en v1.0.0.

## 🔮 Roadmap

- Migración a PostgreSQL + despliegue (backend en Render/Railway, frontend en Vercel).
- CI/CD con GitHub Actions (build + tests + tag automático).
- Cobertura de pruebas en `ChemLab.Application.UnitTests` y `ChemLab.API.IntegrationTests`.
- Auditoría de `/api/users` y persistencia de `LastLogin`.

---

## 🤝 Contribuciones

1. Fork del proyecto.
2. Rama de trabajo desde `develop`: `git checkout -b feature/mi-aporte`.
3. Cambios con `pnpm` (nunca `npm` ni `yarn`) y build en verde.
4. Pull Request hacia `develop`.

---

## 📝 Licencia

Distribuido bajo licencia MIT.

## 📧 Contacto

Cristóbal Vera — [GitHub @criverap-duoc](https://github.com/criverap-duoc)

Repositorio: [https://github.com/criverap-duoc/ChemLab](https://github.com/criverap-duoc/ChemLab)

