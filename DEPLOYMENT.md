# Despliegue en producción

Arquitectura recomendada:

- Frontend: un proyecto Vercel con raíz `frontend`.
- Backend: otro proyecto Vercel con raíz `backend`.
- Base de datos: PostgreSQL administrado por Supabase.

## 1. Supabase

1. Crea un proyecto en Supabase.
2. Copia las cadenas de conexión desde **Connect**.
3. Usa la conexión poolerada como `DATABASE_URL` para el backend en ejecución.
4. Conserva la conexión directa para ejecutar migraciones de forma controlada.

No publiques ninguna de las cadenas de conexión.

## 2. Migraciones

Desde `backend/`, con la conexión directa de Supabase:

```bash
DATABASE_URL="<SUPABASE_DIRECT_URL>" bunx prisma migrate deploy
```

Ejecuta este comando una vez antes del primer despliegue y después de cada cambio de esquema aprobado. No se ejecuta durante el build de Vercel.

## 3. Backend en Vercel

Crea un proyecto nuevo desde el repositorio y configura:

- **Root Directory:** `backend`
- **Framework Preset:** `Other`
- **Build Command:** `bun run vercel-build`
- **Install Command:** `bun install`

Variables de entorno para `Production`:

```env
DATABASE_URL=<SUPABASE_POOLER_URL>
DIRECT_URL=<SUPABASE_SESSION_POOLER_URL_PORT_5432>
JWT_SECRET=<SECRET_GENERADO_ALEATORIAMENTE>
JWT_EXPIRES_IN=1h
CORS_ORIGINS=https://<FRONTEND_DOMAIN>
NODE_ENV=production
SUPABASE_URL=https://<PROJECT_REF>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>
SUPABASE_STORAGE_BUCKET=actas
SUPABASE_SIGNED_URL_EXPIRES_IN=3600
```

La `SUPABASE_SERVICE_ROLE_KEY` solo debe existir en el backend y nunca debe exponerse al frontend.

La API quedará disponible en:

```text
https://<BACKEND_DOMAIN>.vercel.app/api
```

Prueba mínima:

```bash
curl -i https://<BACKEND_DOMAIN>.vercel.app/api/locations
```

## 4. Frontend en Vercel

Crea otro proyecto desde el mismo repositorio y configura:

- **Root Directory:** `frontend`
- **Framework Preset:** `Next.js`
- **Build Command:** `bun run build`
- **Install Command:** `bun install`

Variable de entorno para `Production`:

```env
NEXT_PUBLIC_BACKEND_URL=https://<BACKEND_DOMAIN>.vercel.app
```

Después de publicar, actualiza `CORS_ORIGINS` del backend con el dominio final del frontend y vuelve a desplegar el backend.

## 5. Lista de comprobación

- [ ] Los secretos no están en Git ni en el navegador.
- [ ] Las migraciones se aplicaron en Supabase.
- [ ] El backend responde a `/api/locations`.
- [ ] El login funciona desde el dominio del frontend.
- [ ] `CORS_ORIGINS` coincide exactamente con el dominio publicado.
- [ ] `bun run build` pasa en frontend y backend.
- [ ] Se configuraron límites, logs y alertas en Vercel y Supabase.
