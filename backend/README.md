# Informaticpark Backend

API REST para la gestión del parque informático.

## Stack

- NestJS 11
- Prisma 7
- PostgreSQL
- Bun

La API escucha en el puerto `4000` y utiliza el prefijo `/api`.

## Requisitos

- Bun `>= 1.1`
- Docker y Docker Compose

## Inicio rápido

Desde la raíz del repositorio:

```bash
docker compose up -d db
```

Configura las variables del backend:

```bash
cp backend/.env.example backend/.env
```

Instala dependencias, prepara la base de datos y arranca la API:

```bash
cd backend
bun install
bun run prisma:migrate
bun run prisma:seed
bun run start:dev
```

La API estará disponible en `http://localhost:4000/api`.

## Frontend local

En otra terminal, desde la raíz:

```bash
cp frontend/.env.example frontend/.env
cd frontend
bun install
bun run dev
```

El frontend estará disponible en `http://localhost:3000`.

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---:|---|
| `DATABASE_URL` | Sí | Cadena de conexión PostgreSQL |
| `DIRECT_URL` | No | Conexión Session Pooler para migraciones Prisma |
| `JWT_SECRET` | Sí | Clave utilizada para firmar JWT |
| `JWT_EXPIRES_IN` | No | Duración del token, por ejemplo `1h` |
| `PORT` | No | Puerto HTTP; por defecto `4000` |
| `CORS_ORIGINS` | No | Orígenes permitidos separados por comas |

El archivo `backend/.env.example` contiene valores únicamente para desarrollo local. Nunca subas archivos `.env` ni secretos al repositorio.

## Comandos

| Comando | Uso |
|---|---|
| `bun run start:dev` | Desarrollo con recarga automática |
| `bun run start:debug` | Desarrollo con depurador |
| `bun run build` | Generar Prisma Client y compilar |
| `bun run start:prod` | Ejecutar la compilación de producción |
| `bun run lint` | Ejecutar ESLint |
| `bun run format` | Formatear el código |
| `bun run test` | Ejecutar pruebas unitarias |
| `bun run test:e2e` | Ejecutar pruebas end-to-end |
| `bun run test:cov` | Generar cobertura |
| `bun run prisma:migrate` | Crear/aplicar migraciones en desarrollo |
| `bun run prisma:seed` | Cargar datos iniciales |
| `bun run prisma:generate` | Regenerar Prisma Client |

## Base de datos con Docker

El servicio `db` del `docker-compose.yml` crea PostgreSQL con estos valores locales:

```text
Host:     localhost
Port:     5432
Database: informaticpark
User:     informaticpark
```

Los datos se guardan en el volumen `informaticpark-postgres`.

Detener el contenedor conservando los datos:

```bash
docker compose stop db
```

Eliminar el contenedor y todos los datos locales:

```bash
docker compose down -v
```

## API

### Autenticación

- `POST /api/auth/login` — iniciar sesión y obtener un JWT.
- `GET /api/auth/me` — consultar el usuario autenticado.

Las rutas protegidas requieren:

```http
Authorization: Bearer <token>
```

Las operaciones administrativas requieren el rol `ADMIN`.

### Recursos principales

- `/api/assets` — activos informáticos.
- `/api/custodians` — custodios.
- `/api/locations` — ubicaciones.
- `/api/users` — usuarios.
- `/api/movements` — movimientos y traspasos.

## Documentación interactiva

Swagger está disponible únicamente fuera de producción:

```text
http://localhost:4000/api/docs
```

## Migraciones

Para un entorno existente o de producción, utiliza:

```bash
bunx prisma migrate deploy
```

Las migraciones de producción deben ejecutarse como un paso controlado de despliegue, no de forma repetida en cada build.

## Despliegue

El backend incluye un handler para ejecutarse como función serverless en Vercel. Consulta [`../DEPLOYMENT.md`](../DEPLOYMENT.md) para el procedimiento completo. Antes de desplegar:

1. Configura `DATABASE_URL` con la conexión de PostgreSQL, por ejemplo Supabase.
2. Configura `JWT_SECRET` con un secreto único y seguro.
3. Configura `CORS_ORIGINS` con el dominio real del frontend.
4. Ejecuta las migraciones con `prisma migrate deploy` usando la conexión directa de producción.
5. Verifica `bun run build` y las pruebas antes de publicar.

No uses las credenciales de desarrollo en producción.
