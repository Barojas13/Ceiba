# EventosVivos

Sistema web de reservas de entradas para eventos culturales (conferencias, talleres y conciertos). Proyecto fullstack desarrollado como prueba técnica con **.NET 10** en el backend y **Angular 22** en el frontend.

---

## Tabla de contenidos

1. [Descripción general](#descripción-general)
2. [Tecnologías y versiones](#tecnologías-y-versiones)
3. [Estructura del repositorio](#estructura-del-repositorio)
4. [Arquitectura](#arquitectura)
5. [Base de datos](#base-de-datos)
6. [Autenticación JWT](#autenticación-jwt)
7. [API y Swagger](#api-y-swagger)
8. [Reglas de negocio](#reglas-de-negocio)
9. [Credenciales y usuarios](#credenciales-y-usuarios)
10. [Guía de uso paso a paso](#guía-de-uso-paso-a-paso)
11. [Ejecución local](#ejecución-local)
12. [Pruebas automatizadas](#pruebas-automatizadas)
13. [Mapa de rutas del frontend](#mapa-de-rutas-del-frontend)
14. [Despliegue en la nube (Render)](#despliegue-en-la-nube-render)

---

## Descripción general

**EventosVivos** permite:

- Explorar eventos activos con filtros (tipo, lugar, estado, título).
- Registrarse e iniciar sesión como comprador.
- Reservar entradas (requiere login).
- Pagar de forma simulada y obtener código de entrada.
- Consultar y gestionar reservas en **Mis reservas**.
- Administrar eventos como **admin**: crear, eliminar, confirmar pagos y ver reporte de ocupación.

---

## Tecnologías y versiones

### Backend

| Tecnología | Versión |
|------------|---------|
| .NET SDK | **10.0.301** (`global.json`) |
| ASP.NET Core Web API | **10.0** |
| Entity Framework Core | **10.0.9** |
| SQLite (proveedor EF) | **10.0.9** |
| FluentValidation | **12.1.1** |
| JWT Bearer Authentication | **10.0.9** |
| Swashbuckle (Swagger) | **10.2.3** |
| xUnit | **2.9.3** |
| Moq | **4.20.72** |
| FluentAssertions | **8.10.0** |

### Frontend

| Tecnología | Versión |
|------------|---------|
| Angular | **22.0.2** |
| Angular CLI | **22.0.4** |
| TypeScript | **~6.0.0** |
| RxJS | **~7.8.0** |
| Zone.js | **^0.16.2** |
| Node.js (recomendado) | **22.22.3** (`.nvmrc`) |

---

## Estructura del repositorio

```
Cieba/
├── README.md
├── .gitignore
├── backend/
│   ├── EventosVivos.sln
│   ├── global.json
│   ├── src/
│   │   ├── EventosVivos.Api/           # Capa de presentación (controllers, JWT, Swagger, middleware)
│   │   ├── EventosVivos.Application/   # Casos de uso, DTOs, validadores, reglas de negocio
│   │   ├── EventosVivos.Domain/        # Entidades, enums, interfaces de repositorio
│   │   └── EventosVivos.Infrastructure/# EF Core, SQLite, repositorios, migraciones
│   └── tests/
│       └── EventosVivos.Tests/         # Pruebas unitarias (xUnit)
└── frontend/
    ├── package.json
    ├── .nvmrc
    ├── angular.json
    └── src/
        └── app/
            ├── pages/                  # Pantallas (listado, detalle, login, registro, etc.)
            ├── services/               # Clientes HTTP hacia la API
            ├── guards/                 # Protección de rutas (auth, admin)
            ├── interceptors/           # Interceptor JWT
            ├── validators/             # Validaciones de formularios (+ *.spec.ts)
            ├── utils/                  # Reglas de negocio espejo, errores API, formato precio (+ *.spec.ts)
            └── models/                 # Interfaces TypeScript
```

---

## Arquitectura

### Backend — Clean Architecture

El backend sigue **arquitectura limpia** en cuatro capas con dependencias hacia el dominio:

```
┌─────────────────────────────────────────────────────────┐
│  EventosVivos.Api                                       │
│  Controllers · JWT · Swagger · CORS · Middleware errores│
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  EventosVivos.Application                               │
│  Services · DTOs · FluentValidation · BusinessRules     │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  EventosVivos.Domain                                    │
│  Entities · Enums · IRepository interfaces              │
└──────────────────────────▲──────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────┐
│  EventosVivos.Infrastructure                            │
│  AppDbContext · Repositories · Migrations · SQLite        │
└─────────────────────────────────────────────────────────┘
```

**Componentes principales del API:**

| Componente | Ubicación | Responsabilidad |
|----------|-----------|-----------------|
| `EventsController` | `Api/Controllers` | CRUD eventos, reporte ocupación, eliminar (admin) |
| `ReservationsController` | `Api/Controllers` | Crear reserva, pagar, cancelar, mis reservas |
| `AuthController` | `Api/Controllers` | Login, registro, perfil |
| `VenuesController` | `Api/Controllers` | Listar lugares (venues) |
| `EventService` | `Application/Services` | Lógica de eventos y reportes |
| `ReservationService` | `Application/Services` | Lógica de reservas y pagos |
| `AuthService` | `Application/Services` | Autenticación, registro, hash de contraseñas |
| `ExceptionHandlingMiddleware` | `Api` | Respuestas JSON uniformes para errores |
| `JwtTokenProvider` | `Api/Auth` | Generación de tokens JWT |

**Entidades del dominio:**

- `Venue` — Lugar del evento (nombre, ciudad, capacidad).
- `Event` — Evento (título, fechas, precio, capacidad, estado).
- `Reservation` — Reserva (cantidad, comprador, estado, código, entradas perdidas).
- `User` — Usuario del sistema (comprador o administrador).

### Frontend — Angular standalone

Aplicación **SPA** con componentes standalone, signals y lazy loading por ruta.

```
┌────────────────────────────────────────┐
│  app.component (layout + navbar)       │
├────────────────────────────────────────┤
│  Router                                │
│    ├── event-list      (público)       │
│    ├── event-detail    (público*)      │
│    ├── login / register                │
│    ├── mis-reservas    (authGuard)     │
│    └── admin/events/new (adminGuard)   │
├────────────────────────────────────────┤
│  Services → HTTP → API REST            │
│  auth.interceptor → Bearer JWT         │
└────────────────────────────────────────┘
```

\* Reservar requiere estar autenticado; ver evento es público.

**Carpetas clave:**

| Carpeta | Contenido |
|---------|-----------|
| `pages/event-list` | Listado y filtros de eventos |
| `pages/event-detail` | Detalle, reserva, pago, panel admin |
| `pages/event-create` | Formulario crear evento (solo admin) |
| `pages/my-reservations` | Mis reservas, pagar, cancelar |
| `pages/login` y `pages/register` | Autenticación unificada |
| `services/` | `auth`, `event`, `reservation`, `venue` |
| `guards/` | `authGuard`, `adminGuard` |
| `utils/business-rules.util.ts` | Validaciones espejo de reglas RN en el cliente |

---

## Base de datos

### Motor y persistencia

- **Motor:** SQLite (archivo local, sin servidor externo).
- **ORM:** Entity Framework Core con **Code First** y **migraciones**.
- **Archivo:** `eventosvivos.db`
- **Ubicación al ejecutar:** se crea en el directorio de trabajo del API, normalmente:

  ```
  backend/src/EventosVivos.Api/eventosvivos.db
  ```

- **Persistencia:** los datos **se conservan** entre reinicios del backend. El archivo no se borra al parar la aplicación.
- **Git:** `*.db`, `*.db-shm` y `*.db-wal` están en `.gitignore` (cada entorno genera su propia base).

### Migraciones automáticas

Al iniciar la API, `Program.cs` ejecuta:

```csharp
await db.Database.MigrateAsync();
```

Esto aplica las migraciones pendientes sin pasos manuales.

### Migraciones incluidas

| Migración | Descripción |
|-----------|-------------|
| `InitialCreate` | Tablas `Venues`, `Events`, `Reservations` + seed de 3 venues |
| `AddUsersAndReservationUserId` | Tabla `Users` + columna `UserId` en reservas |

### Datos iniciales (seed)

Al crear la base por primera vez se insertan **3 lugares**:

| Id | Nombre | Ciudad | Capacidad |
|----|--------|--------|-----------|
| 1 | Auditorio Central | Bogotá | 200 |
| 2 | Sala Norte | Bogotá | 50 |
| 3 | Arena Sur | Medellín | 500 |

Los **eventos y reservas** se crean desde la aplicación (no vienen precargados).

### Crear migraciones manualmente (opcional)

```bash
cd backend
dotnet ef migrations add NombreMigracion \
  --project src/EventosVivos.Infrastructure/EventosVivos.Infrastructure.csproj \
  --startup-project src/EventosVivos.Api/EventosVivos.Api.csproj
```

### Restablecer la base de datos

1. Detener el backend.
2. Eliminar `backend/src/EventosVivos.Api/eventosvivos.db` (y `.db-shm`, `.db-wal` si existen).
3. Volver a ejecutar `dotnet run` — se recrea con migraciones y seed.

---

## Autenticación JWT

- Login y registro devuelven un **token JWT** (`Bearer`).
- El frontend lo guarda en `localStorage` y lo envía en cada petición vía `auth.interceptor`.
- Roles: **`Admin`** y **`User`**.
- Configuración en `backend/src/EventosVivos.Api/appsettings.json`:

```json
"Jwt": {
  "Issuer": "EventosVivos",
  "Audience": "EventosVivosClients",
  "Secret": "EventosVivos-SuperSecret-Key-Min32Chars-2026!",
  "ExpirationMinutes": 120
}
```

**Endpoints protegidos (ejemplos):**

| Acción | Rol requerido |
|--------|----------------|
| Crear evento | Admin |
| Eliminar evento | Admin |
| Reporte de ocupación | Admin |
| Confirmar pago (por ID, panel admin) | Admin |
| Crear reserva | User o Admin |
| Pagar reserva (`/pay`) | User o Admin (dueño) |
| Mis reservas | Autenticado |
| Cancelar reserva | User o Admin (dueño) |

---

## API y Swagger

### URLs locales

| Recurso | URL |
|---------|-----|
| API base | `http://localhost:5229/api` |
| Swagger UI | `http://localhost:5229/swagger` |

### Endpoints principales

#### Auth — `/api/auth`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/login` | No | Iniciar sesión |
| POST | `/register` | No | Registrar comprador |
| GET | `/me` | Sí | Perfil del usuario autenticado |

#### Eventos — `/api/events`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | No | Listar con filtros |
| GET | `/{id}` | No | Detalle de evento |
| POST | `/` | Admin | Crear evento |
| DELETE | `/{id}` | Admin | Eliminar evento |
| GET | `/{id}/occupancy-report` | Admin | Reporte de ocupación |

#### Reservas — `/api/reservations`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/` | User/Admin | Crear reserva |
| GET | `/me` | Sí | Mis reservas |
| GET | `/{id}` | Sí | Detalle (dueño o admin) |
| POST | `/{id}/pay` | User/Admin | Pago simulado (comprador) |
| POST | `/{id}/confirm-payment` | Admin | Confirmar pago manual |
| POST | `/{id}/cancel` | User/Admin | Cancelar reserva confirmada |

#### Lugares — `/api/venues`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | No | Listar venues |

### Probar con Swagger

1. Ejecutar el backend.
2. Abrir `http://localhost:5229/swagger`.
3. Hacer login con `POST /api/auth/login` y copiar el `token`.
4. Clic en **Authorize** (candado) → escribir: `Bearer {tu-token}`.
5. Probar endpoints protegidos.

---

## Reglas de negocio

Implementadas en **backend** (`ReservationService`, `EventService`, `BusinessRules.cs`) y replicadas en **frontend** (`business-rules.util.ts`, validadores).

| Código | Regla |
|--------|-------|
| RN-01 | La capacidad del evento no puede superar la del lugar (venue). |
| RN-02 | No puede haber dos eventos activos superpuestos en el mismo lugar. |
| RN-03 | En fin de semana el evento no puede empezar después de las 22:00. |
| RN-04 | No se puede reservar si faltan menos de 1 hora para el inicio. |
| RN-05 | Si el precio supera $100, máximo 10 entradas por compra (salvo regla 24h). |
| Regla 24h | Si faltan menos de 24 h, máximo 5 entradas por compra. |
| RN-06 | El evento pasa a **Completado** al superar su fecha de fin. |
| RN-07 | Cancelación con menos de 48 h → las entradas no vuelven a estar disponibles. |

---

## Credenciales y usuarios

### Administrador (precargado en configuración)

| Campo | Valor |
|-------|-------|
| Usuario | `admin` |
| Contraseña | `Admin123!` |
| Rol | Admin |

> El admin entra por el **mismo login** que los compradores: `/login` → usuario `admin`.

### Comprador (registro libre)

1. Ir a **Registrarse** (`/register`).
2. Completar nombre, correo y contraseña (mínimo 6 caracteres).
3. Iniciar sesión con el correo registrado.

No hay usuarios de prueba precargados para compradores; cada evaluador puede crear el suyo.

---

## Guía de uso paso a paso

### Flujo comprador

1. **Abrir** `http://localhost:4200`
2. **Registrarse** (navbar → Registrarse) o **Iniciar sesión** si ya tiene cuenta.
3. **Explorar eventos** en la página principal; usar filtros si desea.
4. Clic en **Ver y reservar** en un evento.
5. Si no está logueado, el sistema pide iniciar sesión.
6. Elegir **cantidad** y pulsar **Reservar entradas**.
7. En el banner de confirmación, pulsar **Pagar ahora** (pago simulado).
8. Guardar el **código de entrada** (ej: `EV-123456`).
9. Consultar todo en **Mis reservas** (`/mis-reservas`): IDs, totales, estados y cancelaciones.

### Flujo administrador

1. **Iniciar sesión** en `/login` con `admin` / `Admin123!`.
2. En el navbar aparece **+ Crear evento**.
3. **Crear evento:** `/admin/events/new` — completar formulario (lugar, fechas, capacidad, precio).
4. **Confirmar pagos de terceros** (opcional): en detalle del evento, panel **Gestionar reserva (admin)** → pegar ID → Confirmar pago.
5. **Reporte de ocupación:** en detalle del evento → Ver reporte (confirmadas, pendientes, canceladas, ingresos).
6. **Eliminar evento:** panel Eliminar evento → confirmación en modal.

### Dónde está cada cosa en la UI

| Funcionalidad | Ruta / ubicación |
|---------------|------------------|
| Listado de eventos | `/` |
| Detalle y reserva | `/events/{id}` |
| Login | `/login` |
| Registro | `/register` |
| Mis reservas y pago | `/mis-reservas` |
| Crear evento (admin) | `/admin/events/new` |
| Swagger (API) | `http://localhost:5229/swagger` |

---

## Ejecución local

### Requisitos previos

- [.NET SDK 10.0.301+](https://dotnet.microsoft.com/download)
- [Node.js 22.22.3+](https://nodejs.org/) (recomendado: `nvm` con el `.nvmrc` del frontend)

### 1. Backend

```powershell
cd backend\src\EventosVivos.Api
dotnet restore
dotnet run
```

Salida esperada: API escuchando en **`http://localhost:5229`**.

Swagger: **http://localhost:5229/swagger**

> Alternativa desde la raíz del backend:
> `dotnet run --project src/EventosVivos.Api`

### 2. Frontend

En **otra terminal**:

```powershell
cd frontend
nvm use          # activa Node 22.22.3 (si usa nvm)
npm install
npm start
```

Abrir: **http://localhost:4200**

La URL de la API está en `frontend/src/environments/environment.ts`:

```typescript
apiUrl: 'http://localhost:5229/api'
```

### 3. Verificar que todo funciona

1. Backend arriba → Swagger carga.
2. Frontend arriba → listado de eventos (puede estar vacío al inicio).
3. Login como `admin` → aparece botón **Crear evento**.
4. Registrar un comprador → reservar y pagar en un evento.

### Visual Studio

Abrir `backend/EventosVivos.sln`, establecer **EventosVivos.Api** como proyecto de inicio y ejecutar (F5). Requiere soporte para **.NET 10**.

### CORS

El backend permite peticiones desde `http://localhost:4200` (configurado en `Program.cs`).

---

## Pruebas automatizadas

### Backend

Proyecto: `backend/tests/EventosVivos.Tests`

**14 pruebas unitarias** con xUnit, Moq y FluentAssertions:

| Archivo | Qué valida |
|---------|------------|
| `AuthServiceTests` | Login correcto, credenciales inválidas |
| `EventServiceTests` | Capacidad venue, superposición, fin de semana, completado |
| `ReservationServiceTests` | Límites 1h, 24h, precio alto, cancelación con/sin penalización |

```powershell
cd backend
dotnet test
```

Resultado esperado: **14 passed**.

### Frontend

Proyecto: `frontend/src/app` (archivos `*.spec.ts`)

**37 pruebas unitarias** con Jasmine y Karma sobre reglas de negocio, validadores y utilidades:

| Archivo | Qué valida |
|---------|------------|
| `business-rules.util.spec.ts` | Reserva permitida, límites 24h/precio alto, penalización por cancelación |
| `reservation-form.validators.spec.ts` | Cantidad máxima por transacción |
| `event-form.validators.spec.ts` | Fechas futuras, fin > inicio, fin de semana nocturno, capacidad venue |
| `price-format.util.spec.ts` | Parseo y formato de precios |
| `api-error.util.spec.ts` | Mensajes de error HTTP al usuario |

```powershell
cd frontend
npm test
```

Modo CI (sin watch, Chrome headless):

```powershell
cd frontend
npm run test:ci
```

Resultado esperado: **37 SUCCESS**.

---

## Mapa de rutas del frontend

| Ruta | Guard | Descripción |
|------|-------|-------------|
| `/` | — | Listado de eventos |
| `/events/:id` | — | Detalle, reserva y panel admin |
| `/login` | — | Inicio de sesión |
| `/register` | — | Registro de comprador |
| `/mis-reservas` | `authGuard` | Mis reservas y pagos |
| `/admin/events/new` | `adminGuard` | Crear evento |
| `/admin/login` | — | Redirige a `/login` |

---

## Despliegue en la nube (Render)

La aplicación está preparada para desplegarse en [Render](https://render.com) (plan gratuito) con un solo blueprint.

| Servicio | URL esperada |
|----------|----------------|
| **Frontend (Angular)** | https://eventosvivos-web.onrender.com |
| **API (.NET + Swagger)** | https://eventosvivos-api.onrender.com/swagger |

### Notas del despliegue

- El plan gratuito **duerme** tras ~15 min sin uso; el primer acceso puede tardar ~1 min en despertar.
- La base SQLite se reinicia en cada redeploy (datos de demo; los venues iniciales se recrean con migraciones).
- Swagger queda disponible en producción para evaluar la API.
- CORS acepta `localhost` y cualquier subdominio `*.onrender.com`.

### Archivos de despliegue

- `render.yaml` — definición de servicios
- `backend/Dockerfile` — imagen de la API
- `frontend/scripts/set-env-api-url.cjs` — inyecta la URL de la API en el build

---

## Notas adicionales

- **Pago simulado:** no hay pasarela real (PSE, tarjeta, etc.). El botón **Pagar ahora** confirma la reserva y genera el código de entrada.
- **Mensajes al usuario:** textos en español orientados al comprador final (sin códigos técnicos visibles).
- **Locale:** fechas en español (`es`) configurado en `main.ts` y `app.config.ts`.

---

## Autor

Prueba técnica Fullstack — EventosVivos.
